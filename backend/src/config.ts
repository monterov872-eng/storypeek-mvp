import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  INSTAGRAM_PROVIDER: z.enum(['mock', 'web', 'rest']).default('web'),
  INSTAGRAM_APP_ID: z.string().default('936619743392459'),
  INSTAGRAM_SESSION_ID: z.string().optional(),
  INSTAGRAM_REQUEST_TIMEOUT_MS: z.coerce.number().min(10_000).max(15_000).default(12_000),
  INSTAGRAM_REQUEST_RETRY_COUNT: z.coerce.number().min(0).max(3).default(2),
  INSTAGRAM_REQUEST_RETRY_DELAY_MS: z.coerce.number().min(500).default(1500),
  INSTAGRAM_PROFILE_CACHE_TTL_MS: z.coerce.number().default(5 * 60_000),
  INSTAGRAM_MEDIA_CACHE_TTL_MS: z.coerce.number().default(2 * 60_000),
  INSTAGRAM_STORY_DELAY_MIN_MS: z.coerce.number().default(2000),
  INSTAGRAM_STORY_DELAY_MAX_MS: z.coerce.number().default(5000),
  INSTAGRAM_SEARCH_COOLDOWN_MS: z.coerce.number().default(20_000),
  INSTAGRAM_REST_BASE_URL: z.string().url().optional(),
  INSTAGRAM_REST_API_KEY: z.string().optional(),
  INSTAGRAM_REST_AUTH_HEADER: z.string().default('x-api-key'),
  RAPID_API_KEY: z.string().optional(),
  RAPID_API_TIMEOUT_MS: z.coerce.number().min(5000).max(60_000).default(20_000),
  /** Override highlights list endpoint (default: /get_ig_user_highlights.php). */
  RAPID_API_HIGHLIGHTS_PATH: z.string().default('/get_ig_user_highlights.php'),
  /** Separate RapidAPI product for highlight story items (server-only). */
  RAPID_HIGHLIGHT_API_KEY: z.string().optional(),
  RAPID_HIGHLIGHT_API_HOST: z.string().optional(),
  /** Override highlight stories path (default: /get_highlights_stories.php). */
  RAPID_HIGHLIGHT_STORIES_PATH: z.string().default('/get_highlights_stories.php'),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:', parsed.error.flatten());
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}
