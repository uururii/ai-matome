# AI Matome Agent Profile Generator

Local React/Vite tool with a Node.js image generation server. Node.js 22.15+ is required.

## Setup

### Public prompt-only site

Run `npm run build:public` to create `dist-public/`, a standalone static site.
It includes agent analysis, editable interpretation, language views, four prompt
variations, copying, and the existing 17-image reference library. Anyone with the
public URL can use it without signing in. The library images and bundled style
rules are public as well; this is not an access-controlled site.

The public build runs all prompt preparation in each visitor's browser. It makes
no generation API requests, stores no agent inputs on a server, and does not need
an API key. Inputs/results are in page memory only and disappear on reload.
It does not generate actual images; users can copy prompts into their image tool.
Prompt text alone does not attach reference images to that tool.

For a manual deployment, upload **only `dist-public/`** at
https://app.netlify.com/drop while signed into your hosting account, then share
the HTTPS URL provided by the host. Do not upload the project root, `.env`, or
`server/output/`. The computer does not need to stay on after deployment.
Rebuild and upload again to publish later changes. Hosting plan limits apply.

For a Git-connected Netlify deployment, `netlify.toml` selects the public build
and output directory. No environment secrets or backend are needed. Run
`npm run preview:public` to check the built site locally without starting the API.

### Local app with optional image provider

1. Install dependencies with `npm install`.
2. Create `.env` in the project root using `.env.example` as the template.
3. Keep `IMAGE_PROVIDER=mock` to run without any API key. Select `openai` only when using OpenAI, or `internal` when implementing your internal service adapter. Never use a `VITE_` prefix for credentials.
4. Run `npm run dev` to start both the local API and web app. Open the URL printed by Vite.
5. Restart the app after changing `.env`.

No external API is required to start the app, analyze an agent, or preview all four final prompts. Analysis is local and rule-based. The `mock` provider makes no external requests and produces no image files; each variation shows its exact prompt and can be copied. Selection/download remain disabled because preview results are not images.

The optional `openai` adapter uses Images Edits, `POST https://api.openai.com/v1/images/edits`. The `internal` adapter is an explicit unconfigured scaffold: its API schema has not been assumed and it makes no requests. Selecting an unconfigured adapter does not prevent the app from starting or local agent analysis; only generation is disabled.

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `IMAGE_PROVIDER` | `mock` | `mock`, `internal`, `openai`, or an added adapter filename |
| `OPENAI_API_KEY` | none | Required only by the optional OpenAI adapter |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2.5-sunburst` | Image model accessible to your project |
| `OPENAI_IMAGE_QUALITY` | `medium` | `low`, `medium`, `high`, or `auto` |
| `API_PORT` | `8787` | Local backend port |

Only the OpenAI adapter requires an OpenAI API project with image-model access and billing/quota. OpenAI environment variables are ignored by the mock and internal adapters. No paid requests occur on page load, analysis, status checks, or build/test. Restart the API server after switching providers.

## Add a provider in one file

Create `server/providers/<name>.provider.js` and set `IMAGE_PROVIDER=<name>`. The loader discovers the file by name: no registry, shared config, job logic, or UI changes are needed. Only the selected adapter is imported.

Export `createProvider({ env, timeoutMs, fetchImpl })` returning this interface:

```js
export function createProvider({ env, timeoutMs, fetchImpl }) {
  // Read your service-specific settings from env here.
  return {
    getStatus() {
      return {
        ready: false, // true when your adapter is configured
        mode: 'image', // 'preview' for prompt-only adapters
        label: 'My service',
        model: null,
        message: 'Configure the service adapter.',
      };
    },
    async generate({ prompt, referenceSheet, referenceCount, agent, interpretation, variation }) {
      // Use fetchImpl to implement the confirmed service's auth and payload schema.
      // referenceSheet is a PNG Buffer with all 17 references; do not omit it.
      // Normalize the service response to a PNG Buffer before returning:
      // return { kind: 'image', image: pngBuffer, revisedPrompt: null };
      throw new Error('Implement the confirmed API contract here.');
    },
  };
}
```

`variation` includes its index, title and concept rationale. `prompt` is the complete, style-constrained final prompt. A preview adapter returns `{ kind: 'preview' }`, never a reference image or fake generated image. Image adapters return `{ kind: 'image', image: Buffer, revisedPrompt?: string }`; convert URL/JPEG/WebP responses inside the adapter. Do not expose credentials in status or errors. For actionable failures throw `ImageProviderError` from `image-provider.js`, with optional `status`, `code`, and `retryAfter` in seconds. Do not implement automatic retries inside adapters.

## Generation flow

- `shared/visual-system.js`: visual style and 17-agent reference catalog; local rule-based agent analysis. No text-model API required.
- `shared/generation.js`: all six agent inputs + analyzed concept + fixed style guide + reference directions + four distinct composition plans. Editing the prompt adds creative direction but never removes fixed style requirements.
- `server/references.js`: reads all 17 originals and creates one contact sheet in memory. Originals are never changed. All 17 references are sent as image content, not returned as generated results.
- `server/providers/image-provider.js`: provider interface, dynamic loader, public status validation and common errors; no OpenAI-specific logic.
- `server/providers/mock.provider.js`: offline analysis and prompt preview results, no API key.
- `server/providers/internal.provider.js`: one-file integration point awaiting the internal API specification.
- `server/providers/openai.provider.js`: optional OpenAI implementation; owns all OpenAI settings and authentication.
- `server/jobs.js`: four sequential requests, separate variation prompts, no automatic provider retries. Saves only provider-produced PNGs and exact prompts in `server/output/<job-id>/`.
- `src/lib/generation-client.js`: local API calls and status retrieval. Browser never receives the API key.

In mock mode, `Preview 4 variations` creates four final prompt previews and a local manifest without images or network access. With a real adapter, `Generate 4 variations` creates a four-image job. The browser polls only the local job status. On a failure, completed images remain available. `Resume remaining images` requests only missing images, preserving completed ones. `Regenerate all` starts four fresh requests. Real-provider actions may incur API costs. A 429 stops the job, respects the adapter's retry delay, and requires a manual retry. Identical returned image bytes are rejected; semantic diversity and style fidelity still require visual review.

Generated PNGs and prompt manifests survive a server restart on disk; live job state and the rate-limit cooldown are in memory. After a server restart, old jobs cannot be resumed through the UI. Keep the process running during generation; download selected outputs or use the output folder. This is a loopback-only local prototype, not a public multi-user service.

## Commands

- `npm run dev`: API server and Vite together.
- `npm run dev:api`: standalone API server, useful with an existing Vite process.
- `npm run build`: build the UI.
- `npm run preview`: preview the built UI; run the API server separately.
- `npm test`: offline tests with mocked provider responses; never calls OpenAI.

Official API reference: https://developers.openai.com/api/docs/guides/image-generation
