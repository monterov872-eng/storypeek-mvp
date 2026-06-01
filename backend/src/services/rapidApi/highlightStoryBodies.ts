import type { HighlightIdBundle } from './highlightIds.js';

/** POST body for user highlight stories — match RapidAPI playground. */
export function buildHighlightStoryRequestBodies(
  _username: string,
  bundle: HighlightIdBundle,
): Record<string, string>[] {
  const highlightId = bundle.reelId || bundle.input;
  return [
    {
      highlight_id: highlightId,
    },
  ];
}
