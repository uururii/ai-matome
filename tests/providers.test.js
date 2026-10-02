import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createImageProvider, getProviderStatus } from '../server/providers/image-provider.js';
import { createJobService } from '../server/jobs.js';

test('mock runs all four final prompts without any keys or network', async t => {
  const outputDir = await mkdtemp(join(tmpdir(), 'matome-mock-'));
  t.after(() => rm(outputDir, { recursive: true, force: true }));
  let networkCalls = 0;
  const config = { provider: 'mock', env: {}, outputDir, referencesDir: 'public/references' };
  const provider = await createImageProvider(config, () => { networkCalls++; throw new Error('No network allowed'); });
  const service = createJobService({ config, provider });
  assert.equal(service.status().configured, true);
  assert.equal(service.status().mode, 'preview');
  const agent = { name: 'Space curator', description: 'A guide to space research', keywords: 'space, rockets', role: 'Research guide', concept: 'Discovery desk', tone: 'Curious' };
  const created = service.create({ requestId: randomUUID(), agent });
  let job;
  for (let i = 0; i < 200; i++) {
    job = service.get(created.id);
    if (job.status !== 'running') break;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.equal(job.status, 'complete');
  assert.equal(job.mode, 'preview');
  assert.ok(job.interpretation.visualMotif.includes(agent.concept));
  assert.equal(new Set(job.images.map(i => i.prompt)).size, 4);
  for (const image of job.images) {
    assert.equal(image.status, 'preview');
    assert.equal(image.url, null);
    for (const value of Object.values(agent)) assert.ok(image.prompt.includes(value));
    assert.ok(image.prompt.includes('Simple stylized 3D mascot/avatar'));
    assert.ok(image.prompt.includes('Anime-style character beauty'));
    assert.ok(image.prompt.includes('OBSERVED CONCEPT VARIATIONS'));
  }
  assert.equal(networkCalls, 0);
  assert.deepEqual(await readdir(join(outputDir, job.id)), ['manifest.json']);
  const saved = JSON.parse(await readFile(join(outputDir, job.id, 'manifest.json'), 'utf8'));
  assert.equal(saved.images.length, 4);
});

test('default provider is mock; optional adapters report missing setup without network', async () => {
  let calls = 0;
  const noNetwork = () => { calls++; throw new Error('No network'); };
  assert.equal(getProviderStatus(await createImageProvider({ env: {} }, noNetwork)).mode, 'preview');
  for (const name of ['openai', 'internal']) {
    const provider = await createImageProvider({ provider: name, env: {} }, noNetwork);
    assert.equal(getProviderStatus(provider).configured, false);
    await assert.rejects(provider.generate({ prompt: 'test', referenceSheet: Buffer.alloc(0) }));
  }
  assert.equal(calls, 0);
  await assert.rejects(createImageProvider({ provider: '../config' }), /Invalid/);
});

test('new adapter needs only one file and IMAGE_PROVIDER, without registry changes', async t => {
  const name = `test-${randomUUID()}`;
  const file = new URL(`../server/providers/${name}.provider.js`, import.meta.url);
  t.after(() => rm(file, { force: true }));
  await writeFile(file, `export function createProvider({env}) { return {
    getStatus: () => ({ready: true, mode: 'preview', label: 'Custom', secret: env.CUSTOM_KEY}),
    generate: async () => ({kind: 'preview'})
  }; }`);
  const provider = await createImageProvider({ provider: name, env: { CUSTOM_KEY: 'not-a-real-key' } });
  assert.equal(getProviderStatus(provider).label, 'Custom');
  assert.ok(!JSON.stringify(getProviderStatus(provider)).includes('not-a-real-key'));
  assert.deepEqual(await provider.generate({}), { kind: 'preview' });
});
