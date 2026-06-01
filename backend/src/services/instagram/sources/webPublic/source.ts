import type { AppConfig } from '../../../../config.js';
import type { HighlightDetail, HighlightSummary, StoryItem } from '../../../../types.js';
import { ProviderError, throwProvider } from '../../errors.js';
import type { InstagramDataSource, ResolvedProfile } from '../types.js';
import { parseProfileFromHtml } from './htmlFallback.js';
import { IgHttpClient } from './http.js';
import { normalizeUsername, parseHighlightTray, parseWebProfile } from './parser.js';
import { fetchHighlightReelsMedia } from './highlightFetch.js';
import { fetchPublicStories } from './storyFetch.js';

/**
 * Web-only provider. Profile lookup only hits Instagram once — no story/highlight
 * requests until fetchStories / fetchHighlights is called after user unlock.
 */
export class WebPublicInstagramSource implements InstagramDataSource {
  readonly name = 'web-public';
  private readonly http: IgHttpClient;
  private readonly config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.http = new IgHttpClient(config);
  }

  async resolveProfile(username: string): Promise<ResolvedProfile> {
    const normalized = normalizeUsername(username);
    const refererPath = `/${normalized}/`;

    try {
      const payload = await this.http.getJson<Record<string, unknown>>({
        path: '/api/v1/users/web_profile_info/',
        searchParams: { username: normalized },
        context: 'profile_lookup',
        refererPath,
      });
      return parseWebProfile(payload, normalized);
    } catch (err) {
      if (shouldTryHtmlFallback(err)) {
        const html = await this.http.getText(`/${normalized}/`, refererPath);
        return parseProfileFromHtml(html, normalized);
      }
      throw err;
    }
  }

  async fetchStories(resolved: ResolvedProfile): Promise<StoryItem[]> {
    return fetchPublicStories(this.http, resolved, this.config);
  }

  async fetchHighlights(resolved: ResolvedProfile): Promise<HighlightSummary[]> {
    const refererPath = `/${resolved.profile.username}/`;

    const payload = await this.http.getJson<Record<string, unknown>>({
      path: `/api/v1/highlights/${resolved.userId}/highlights_tray/`,
      searchParams: { supported_transfer_sdk_versions: '0.131.0' },
      context: 'highlights_list',
      refererPath,
    });

    const highlights = parseHighlightTray(payload);
    if (highlights.length === 0 && resolved.profile.highlightCount > 0) {
      throwProvider(
        'SERVICE_UNAVAILABLE',
        'Highlights could not be loaded. Instagram may be limiting requests — try again later.',
        'instagram_block',
      );
    }
    return highlights;
  }

  async fetchHighlight(
    resolved: ResolvedProfile,
    highlightId: string,
  ): Promise<HighlightDetail> {
    const reelId = highlightId.startsWith('highlight:')
      ? highlightId
      : `highlight:${highlightId}`;
    const refererPath = `/${resolved.profile.username}/`;

    const { items } = await fetchHighlightReelsMedia(
      this.http,
      resolved,
      reelId,
      undefined,
    );

    if (items.length === 0) {
      throwProvider('ACCOUNT_NOT_FOUND', 'Highlight not found or empty');
    }

    const list = await this.fetchHighlights(resolved).catch(() => []);
    const summary = list.find((h) => h.id === reelId || h.id.endsWith(highlightId));

    return {
      id: reelId,
      title: summary?.title ?? 'Highlight',
      coverUrl: summary?.coverUrl ?? items[0]?.mediaUrl ?? '',
      itemCount: items.length,
      items,
    };
  }
}

function shouldTryHtmlFallback(err: unknown): boolean {
  if (!(err instanceof ProviderError)) return false;
  return err.reason === 'instagram_block' || err.reason === 'network' || err.reason === 'timeout';
}
