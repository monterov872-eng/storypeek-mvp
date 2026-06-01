import type { HighlightDetail, HighlightSummary, Profile, StoryItem } from '../../types.js';

export interface MediaRequestOptions {
  deviceId?: string;
}

export interface InstagramProvider {
  getProfile(username: string): Promise<Profile>;
  getStories(username: string, options?: MediaRequestOptions): Promise<StoryItem[]>;
  getHighlights(username: string, options?: MediaRequestOptions): Promise<HighlightSummary[]>;
  getHighlight(
    username: string,
    highlightId: string,
    options?: MediaRequestOptions,
  ): Promise<HighlightDetail>;
}
