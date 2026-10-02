import { ImageProviderError } from './image-provider.js';

// Implement this adapter when the internal API request/auth/response schema is known.
// Read service-specific environment variables in this factory, not in shared config.
export function createProvider({ env, timeoutMs, fetchImpl }) {
  return {
    getStatus: () => ({ ready: false, mode: 'image', label: 'Internal', message: 'Internal API adapter is not implemented yet. Use mock to preview analysis and prompts.' }),
    async generate({ prompt, referenceSheet, agent, interpretation, variation }) {
      throw new ImageProviderError('Implement the internal API contract in server/providers/internal.provider.js.', { status: 503, code: 'INTERNAL_NOT_CONFIGURED' });
    },
  };
}
