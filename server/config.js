import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export function loadConfig() {
  const envFile = resolve(projectRoot, '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  return {
    provider: process.env.IMAGE_PROVIDER || 'mock',
    env: { ...process.env },
    port: Number(process.env.API_PORT || 8787),
    timeoutMs: 240_000,
    referencesDir: resolve(projectRoot, 'public/references'),
    outputDir: resolve(projectRoot, 'server/output'),
  };
}
