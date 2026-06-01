import type { HighlightDetail, HighlightSummary, Profile, StoryItem } from '../../types.js';
import type { InstagramProvider } from './provider.js';

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';
const PLACEHOLDER_STORY =
  'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=1080&h=1920&fit=crop';

function normalize(username: string): string {
  return username.trim().replace(/^@/, '').toLowerCase();
}

export class MockInstagramProvider implements InstagramProvider {
  async getProfile(username: string): Promise<Profile> {
    const u = normalize(username);

    if (u === 'ghost' || u === 'notfound') {
      const err = new Error('Account not found') as Error & { code: string };
      err.code = 'ACCOUNT_NOT_FOUND';
      throw err;
    }

    if (u === 'down' || u === 'error') {
      const err = new Error('Service unavailable') as Error & { code: string };
      err.code = 'SERVICE_UNAVAILABLE';
      throw err;
    }

    const isEmpty = u === 'empty';
    const isPrivate = u === 'private_user' || u === 'private';

    return {
      username: u || 'demo',
      fullName: isPrivate
          ? 'Private Demo'
          : u === 'demo'
            ? 'Demo Creator'
            : u.charAt(0).toUpperCase() + u.slice(1),
      biography: isPrivate
          ? 'Private account — only profile info is visible here.'
          : 'Public profile — mock data for MVP development.',
      profilePictureUrl: PLACEHOLDER_AVATAR,
      isPrivate,
      storyCount: isEmpty || isPrivate ? 0 : 4,
      highlightCount: isEmpty || isPrivate ? 0 : 3,
      followersCount: isEmpty ? 0 : isPrivate ? 8_900 : 12_400,
      followingCount: isEmpty ? 0 : isPrivate ? 421 : 312,
      postsCount: isEmpty ? 0 : isPrivate ? 127 : 48,
    };
  }

  async getStories(username: string): Promise<StoryItem[]> {
    const profile = await this.getProfile(username);
    if (profile.isPrivate) {
      const err = new Error('Account is private') as Error & { code: string };
      err.code = 'ACCOUNT_PRIVATE';
      throw err;
    }
    if (profile.storyCount === 0) {
      const err = new Error('No stories') as Error & { code: string };
      err.code = 'NO_STORIES';
      throw err;
    }

    const now = Date.now();
    return Array.from({ length: profile.storyCount }, (_, i) => ({
      id: `${profile.username}-story-${i + 1}`,
      mediaUrl: PLACEHOLDER_STORY,
      mediaType: 'image' as const,
      takenAt: new Date(now - i * 3600_000).toISOString(),
    }));
  }

  async getHighlights(username: string): Promise<HighlightSummary[]> {
    const profile = await this.getProfile(username);
    if (profile.isPrivate) {
      const err = new Error('Account is private') as Error & { code: string };
      err.code = 'ACCOUNT_PRIVATE';
      throw err;
    }
    if (profile.highlightCount === 0) return [];

    return [
      { id: 'travel', title: 'Travel', coverUrl: PLACEHOLDER_STORY, itemCount: 5 },
      { id: 'food', title: 'Food', coverUrl: PLACEHOLDER_STORY, itemCount: 3 },
      { id: 'bts', title: 'BTS', coverUrl: PLACEHOLDER_STORY, itemCount: 4 },
    ].slice(0, profile.highlightCount);
  }

  async getHighlight(username: string, highlightId: string): Promise<HighlightDetail> {
    const list = await this.getHighlights(username);
    const summary = list.find((h) => h.id === highlightId);
    if (!summary) {
      const err = new Error('Highlight not found') as Error & { code: string };
      err.code = 'ACCOUNT_NOT_FOUND';
      throw err;
    }

    const items = await this.getStories(username);
    return { ...summary, items: items.slice(0, summary.itemCount) };
  }
}
