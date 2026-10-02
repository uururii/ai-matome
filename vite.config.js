import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_');
  const proxy = { '/api': { target: `http://127.0.0.1:${env.API_PORT || 8787}`, changeOrigin: true, timeout: 30000 } };
  return {
  build: { outDir: mode === 'public' ? 'dist-public' : 'dist' },
  plugins: [react(), tailwindcss()],
  resolve: { alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    '@generation-client': fileURLToPath(new URL(mode === 'public' ? './src/lib/public-generation-client.js' : './src/lib/generation-client.js', import.meta.url)),
  } },
  server: { host: '127.0.0.1', proxy: mode === 'public' ? undefined : proxy },
  preview: { host: '127.0.0.1', proxy: mode === 'public' ? undefined : proxy },
  };
});
