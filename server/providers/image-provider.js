export class ImageProviderError extends Error {
  constructor(message, { status = 502, code = 'PROVIDER_ERROR', retryAfter = 0 } = {}) {
    super(message);
    Object.assign(this, { status, code, retryAfter });
  }
}

export function parseRetryAfter(value, now = Date.now()) {
  const seconds = Number(value);
  if (value && Number.isFinite(seconds)) return Math.max(1, Math.ceil(seconds));
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(1, Math.ceil((date - now) / 1000)) : 60;
}

/**
 * @typedef {Object} ImageProvider
 * @property {() => {ready: boolean, mode: 'image'|'preview', label: string, model?: string, message?: string}} getStatus
 * @property {(input: {prompt: string, referenceSheet: Buffer, referenceCount: number, agent: Object, interpretation: Object, variation: Object}) => Promise<{kind: 'image', image: Buffer, revisedPrompt?: string|null}|{kind: 'preview'}>} generate
 *
 * Each <name>.provider.js exports createProvider({env, timeoutMs, fetchImpl}).
 * Adapters own authentication, request mapping, and PNG normalization. They must
 * not automatically retry billable requests. Never include secrets in status/errors.
 */
export async function createImageProvider(config, fetchImpl = fetch) {
  const name = config.provider || 'mock';
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('Invalid IMAGE_PROVIDER name.');
  let module;
  try { module = await import(new URL(`./${name}.provider.js`, import.meta.url)); }
  catch { throw new Error(`Cannot load image provider "${name}". Add server/providers/${name}.provider.js.`); }
  if (typeof module.createProvider !== 'function') throw new Error('Provider must export createProvider().');
  const provider = await module.createProvider({ env: config.env || {}, timeoutMs: config.timeoutMs, fetchImpl });
  if (typeof provider?.generate !== 'function' || typeof provider?.getStatus !== 'function') throw new Error('Provider must implement getStatus() and generate().');
  getProviderStatus(provider);
  return provider;
}

export function getProviderStatus(provider) {
  const value = provider.getStatus();
  if (typeof value.ready !== 'boolean' || !['image', 'preview'].includes(value.mode)) throw new Error('Invalid provider status.');
  // Whitelist public status fields; do not forward arbitrary adapter configuration.
  return { configured: value.ready, mode: value.mode, label: value.label || 'Image provider', model: value.model || null, message: value.message || '' };
}
