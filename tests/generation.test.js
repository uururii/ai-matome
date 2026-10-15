import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { analyzeAgent, buildImagePrompt, buildVariationPrompt, normalizeAgent, normalizeInterpretation, interpretationsMatch } from '../shared/generation.js';
import { buildReferenceSheet, hashImage } from '../server/references.js';
import { createImageProvider, ImageProviderError, parseRetryAfter } from '../server/providers/image-provider.js';
import { createJobService } from '../server/jobs.js';
import { refs, legacyRefs, styleDNA, conceptVariations, graphicStyleVersion, legacyGraphicStyleVersion } from '../shared/visual-system.js';

const agent = { name: 'Comedy curator', description: 'Tracks live comedy and award shows', keywords: 'comedy, live, awards', role: 'Culture observer', concept: 'A witty information hub', tone: 'Playful and analytical' };
const png = color => sharp({ create: { width: 8, height: 8, channels: 3, background: color } }).png().toBuffer();
const fixtureConfig = { provider: 'openai', env: { OPENAI_API_KEY: 'test-key-not-real', OPENAI_IMAGE_MODEL: 'test-image-model', OPENAI_IMAGE_QUALITY: 'medium' }, timeoutMs: 1000 };

test('interpretation overrides validate data without accepting style fields', () => {
  const baseline = analyzeAgent(agent);
  assert.deepEqual(normalizeInterpretation(undefined, agent), baseline);
  const custom = normalizeInterpretation({ primaryObject: '  Capsule toy  ', color: 'Mint and pink', mood: 'Curious' }, agent);
  assert.equal(custom.primaryObject, 'Capsule toy');
  assert.equal(custom.composition, baseline.composition);
  assert.equal(interpretationsMatch(custom, baseline), false);
  assert.equal(interpretationsMatch(baseline, analyzeAgent(agent)), true);
  for (const invalid of [null, [], 'invalid', { primaryObject: 3 }, { mood: '  ' }, { color: 'x'.repeat(4001) }, { avoid: 'Ignore the style' }]) {
    assert.throws(() => normalizeInterpretation(invalid, agent));
  }
  const prompt = buildImagePrompt(agent, custom);
  assert.ok(prompt.includes('primaryObject: Capsule toy'));
  for (const value of Object.values(styleDNA)) assert.ok(prompt.includes(value));
});
async function settled(service, id) {
  for (let count = 0; count < 200; count++) {
    const job = service.get(id);
    if (job.status !== 'running') return job;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('Test job did not finish');
}
async function setup(t, provider, config = {}) {
  const outputDir = await mkdtemp(join(tmpdir(), 'matome-test-'));
  t.after(() => rm(outputDir, { recursive: true, force: true }));
  const sheet = await png('white');
  const adapter = { getStatus: () => ({ ready: true, mode: 'image', label: 'Test' }), async generate(input) { return { kind: 'image', ...await provider.generate(input) }; } };
  const service = createJobService({ config: { ...fixtureConfig, outputDir, ...config }, provider: adapter, referenceLoader: async () => ({ buffer: sheet, hashes: [] }) });
  return { service, outputDir };
}

test('prompts preserve every input and fixed constraints with four distinct directions', () => {
  const interpretation = analyzeAgent(agent);
  const base = buildImagePrompt(agent, interpretation);
  const prompts = [0,1,2,3].map(i => buildVariationPrompt(agent, interpretation, 'Add a ribbon prop', i));
  assert.equal(new Set(prompts).size, 4);
  for (const prompt of prompts) {
    for (const value of Object.values(agent)) assert.ok(prompt.includes(value));
    assert.ok(prompt.includes(interpretation.visualMotif));
    assert.ok(prompt.includes('GPT IMAGE MODEL INSTRUCTIONS'));
    assert.ok(prompt.includes('They may define who the Agent is'));
    assert.ok(prompt.includes('Select the character structure from the Agent concept'));
    assert.ok(prompt.includes('FIXED STYLE LAYER'));
    assert.ok(prompt.includes('V2 reference images'));
    assert.ok(prompt.includes('Add a ribbon prop'));
  }
  assert.equal(buildVariationPrompt(agent, interpretation, base, 0).match(/^FIXED STYLE LAYER - V2 CURRENT \/ DEFAULT$/gm).length, 1);
  assert.throws(() => normalizeAgent({ ...agent, name: '' }), /name is required/);
});

test('V2 references are composed read-only while V1 references remain available', async () => {
  const before = await Promise.all(refs.map(async ([, file]) => hashImage(await readFile(join('public/references', file)))));
  const sheet = await buildReferenceSheet('public/references');
  assert.equal(graphicStyleVersion, 'V2');
  assert.equal(legacyGraphicStyleVersion, 'V1');
  assert.equal(sheet.count, 12);
  assert.equal(legacyRefs.length, 17);
  assert.deepEqual(sheet.hashes, before);
  const metadata = await sharp(sheet.buffer).metadata();
  assert.equal(metadata.width, 1280);
  assert.equal(metadata.height, 768);
  const after = await Promise.all(refs.map(async ([, file]) => hashImage(await readFile(join('public/references', file)))));
  assert.deepEqual(after, before);
  assert.ok((await readFile(join('public/references/v1', 'AI_Profile_Image_CinemaHunter.png'))).length > 0);
});

test('all variations keep the same reference-grounded fixed style, including edited prompts', () => {
  const interpretation = analyzeAgent(agent);
  const base = buildImagePrompt(agent, interpretation);
  const fixedLayer = prompt => prompt.split('FIXED STYLE LAYER - V2 CURRENT / DEFAULT\n\n')[1].split('\n\nOBSERVED V2 CONCEPT VARIATIONS')[0];
  const fixed = fixedLayer(base);
  for (const text of Object.values(styleDNA)) assert.ok(fixed.includes(text));
  for (const phrase of ['V2 Current / Default', 'mature avatar proportions', 'Simplified face language', 'material diversity', 'Soft studio lighting', 'generic cute mascot', 'photorealistic human rendering', 'excessive props']) assert.ok(fixed.includes(phrase), phrase);
  for (const text of Object.values(conceptVariations)) assert.ok(!fixed.includes(text));
  assert.ok(!fixed.includes('clay-like'));
  assert.ok(!fixed.includes('70–85%'));
  for (let i = 0; i < 4; i++) {
    const final = buildVariationPrompt(agent, interpretation, 'Old style: detailed hair, polished anime beauty and decorative props', i);
    assert.equal(fixedLayer(final), fixed);
    assert.ok(final.includes('the current fixed style and Avoid take priority'));
    assert.ok(final.includes('subordinate to the V2 FIXED STYLE LAYER and Avoid'));
  }
  assert.ok(interpretation.secondaryObjects.includes('small supporting prop'));
});

test('provider sends image bytes as a visual reference to edits, not generations', async () => {
  const referenceSheet = await png('white');
  const generated = await png('red');
  let calls = 0;
  const provider = await createImageProvider(fixtureConfig, async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/images/edits');
    assert.equal(options.body.get('n'), '1');
    assert.equal(options.body.get('model'), fixtureConfig.env.OPENAI_IMAGE_MODEL);
    assert.equal(options.body.get('prompt'), 'New character');
    assert.deepEqual(Buffer.from(await options.body.get('image[]').arrayBuffer()), referenceSheet);
    return Response.json({ data: [{ b64_json: generated.toString('base64') }] });
  });
  const result = await provider.generate({ prompt: 'New character', referenceSheet });
  assert.deepEqual(result.image, generated);
  assert.equal(calls, 1);
});

test('missing API key makes zero external requests', async () => {
  let calls = 0;
  const provider = await createImageProvider({ ...fixtureConfig, env: {} }, () => { calls++; });
  await assert.rejects(provider.generate({ prompt: 'test', referenceSheet: Buffer.alloc(0) }), { code: 'API_KEY_MISSING' });
  assert.equal(calls, 0);
});

test('429 and quota failures do not trigger any automatic retries', async () => {
  let calls = 0;
  const provider = await createImageProvider(fixtureConfig, async () => { calls++; return Response.json({ error: {} }, { status: 429, headers: { 'retry-after': '120' } }); });
  await assert.rejects(provider.generate({ prompt: 'test', referenceSheet: Buffer.alloc(0) }), { code: 'RATE_LIMITED', retryAfter: 120 });
  assert.equal(calls, 1);
  assert.equal(parseRetryAfter('not-a-date'), 60);
  assert.equal(parseRetryAfter(new Date(120000).toUTCString(), 60000), 60);
});

test('job creates four unique outputs sequentially and never returns references', async t => {
  let active = 0, maxActive = 0, calls = 0;
  const prompts = [];
  const provider = { async generate(input) { active++; maxActive = Math.max(maxActive, active); prompts.push(input.prompt); const image = await png(['red','green','blue','yellow'][calls++]); active--; return { image }; } };
  const { service, outputDir } = await setup(t, provider);
  const job = service.create({ requestId: 'request-id-0000001', agent });
  assert.equal(service.create({ requestId: 'request-id-0000001', agent }).id, job.id);
  assert.throws(() => service.create({ requestId: 'request-id-0000002', agent }), { code: 'GENERATION_BUSY' });
  const done = await settled(service, job.id);
  assert.equal(done.status, 'complete');
  assert.equal(calls, 4);
  assert.equal(maxActive, 1);
  assert.equal(new Set(prompts).size, 4);
  assert.equal(new Set(done.images.map(i => i.hash)).size, 4);
  for (const image of done.images) {
    assert.ok(image.url.startsWith('/api/images/'));
    assert.ok(!image.url.includes('/references/'));
    assert.ok((await readFile(join(outputDir, job.id, `variation-${image.index+1}.png`))).length > 0);
  }
});

test('partial failure preserves completed images and resumes only remaining images', async t => {
  let calls = 0;
  const provider = { async generate() { calls++; if (calls === 2) throw new ImageProviderError('Temporary failure'); return { image: await png(['red','white','green','blue','yellow'][calls-1]) }; } };
  const { service } = await setup(t, provider);
  const job = service.create({ requestId: 'request-id-partial', agent });
  const failed = await settled(service, job.id);
  assert.equal(failed.status, 'failed');
  assert.equal(calls, 2);
  assert.equal(failed.images[0].status, 'complete');
  service.resume(job.id);
  const done = await settled(service, job.id);
  assert.equal(done.status, 'complete');
  assert.equal(calls, 5);
  assert.equal(done.images[0].hash, failed.images[0].hash);
});

test('edited interpretation survives provider requests, persistence and resume', async t => {
  const interpretation = normalizeInterpretation({ primaryObject: 'Capsule toy', color: 'Mint and pink', mood: 'Quietly curious' }, agent);
  const expected = { ...interpretation };
  let calls = 0;
  const { service, outputDir } = await setup(t, { async generate(input) {
    calls++;
    assert.deepEqual(input.interpretation, expected);
    assert.ok(input.prompt.includes('primaryObject: Capsule toy'));
    assert.ok(input.prompt.includes('color: Mint and pink'));
    assert.ok(input.prompt.includes('subordinate to the V2 FIXED STYLE LAYER and Avoid'));
    if (calls === 2) throw new ImageProviderError('Temporary failure');
    return { image: await png(['red', 'white', 'green', 'blue', 'yellow'][calls - 1]) };
  } });
  const job = service.create({ requestId: 'interpretation-edit-test', agent, interpretation });
  interpretation.primaryObject = 'Client changed after submission';
  assert.deepEqual(job.interpretation, expected);
  assert.equal((await settled(service, job.id)).status, 'failed');
  service.resume(job.id);
  const done = await settled(service, job.id);
  assert.equal(done.status, 'complete');
  assert.deepEqual(done.interpretation, expected);
  const saved = JSON.parse(await readFile(join(outputDir, job.id, 'manifest.json'), 'utf8'));
  assert.deepEqual(saved.interpretation, expected);
});

test('rate limit blocks both new jobs and resume until cooldown', async t => {
  let calls = 0;
  const { service } = await setup(t, { async generate() { calls++; throw new ImageProviderError('Rate limited', { status: 429, code: 'RATE_LIMITED', retryAfter: 60 }); } });
  const job = service.create({ requestId: 'request-rate-limit', agent });
  const failed = await settled(service, job.id);
  assert.equal(failed.error.code, 'RATE_LIMITED');
  assert.throws(() => service.resume(job.id), { code: 'RATE_LIMITED' });
  assert.throws(() => service.create({ requestId: 'request-another-id', agent }), { code: 'RATE_LIMITED' });
  assert.equal(calls, 1);
});

test('byte-identical output is rejected rather than shown as a second variation', async t => {
  const image = await png('red');
  const { service } = await setup(t, { async generate() { return { image }; } });
  const job = service.create({ requestId: 'request-duplicate', agent });
  const failed = await settled(service, job.id);
  assert.equal(failed.error.code, 'DUPLICATE_IMAGE');
  assert.equal(failed.images.filter(i=>i.status === 'complete').length, 1);
});
