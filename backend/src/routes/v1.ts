import { Router } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config.js';
import type { InstagramProvider } from '../services/instagram/provider.js';
import { grantUnlock, getUnlockStatus, hasUnlock } from '../services/unlockService.js';
import { assertProfileSearchAllowed } from '../services/searchCooldown.js';
import { apiError } from '../middleware/errorHandler.js';
import { requireDeviceId } from '../middleware/deviceId.js';
import { profileSearchRateLimiter } from '../middleware/rateLimit.js';
import { assertInstagramNotInCooldown } from '../services/instagramCooldown.js';

const usernameSchema = z
  .string()
  .min(1)
  .max(30)
  .regex(/^[a-zA-Z0-9._]+$/, 'Invalid username format');

export function createV1Router(provider: InstagramProvider, config: AppConfig): Router {
  const router = Router();
  router.use(requireDeviceId);

  router.get('/profile/:username', profileSearchRateLimiter, async (req, res, next) => {
    try {
      const parsed = usernameSchema.safeParse(req.params.username);
      if (!parsed.success) {
        return apiError(res, 'VALIDATION_ERROR', 'Invalid username', 'validation');
      }

      assertProfileSearchAllowed(req.deviceId!, parsed.data, config.INSTAGRAM_SEARCH_COOLDOWN_MS);
      assertInstagramNotInCooldown(req.deviceId!);

      const profile = await provider.getProfile(parsed.data);
      const unlock = getUnlockStatus(req.deviceId!, profile.username);
      res.json({ profile, unlock });
    } catch (e) {
      next(e);
    }
  });

  router.get('/profile/:username/stories', async (req, res, next) => {
    try {
      const username = usernameSchema.parse(req.params.username);
      if (!hasUnlock(req.deviceId!, username, 'stories')) {
        return apiError(
          res,
          'UNLOCK_REQUIRED',
          'Watch an ad to unlock stories for this profile.',
          'validation',
        );
      }
      assertInstagramNotInCooldown(req.deviceId!);
      const stories = await provider.getStories(username, { deviceId: req.deviceId! });
      res.json({ stories });
    } catch (e) {
      next(e);
    }
  });

  router.get('/profile/:username/highlights', async (req, res, next) => {
    try {
      const username = usernameSchema.parse(req.params.username);
      if (!hasUnlock(req.deviceId!, username, 'highlights')) {
        return apiError(
          res,
          'UNLOCK_REQUIRED',
          'Watch an ad to unlock highlights for this profile.',
          'validation',
        );
      }
      assertInstagramNotInCooldown(req.deviceId!);
      const highlights = await provider.getHighlights(username, { deviceId: req.deviceId! });
      res.json({ highlights });
    } catch (e) {
      next(e);
    }
  });

  router.get('/profile/:username/highlights/:highlightId', async (req, res, next) => {
    try {
      const username = usernameSchema.parse(req.params.username);
      if (!hasUnlock(req.deviceId!, username, 'highlights')) {
        return apiError(res, 'UNLOCK_REQUIRED', 'Highlights are locked for this profile.', 'validation');
      }
      assertInstagramNotInCooldown(req.deviceId!);
      const highlight = await provider.getHighlight(username, req.params.highlightId, {
        deviceId: req.deviceId!,
      });
      res.json({ highlight });
    } catch (e) {
      next(e);
    }
  });

  router.post('/unlock', async (req, res, next) => {
    try {
      const body = z
        .object({
          username: usernameSchema,
          type: z.enum(['stories', 'highlights']),
        })
        .parse(req.body);

      const result = grantUnlock(req.deviceId!, body.username, body.type);
      res.json({ ok: true, ...result });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return apiError(res, 'VALIDATION_ERROR', 'Invalid unlock request', 'validation');
      }
      next(e);
    }
  });

  return router;
}
