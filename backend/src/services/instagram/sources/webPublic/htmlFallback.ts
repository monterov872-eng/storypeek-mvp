import { throwProvider } from '../../errors.js';
import { parseWebProfile } from './parser.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Fallback when JSON API endpoints are blocked: parse profile from public HTML page.
 */
export function parseProfileFromHtml(html: string, username: string): {
  userId: string;
  profile: ReturnType<typeof parseWebProfile>['profile'];
} {
  const nextData = extractJsonScript(html, '__NEXT_DATA__');
  if (nextData) {
    const user =
      nextData?.props?.pageProps?.user ??
      nextData?.props?.pageProps?.graphql?.user ??
      nextData?.require?.[0]?.[3]?.graphql?.user;

    if (user) {
      const userId = String(user.id ?? user.pk ?? '');
      if (!userId) throwProvider('SERVICE_UNAVAILABLE', 'Could not parse profile id from HTML');

      const { profile } = parseWebProfile({ data: { user } }, username);
      return { userId, profile };
    }
  }

  const shared = extractJsonScript(html, 'window._sharedData');
  if (shared?.entry_data?.ProfilePage?.[0]?.graphql?.user) {
    const user = shared.entry_data.ProfilePage[0].graphql.user;
    const userId = String(user.id ?? '');
    const { profile } = parseWebProfile({ data: { user } }, username);
    return { userId, profile };
  }

  if (html.includes('Page Not Found') || html.includes('"username":null')) {
    throwProvider('ACCOUNT_NOT_FOUND', 'Account not found');
  }

  throwProvider(
    'SERVICE_UNAVAILABLE',
    'Instagram temporarily blocked this request. Try again in a few minutes.',
  );
}

function extractJsonScript(html: string, marker: string): any | null {
  if (marker === '__NEXT_DATA__') {
    const match = html.match(/<script type="application\/json" id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match?.[1]) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }

  const idx = html.indexOf('window._sharedData = ');
  if (idx === -1) return null;
  const start = idx + 'window._sharedData = '.length;
  const slice = html.slice(start);
  const brace = slice.indexOf('{');
  if (brace === -1) return null;
  let depth = 0;
  for (let i = brace; i < slice.length; i++) {
    if (slice[i] === '{') depth++;
    if (slice[i] === '}') depth--;
    if (depth === 0) {
      try {
        return JSON.parse(slice.slice(brace, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}
