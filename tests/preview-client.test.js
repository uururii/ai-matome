import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewClient } from '../src/lib/preview-client.js';
import { analyzeAgent, buildImagePrompt, buildVariationPrompt } from '../shared/generation.js';

const agent = { name: 'Comedy curator', description: 'Tracks live comedy', keywords: 'comedy', role: '', concept: '', tone: '' };
const request = (extra = {}) => ({ agent, requestId: 'public-preview-test-0001', ...extra });

test('public preview produces the same four prompts without network calls', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Network access is forbidden.'); });
  const client = createPreviewClient();
  assert.equal((await client.getGenerationStatus()).mode, 'preview');
  const interpretation = { ...analyzeAgent(agent), primaryObject: 'Mint microphone' };
  const prompt = buildImagePrompt(agent, interpretation) + '\nA curious expression';
  const job = await client.generateProfileImages(request({ interpretation, prompt }));
  assert.equal(job.status, 'complete');
  assert.equal(job.sourcePrompt, prompt);
  assert.equal(job.interpretation.primaryObject, 'Mint microphone');
  assert.equal(job.images.length, 4);
  assert.equal(new Set(job.images.map(image => image.prompt)).size, 4);
  for (const image of job.images) {
    assert.equal(image.status, 'preview');
    assert.equal(image.url, null);
    assert.equal(image.prompt, buildVariationPrompt(agent, interpretation, prompt, image.index));
  }
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test('preview state is isolated per page and snapshots cannot mutate it', async () => {
  const client = createPreviewClient();
  const otherVisitor = createPreviewClient();
  const job = await client.generateProfileImages(request());
  const original = structuredClone(job);
  job.agent.name = 'Changed';
  job.images[0].prompt = 'Changed';
  assert.deepEqual(await client.getGeneration(job.id), original);
  assert.deepEqual(await client.generateProfileImages(request()), original);
  assert.deepEqual(await client.resumeGeneration(job.id), original);
  await assert.rejects(otherVisitor.getGeneration(job.id), { status: 404 });
  const next = await client.generateProfileImages(request({ requestId: 'public-preview-test-0002' }));
  assert.notEqual(next.id, job.id);
  await assert.rejects(client.getGeneration(job.id), { status: 404 });
});

test('public preview enforces agent, interpretation and prompt validation', async () => {
  const client = createPreviewClient();
  for (const invalid of [undefined, request({ requestId: '' }), request({ agent: {} }), request({ interpretation: { avoid: 'Remove fixed style' } }), request({ interpretation: { mood: '' } }), request({ prompt: 42 }), request({ prompt: 'x'.repeat(24001) })]) {
    await assert.rejects(client.generateProfileImages(invalid));
  }
  const job = await client.generateProfileImages(request());
  assert.equal(job.status, 'complete');
});
