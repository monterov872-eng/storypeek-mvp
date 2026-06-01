export interface RapidStoryItem {
  id: string;
  username: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  takenAt?: string;
  audioUrl?: string;
  /** Video length in milliseconds (from Instagram metadata). */
  durationMs?: number;
}

export interface RapidPostItem {
  id: string;
  username: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  takenAt?: string;
  /**
   * When the post is a carousel, this contains every slide extracted from
   * `carousel_media`. The first slide is typically mapped to the legacy
   * fields above for backward compatibility.
   */
  carouselItems?: RapidStoryItem[];
}

export interface RapidPostsUserHint {
  username?: string;
  fullName?: string;
  profilePictureUrl?: string;
}

export interface RapidPostsResult {
  username: string;
  posts: RapidPostItem[];
  userHint?: RapidPostsUserHint;
  provider: 'rapidapi';
  fetchedAt: string;
}

export interface RapidProfileResult {
  username: string;
  fullName: string;
  biography: string;
  profilePictureUrl: string;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  storyCount: number;
  highlightCount: number;
  posts: RapidPostItem[];
  provider: string;
  fetchedAt: string;
}

export interface RapidStoriesResult {
  username: string;
  stories: RapidStoryItem[];
  provider: 'rapidapi';
  fetchedAt: string;
  notice?: string;
}

export interface RapidHighlightItem {
  id: string;
  title: string;
  coverUrl: string;
  username: string;
}

export interface RapidHighlightsResult {
  username: string;
  highlights: RapidHighlightItem[];
  provider: 'rapidapi';
  fetchedAt: string;
}

export interface RapidHighlightStoriesResult {
  username: string;
  highlightId: string;
  title: string;
  stories: RapidStoryItem[];
  provider: 'rapidapi' | 'rapidapi-highlight' | 'instagram-web';
  fetchedAt: string;
  storiesUnavailable?: boolean;
  notice?: string;
}
