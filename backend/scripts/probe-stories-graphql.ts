import 'dotenv/config';

const username = 'joss_x1400';
const sessionId = process.env.INSTAGRAM_SESSION_ID;
const ua =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const home = await fetch('https://www.instagram.com/', { headers: { 'User-Agent': ua } });
const cookies = home.headers.getSetCookie?.().map((c) => c.split(';')[0]).join('; ') ?? '';
const csrf = cookies.match(/csrftoken=([^;]+)/)?.[1];
const cookie = [sessionId ? `sessionid=${sessionId}` : '', cookies].filter(Boolean).join('; ');

const profileRes = await fetch(
  `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
  {
    headers: { 'User-Agent': ua, 'X-IG-App-ID': '936619743392459', Referer: `https://www.instagram.com/${username}/`, Cookie: cookie },
  },
);
const profile = await profileRes.json();
const userId = profile.data.user.id;
console.log('userId', userId, 'session', !!sessionId);

const docIds = [
  '2344695846835234805',
  '17888483320055982',
  '1794695846835234805',
];

for (const docId of docIds) {
  const body = new URLSearchParams({
    variables: JSON.stringify({ reel_ids: [userId], tag: 'usertags' }),
    doc_id: docId,
  });
  const r = await fetch('https://www.instagram.com/graphql/query', {
    method: 'POST',
    headers: {
      'User-Agent': ua,
      'X-IG-App-ID': '936619743392459',
      'X-CSRFToken': csrf ?? '',
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `https://www.instagram.com/stories/${username}/`,
    },
    body: body.toString(),
  });
  const t = await r.text();
  console.log('\ndoc', docId, r.status, t.slice(0, 300));
}
