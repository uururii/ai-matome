import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig } from './config.js';
import { createImageProvider, ImageProviderError } from './providers/image-provider.js';
import { createJobService } from './jobs.js';

const uuidPattern = '[a-f0-9-]{36}';
function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}
async function readJson(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new Error('Content-Type must be application/json.');
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 200_000) throw new Error('Request is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function createApiServer(config, provider) {
  provider ??= await createImageProvider(config);
  const jobs = createJobService({ config, provider });
  return createServer(async (req, res) => {
    try {
      // Local-only tool: do not let arbitrary websites trigger paid generations.
      const host = new URL(`http://${req.headers.host}`).hostname;
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) return send(res, 403, { error: { message: 'Local requests only.' } });
      if (req.headers.origin && !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(req.headers.origin).hostname)) return send(res, 403, { error: { message: 'Local requests only.' } });
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && path === '/api/status') return send(res, 200, jobs.status());
      if (req.method === 'POST' && path === '/api/generations') return send(res, 202, jobs.create(await readJson(req)));
      const jobMatch = path.match(new RegExp(`^/api/generations/(${uuidPattern})(/resume)?$`));
      if (jobMatch) {
        if (req.method === 'POST' && jobMatch[2]) {
          await readJson(req);
          return send(res, 202, jobs.resume(jobMatch[1]));
        }
        if (req.method === 'GET' && !jobMatch[2]) {
          const job = jobs.get(jobMatch[1]);
          return send(res, job ? 200 : 404, job || { error: { message: 'Generation not found. The server may have restarted.' } });
        }
      }
      const imageMatch = path.match(new RegExp(`^/api/images/(${uuidPattern})/(variation-[1-4]\\.png)$`));
      if (req.method === 'GET' && imageMatch) {
        try {
          const image = await readFile(join(config.outputDir, imageMatch[1], imageMatch[2]));
          res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Disposition': `inline; filename="${imageMatch[2]}"`, 'X-Content-Type-Options': 'nosniff' });
          return res.end(image);
        } catch { return send(res, 404, { error: { message: 'Image not found.' } }); }
      }
      send(res, 404, { error: { message: 'Not found.' } });
    } catch (error) {
      if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
      send(res, error instanceof ImageProviderError ? error.status : 400, { error: { code: error.code || 'INVALID_REQUEST', message: error.message, retryAt: error.retryAfter ? Date.now() + error.retryAfter * 1000 : 0 } });
    }
  });
}

export async function startApiServer(config = loadConfig()) {
  const server = await createApiServer(config);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.port, '127.0.0.1', resolve); });
  console.log(`Matome API listening on http://127.0.0.1:${config.port} (provider: ${config.provider})`);
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startApiServer().catch(error => { console.error(error.code === 'EADDRINUSE' ? 'API port is already in use. Set API_PORT in .env.' : 'Could not start the API server. Check .env settings.'); process.exitCode = 1; });
}
