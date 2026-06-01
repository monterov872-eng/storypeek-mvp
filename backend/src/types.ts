export type ApiErrorCode =
  | 'ACCOUNT_NOT_FOUND'
  | 'ACCOUNT_PRIVATE'
  | 'NO_STORIES'
  | 'UNLOCK_REQUIRED'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR';

export interface Profile {
  username: string;
  fullName: string;
  biography: string;
  profilePictureUrl: string;
  isPrivate: boolean;
  storyCount: number;
  highlightCount: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  takenAt: string;
  durationMs?: number;
}

export interface HighlightSummary {
  id: string;
  title: string;
  coverUrl: string;
  itemCount: number;
}

export interface HighlightDetail extends HighlightSummary {
  items: StoryItem[];
}
