import 'dotenv/config';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = createApp(config);
const port = Number(process.env.PORT) || config.PORT;
const isProduction = process.env.NODE_ENV === 'production';

const server = app.listen(port, '0.0.0.0', () => {
  console.log('');
  console.log('[backend] Silent View API started successfully');
  console.log(`[backend] Listening on 0.0.0.0:${port}`);
  if (!isProduction) {
    console.log(`[backend] Local:    http://localhost:${port}`);
    console.log(`[backend] Emulator: http://10.0.2.2:${port} (Android)`);
  }
  console.log(`[backend] Health:   /health`);
  console.log(`[backend] Provider: ${config.INSTAGRAM_PROVIDER}`);
  if (config.INSTAGRAM_PROVIDER === 'web' && !config.INSTAGRAM_SESSION_ID) {
    console.warn('[backend] Warning: INSTAGRAM_SESSION_ID is not set — stories may be empty');
  }
  console.log('');
});

function shutdown(signal: string) {
  console.log(`[backend] Received ${signal}, shutting down…`);
  server.close(() => {
    console.log('[backend] Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
