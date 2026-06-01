/**
 * Optional sidecar: exposes the Generic REST contract while using the web-public source.
 *
 * Run:
 *   INSTAGRAM_PROVIDER=web npx tsx examples/local-rest-proxy.ts
 *
 * Then point main API to:
 *   INSTAGRAM_PROVIDER=rest
 *   INSTAGRAM_REST_BASE_URL=http://localhost:3002/v1
 *   INSTAGRAM_REST_API_KEY=local-dev-key
 */
import 'dotenv/config';
import express from 'express';
import { loadConfig } from '../src/config.js';
import { WebPublicInstagramSource } from '../src/services/instagram/sources/webPublic/source.js';
import { ProviderError } from '../src/services/instagram/errors.js';

const PORT = Number(process.env.PROXY_PORT) || 3002;
const API_KEY = process.env.INSTAGRAM_REST_API_KEY ?? 'local-dev-key';

const config = loadConfig();
const source = new WebPublicInstagramSource({ ...config, INSTAGRAM_PROVIDER: 'web' });

const app = express();

app.use((req, res, next) => {
  if (req.header('x-api-key') !== API_KEY) {
    return res.status(401).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Unauthorized' } });
  }
  next();
});

app.get('/v1/users/:username/profile', async (req, res, next) => {
  try {
    const resolved = await source.resolveProfile(req.params.username);
    res.json({ userId: resolved.userId, profile: resolved.profile });
  } catch (e) {
    next(e);
  }
});

app.get('/v1/users/:username/stories', async (req, res, next) => {
  try {
    const resolved = await source.resolveProfile(req.params.username);
    const stories = await source.fetchStories(resolved);
    res.json({ stories });
  } catch (e) {
    next(e);
  }
});

app.get('/v1/users/:username/highlights', async (req, res, next) => {
  try {
    const resolved = await source.resolveProfile(req.params.username);
    const highlights = await source.fetchHighlights(resolved);
    res.json({ highlights });
  } catch (e) {
    next(e);
  }
});

app.get('/v1/users/:username/highlights/:id', async (req, res, next) => {
  try {
    const resolved = await source.resolveProfile(req.params.username);
    const highlight = await source.fetchHighlight(resolved, req.params.id);
    res.json({ highlight });
  } catch (e) {
    next(e);
  }
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ProviderError) {
    return res.status(502).json({ error: { code: err.code, message: err.message } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Proxy error' } });
});

app.listen(PORT, () => {
  console.log(`Instagram REST proxy on http://localhost:${PORT}/v1 (x-api-key: ${API_KEY})`);
});
