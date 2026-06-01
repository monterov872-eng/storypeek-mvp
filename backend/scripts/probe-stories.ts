import 'dotenv/config';

const username = process.argv[2] ?? 'joss_x1400';
const sessionId = process.env.INSTAGRAM_SESSION_ID;

async function fetchJson(url: string, referer: string) {
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'X-IG-App-ID': '936619743392459',
    Referer: referer,
    Origin: 'https://www.instagram.com',
    Accept: '*/*',
  };
  if (sessionId) headers.Cookie = `sessionid=${sessionId};`;

  const home = await fetch('https://www.instagram.com/', { headers: { 'User-Agent': headers['User-Agent'] } });
  const cookies = home.headers.getSetCookie?.().join('; ') ?? '';
  headers.Cookie = [sessionId ? `sessionid=${sessionId}` : '', cookies].filter(Boolean).join('; ');

  const res = await fetch(url, { headers });
  const text = await res.text();
  return { status: res.status, isHtml: text.trimStart().startsWith('<'), body: text.slice(0, 800), full: text };
}

const referer = `https://www.instagram.com/${username}/`;
const profile = await fetchJson(
  `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
  referer,
);
console.log('PROFILE', profile.status, profile.isHtml ? 'HTML' : 'JSON');
if (!profile.isHtml) {
  const j = JSON.parse(profile.full);
  const u = j.data?.user;
  console.log('userId', u?.id, 'has_public_story', u?.has_public_story, 'highlight_reel_count', u?.highlight_reel_count);
  const uid = u?.id;
  if (uid) {
    for (const path of [
      `/api/v1/feed/reels_media/?reel_ids=${uid}`,
      `/api/v1/feed/user/${uid}/reel_media/`,
      `/api/v1/feed/user/${uid}/story/`,
    ]) {
      const r = await fetchJson(`https://www.instagram.com${path}`, referer);
      console.log('\n', path, r.status, r.isHtml ? 'HTML' : r.body);
    }
  }
}
