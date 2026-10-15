import { normalizeAgent, normalizeInterpretation, buildVariationPrompt, variationPlans } from '../../shared/generation.js';
import { refs } from '../../shared/visual-system.js';

// Each page owns its preview state. Nothing is sent to a server or persisted.
export function createPreviewClient() {
  let latestJob = null;
  const snapshot = value => structuredClone(value);
  const getGeneration = async id => {
    if (!latestJob || latestJob.id !== id) {
      const error = new Error('Preview not found. Prepare the variations again.');
      error.status = 404;
      throw error;
    }
    return snapshot(latestJob);
  };
  return {
    async getGenerationStatus() {
      return { configured: true, mode: 'preview', provider: 'browser-preview', label: 'Prompt preview', model: null, message: '', activeJobId: null, retryAt: 0 };
    },
    getGeneration,
    resumeGeneration: getGeneration,
    async generateProfileImages(input) {
      if (!input || typeof input !== 'object') throw new Error('A preview request is required.');
      if (typeof input.requestId !== 'string' || !/^[\w-]{16,80}$/.test(input.requestId)) throw new Error('A valid request ID is required.');
      if (latestJob?.requestId === input.requestId) return snapshot(latestJob);
      const agent = normalizeAgent(input.agent);
      const interpretation = normalizeInterpretation(input.interpretation, agent);
      if (input.prompt != null && (typeof input.prompt !== 'string' || input.prompt.length > 24000)) throw new Error('Prompt must be text of 24,000 characters or fewer.');
      latestJob = {
        id: input.requestId, requestId: input.requestId, createdAt: new Date().toISOString(),
        status: 'complete', error: null, agent, interpretation, sourcePrompt: input.prompt || '',
        provider: 'browser-preview', mode: 'preview', model: null, referenceCount: refs.length,
        images: variationPlans.map((plan, index) => ({
          index, title: plan.title, why: plan.why, status: 'preview', url: null,
          prompt: buildVariationPrompt(agent, interpretation, input.prompt || '', index),
        })),
      };
      return snapshot(latestJob);
    },
  };
}
