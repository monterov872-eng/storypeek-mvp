import { Router, type NextFunction, type Response } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config.js';
import { apiError } from '../middleware/errorHandler.js';
import { profileSearchRateLimiter } from '../middleware/rateLimit.js';
import { RapidApiError } from '../services/rapidApi/errors.js';
import { fetchRapidApiHighlightStories } from '../services/rapidApi/rapidHighlightStories.js';
import { fetchRapidApiHighlights } from '../services/rapidApi/rapidApiHighlights.js';
import { fetchRapidApiStories } from '../services/rapidApi/rapidApiStories.js';

const usernameSchema = z
  .string()
  .min(1)
  .max(30)
  .regex(/^[a-zA-Z0-9._]+$/, 'Invalid username format');

const highlightIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^(?:highlight:)?[0-9]+$/, 'Invalid highlight id');

const bodySchema = z.object({
  username: usernameSchema,
});

function handleRapidApiError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof RapidApiError) {
    return apiError(
      res,
      err.code,
      err.message,
      err.reason,
      err.statusCode,
      err.retryAfterSec,
    );
  }
  next(err);
}

export function createRapidStoriesRouter(config: AppConfig): Router {
  const router = Router();

  router.post('/stories', profileSearchRateLimiter, async (req, res, next) => {
    try {
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return apiError(res, 'VALIDATION_ERROR', 'Invalid username', 'validation');
      }

      const result = await fetchRapidApiStories(parsed.data.username, config);
      res.json(result);
    } catch (err) {
      handleRapidApiError(err, res, next);
    }
  });

  router.get('/stories/:username', profileSearchRateLimiter, async (req, res, next) => {
    try {
      const parsed = usernameSchema.safeParse(req.params.username);
      if (!parsed.success) {
        return apiError(res, 'VALIDATION_ERROR', 'Invalid username', 'validation');
      }

      const result = await fetchRapidApiStories(parsed.data, config);
      res.json(result);
    } catch (err) {
      handleRapidApiError(err, res, next);
    }
  });

  router.get('/highlights/:username', profileSearchRateLimiter, async (req, res, next) => {
    try {
      const parsed = usernameSchema.safeParse(req.params.username);
      if (!parsed.success) {
        return apiError(res, 'VALIDATION_ERROR', 'Invalid username', 'validation');
      }

      const result = await fetchRapidApiHighlights(parsed.data, config);
      res.json(result);
    } catch (err) {
      handleRapidApiError(err, res, next);
    }
  });

  router.get(
    '/highlights/:username/:highlightId/stories',
    profileSearchRateLimiter,
    async (req, res, next) => {
      try {
        const usernameParsed = usernameSchema.safeParse(req.params.username);
        const highlightParsed = highlightIdSchema.safeParse(req.params.highlightId);
        if (!usernameParsed.success || !highlightParsed.success) {
          return apiError(res, 'VALIDATION_ERROR', 'Invalid username or highlight id', 'validation');
        }

        const title =
          typeof req.query.title === 'string' ? req.query.title : undefined;
        const reelId =
          typeof req.query.reel_id === 'string' ? req.query.reel_id : undefined;
        const pk = typeof req.query.pk === 'string' ? req.query.pk : undefined;
        const shortcode =
          typeof req.query.shortcode === 'string' ? req.query.shortcode : undefined;
        const id = typeof req.query.id === 'string' ? req.query.id : undefined;
        const reel_id =
          typeof req.query.reel_id === 'string' ? req.query.reel_id : undefined;

        let highlightObject: Record<string, unknown> | undefined;
        if (typeof req.query.highlight_json === 'string') {
          try {
            const parsed = JSON.parse(req.query.highlight_json) as unknown;
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              highlightObject = parsed as Record<string, unknown>;
            }
          } catch {
            /* ignore */
          }
        }

        const result = await fetchRapidApiHighlightStories(
          usernameParsed.data,
          highlightParsed.data,
          config,
          {
            highlightTitle: title,
            highlightReelId: reelId,
            pk,
            shortcode,
            id,
            reel_id,
            highlightObject,
          },
        );
        res.json(result);
      } catch (err) {
        handleRapidApiError(err, res, next);
      }
    },
  );

  return router;
}
