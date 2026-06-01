import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from './config.js';
import { createInstagramProvider } from './services/instagram/factory.js';
import { createV1Router } from './routes/v1.js';
import { createRapidStoriesRouter } from './routes/rapidStories.js';
import { createApiStoriesRouter } from './routes/apiStories.js';
import { errorHandler } from './middleware/errorHandler.js';
import { deviceRateLimiter, ipRateLimiter } from './middleware/rateLimit.js';
import { isRapidHighlightApiConfigured } from './services/rapidApi/rapidHighlightClient.js';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public');

export function createApp(config: AppConfig) {
  const provider = createInstagramProvider(config);
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '32kb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(ipRateLimiter);
  app.use(express.static(publicDir));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'storypeek-api',
      instagramProvider: config.INSTAGRAM_PROVIDER,
      rapidApiConfigured: Boolean(config.RAPID_API_KEY),
      rapidHighlightApiConfigured: isRapidHighlightApiConfigured(config),
    });
  });

  app.use('/v1', deviceRateLimiter, createV1Router(provider, config));
  app.use('/v1/rapid', createRapidStoriesRouter(config));
  app.use('/api', createApiStoriesRouter(config));
  app.use(errorHandler);

  return app;
}
