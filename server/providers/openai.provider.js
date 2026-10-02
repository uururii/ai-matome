import { ImageProviderError, parseRetryAfter } from './image-provider.js';

export function createProvider({ env = {}, timeoutMs = 240_000, fetchImpl = fetch }) {
  const config = {
    apiKey: env.OPENAI_API_KEY || '',
    model: env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst',
    quality: env.OPENAI_IMAGE_QUALITY || 'medium',
    timeoutMs,
  };
  return {
    getStatus: () => ({
      ready: Boolean(config.apiKey), mode: 'image', label: 'OpenAI', model: config.model,
      message: config.apiKey ? 'OpenAI image provider configured.' : 'Set OPENAI_API_KEY to use OpenAI, or select IMAGE_PROVIDER=mock.',
    }),
    async generate({ prompt, referenceSheet }) {
      if (!config.apiKey) throw new ImageProviderError('Add OPENAI_API_KEY to the project .env file, then restart the server.', { status: 503, code: 'API_KEY_MISSING' });
      const body = new FormData();
      body.set('model', config.model);
      body.set('prompt', prompt);
      body.set('n', '1');
      body.set('size', '1024x1024');
      body.set('quality', config.quality);
      body.set('output_format', 'png');
      body.append('image[]', new Blob([referenceSheet], { type: 'image/png' }), 'matome-17-style-references.png');
      let response;
      try {
        response = await fetchImpl('https://api.openai.com/v1/images/edits', {
          method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}` }, body,
          signal: AbortSignal.timeout(config.timeoutMs),
        });
      } catch (error) {
        throw new ImageProviderError(error.name === 'TimeoutError' ? 'Image generation timed out. No automatic retry was sent; check API usage before retrying.' : 'Could not reach the image provider. No automatic retry was sent.', { code: 'PROVIDER_CONNECTION' });
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const quota = payload.error?.code === 'insufficient_quota';
          throw new ImageProviderError(quota ? 'API quota is exhausted. Check billing and available credits before retrying.' : 'Image provider rate limit reached. Wait before manually resuming the remaining images.', {
            status: 429, code: quota ? 'QUOTA_EXHAUSTED' : 'RATE_LIMITED', retryAfter: parseRetryAfter(response.headers.get('retry-after')),
          });
        }
        const message = response.status === 401 ? 'The API key was rejected. Check OPENAI_API_KEY and restart the server.'
          : response.status === 403 ? 'This API project cannot access the image model. Check model access and organization verification.'
          : response.status === 400 || response.status === 404 ? 'The image request was rejected. Check model availability, generation settings and prompt content.'
          : 'The image provider returned an error. No automatic retry was sent.';
        throw new ImageProviderError(message, { code: `PROVIDER_${response.status}` });
      }
      const result = await response.json();
      const encoded = result.data?.[0]?.b64_json;
      if (typeof encoded !== 'string' || !encoded.length) throw new ImageProviderError('The provider returned no image.', { code: 'EMPTY_IMAGE' });
      const image = Buffer.from(encoded, 'base64');
      if (!image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new ImageProviderError('The provider returned an invalid PNG.', { code: 'INVALID_IMAGE' });
      return { kind: 'image', image, revisedPrompt: result.data[0].revised_prompt || null };
    },
  };
}
