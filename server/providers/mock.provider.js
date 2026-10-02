/** Offline prompt preview. No credentials, network requests, or fabricated images. */
export function createProvider() {
  return {
    getStatus: () => ({ ready: true, mode: 'preview', label: 'Mock', message: 'Offline mode: analysis and four final prompts. No images or API calls.' }),
    async generate() { return { kind: 'preview' }; },
  };
}
