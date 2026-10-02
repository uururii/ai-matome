import { createServer } from 'vite';
import { startApiServer } from '../server/index.js';

let api;
let vite;
try {
  api = await startApiServer();
  vite = await createServer();
  await vite.listen();
  vite.printUrls();
} catch (error) {
  api?.close();
  await vite?.close();
  console.error(error.code === 'EADDRINUSE' ? 'API port is occupied. Stop the old server or set API_PORT in .env.' : 'Could not start the app. Check the local configuration.');
  process.exitCode = 1;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  await vite?.close();
  api?.closeAllConnections();
  api?.close();
  process.exit(0);
});
