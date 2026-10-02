import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { createApiServer } from '../server/index.js';

test('local HTTP API creates, polls and serves only generated images', async t => {
  const outputDir = await mkdtemp(join(tmpdir(), 'matome-http-'));
  let calls = 0;
  const config = { provider: 'openai', apiKey: 'test-only', model: 'test-model', referencesDir: 'public/references', outputDir };
  const server = await createApiServer(config, { getStatus: () => ({ ready: true, mode: 'image', label: 'Test' }), async generate({ interpretation, prompt }) {
    assert.equal(interpretation.primaryObject, 'A small ceramic telescope');
    assert.ok(prompt.includes('A small ceramic telescope'));
    assert.ok(prompt.includes('FIXED STYLE LAYER'));
    return { kind: 'image', image: await sharp({ create: { width: 8, height: 8, channels: 3, background: ['red','blue','green','yellow'][calls++] } }).png().toBuffer() };
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(outputDir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const status = await (await fetch(`${base}/api/status`)).json();
  assert.equal(status.configured, true);
  assert.ok(!JSON.stringify(status).includes('test-only'));
  const headers = { 'Content-Type': 'application/json' };
  const body = JSON.stringify({ requestId: 'http-request-test1', agent: { name: 'Science guide', description: 'Curates science news', keywords: 'science, discovery' }, interpretation: { primaryObject: 'A small ceramic telescope' } });
  const blocked = await fetch(`${base}/api/generations`, { method: 'POST', headers: { ...headers, Origin: 'https://unrelated.example' }, body });
  assert.equal(blocked.status, 403);
  assert.equal(calls, 0);
  const created = await fetch(`${base}/api/generations`, { method: 'POST', headers, body });
  assert.equal(created.status, 202);
  let job = await created.json();
  for (let i = 0; i < 200 && job.status === 'running'; i++) {
    await new Promise(resolve => setTimeout(resolve, 10));
    job = await (await fetch(`${base}/api/generations/${job.id}`)).json();
  }
  assert.equal(job.status, 'complete');
  assert.equal(job.interpretation.primaryObject, 'A small ceramic telescope');
  assert.equal(calls, 4);
  const result = await fetch(base + job.images[0].url);
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('content-type'), 'image/png');
  assert.ok((await result.arrayBuffer()).byteLength > 0);
});
