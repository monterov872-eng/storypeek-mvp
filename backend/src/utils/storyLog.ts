export type StoryLogEvent =
  | 'story_fetch_start'
  | 'story_fetch_success'
  | 'story_fetch_empty'
  | 'story_fetch_blocked'
  | 'story_fetch_requires_session'
  | 'story_fetch_error';

export function logStoryEvent(
  event: StoryLogEvent,
  details: Record<string, string | number | boolean | undefined>,
) {
  const payload = { ts: new Date().toISOString(), event, ...details };
  console.log(JSON.stringify(payload));
}
