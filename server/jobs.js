import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { normalizeAgent, normalizeInterpretation, buildVariationPrompt, variationPlans } from '../shared/generation.js';
import { buildReferenceSheet, hashImage } from './references.js';
import { ImageProviderError, getProviderStatus } from './providers/image-provider.js';

export function createJobService({ config, provider, referenceLoader = () => buildReferenceSheet(config.referencesDir) }) {
  const jobs = new Map();
  let activeId = null;
  let retryAt = 0;
  const snapshot = job => JSON.parse(JSON.stringify(job));
  function ensureAvailable() {
    const status = getProviderStatus(provider);
    if (!status.configured) throw new ImageProviderError(status.message || 'The selected provider needs configuration.', { status: 503, code: 'PROVIDER_NOT_CONFIGURED' });
    if (Date.now() < retryAt) throw new ImageProviderError('Wait before sending another image request.', { status: 429, code: 'RATE_LIMITED', retryAfter: Math.ceil((retryAt - Date.now()) / 1000) });
    if (activeId) throw new ImageProviderError('A generation is already running. Wait for it to finish.', { status: 409, code: 'GENERATION_BUSY' });
  }
  async function persist(job) {
    await writeFile(join(config.outputDir, job.id, 'manifest.json'), JSON.stringify(job, null, 2));
  }
  async function run(job) {
    let current;
    try {
      await mkdir(join(config.outputDir, job.id), { recursive: true });
      const references = await referenceLoader();
      job.referenceCount = references.count || job.referenceCount || 0;
      const forbidden = new Set([...references.hashes, hashImage(references.buffer), ...job.images.filter(i => i.hash).map(i => i.hash)]);
      for (const image of job.images) {
        if (['complete', 'preview'].includes(image.status)) continue;
        current = image;
        image.status = 'generating';
        await persist(job);
        const result = await provider.generate({ prompt: image.prompt, referenceSheet: references.buffer, referenceCount: references.count || 0, agent: job.agent, interpretation: job.interpretation, variation: { index: image.index, title: image.title, why: image.why } });
        if (result.kind === 'preview' && job.mode === 'preview') {
          image.status = 'preview';
          await persist(job);
          continue;
        }
        if (result.kind !== 'image' || job.mode !== 'image' || !Buffer.isBuffer(result.image) || !result.image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
          throw new ImageProviderError('Provider returned an invalid result. Image adapters must return PNG bytes; preview adapters must return a preview result.', { code: 'INVALID_PROVIDER_RESULT' });
        }
        const hash = hashImage(result.image);
        if (forbidden.has(hash)) throw new ImageProviderError('A duplicate image was returned. It was not accepted; manually resume to request a new variation.', { code: 'DUPLICATE_IMAGE' });
        forbidden.add(hash);
        const filename = `variation-${image.index + 1}.png`;
        await writeFile(join(config.outputDir, job.id, filename), result.image, { flag: 'wx' });
        Object.assign(image, { status: 'complete', hash, revisedPrompt: result.revisedPrompt, url: `/api/images/${job.id}/${filename}` });
        await persist(job);
      }
      job.status = 'complete';
    } catch (error) {
      if (current && !['complete', 'preview'].includes(current.status)) current.status = 'failed';
      if (error.retryAfter) retryAt = Date.now() + error.retryAfter * 1000;
      job.status = 'failed';
      job.error = { code: error.code || 'GENERATION_FAILED', message: error instanceof ImageProviderError ? error.message : 'Generation could not complete. Check local reference files and output folder permissions.', retryAt };
    } finally {
      try { await persist(job); } catch { /* The API still returns the in-memory failure state. */ }
      activeId = null;
    }
  }
  return {
    status: () => ({ ...getProviderStatus(provider), provider: config.provider || 'mock', activeJobId: activeId, retryAt }),
    get(id) { const job = jobs.get(id); return job ? snapshot(job) : null; },
    create(input) {
      if (!input || typeof input !== 'object') throw new Error('A generation request is required.');
      if (typeof input.requestId !== 'string' || !/^[\w-]{16,80}$/.test(input.requestId)) throw new Error('A valid request ID is required.');
      const existing = [...jobs.values()].find(j => j.requestId === input.requestId);
      if (existing) return snapshot(existing);
      ensureAvailable();
      const agent = normalizeAgent(input.agent);
      if (input.prompt != null && (typeof input.prompt !== 'string' || input.prompt.length > 24000)) throw new Error('Prompt must be text of 24,000 characters or fewer.');
      const interpretation = normalizeInterpretation(input.interpretation, agent);
      const job = {
        id: randomUUID(), requestId: input.requestId, createdAt: new Date().toISOString(), status: 'running', error: null,
        agent, interpretation, sourcePrompt: input.prompt || '', provider: config.provider || 'mock', mode: getProviderStatus(provider).mode, model: getProviderStatus(provider).model, referenceCount: 0,
        styleVersion: input.styleVersion === 'v1' ? 'v1' : 'v2',
        images: variationPlans.map((plan, index) => ({ index, title: plan.title, why: plan.why, status: 'pending', url: null, prompt: buildVariationPrompt(agent, interpretation, input.prompt || '', index, { styleVersion: input.styleVersion }) })),
      };
      // Bound memory while retaining all completed images and manifests on disk.
      if (jobs.size >= 30) jobs.delete(jobs.keys().next().value);
      jobs.set(job.id, job);
      activeId = job.id;
      void run(job);
      return snapshot(job);
    },
    resume(id) {
      const job = jobs.get(id);
      if (!job) throw new ImageProviderError('Generation not found. Start a new generation.', { status: 404 });
      if (job.status === 'complete' || job.status === 'running') return snapshot(job);
      ensureAvailable();
      job.status = 'running';
      job.error = null;
      for (const image of job.images) if (!['complete', 'preview'].includes(image.status)) image.status = 'pending';
      activeId = id;
      void run(job);
      return snapshot(job);
    },
  };
}
