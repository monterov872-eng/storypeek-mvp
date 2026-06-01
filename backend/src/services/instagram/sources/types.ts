import type { HighlightDetail, HighlightSummary, Profile, StoryItem } from '../../../types.js';

/** Resolved public profile used for follow-up story/highlight requests. */
export interface ResolvedProfile {
  userId: string;
  profile: Profile;
}

/**
 * Pluggable upstream for Instagram public data.
 * Swap implementations (web, REST vendor, mock) without changing routes or mobile app.
 */
export interface InstagramDataSource {
  readonly name: string;
  resolveProfile(username: string): Promise<ResolvedProfile>;
  fetchStories(resolved: ResolvedProfile): Promise<StoryItem[]>;
  fetchHighlights(resolved: ResolvedProfile): Promise<HighlightSummary[]>;
  fetchHighlight(resolved: ResolvedProfile, highlightId: string): Promise<HighlightDetail>;
}
