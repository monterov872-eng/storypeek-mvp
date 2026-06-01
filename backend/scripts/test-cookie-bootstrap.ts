const jar: string[] = [];

function storeCookies(res: Response) {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const part = c.split(';')[0];
    if (part) jar.push(part);
  }
}

function cookieHeader() {
  return jar.join('; ');
}

const ua =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const home = await fetch('https://www.instagram.com/', {
  headers: { 'User-Agent': ua, Accept: 'text/html' },
});
storeCookies(home);
const html = await home.text();
const csrf =
  jar.find((c) => c.startsWith('csrftoken='))?.split('=')[1] ??
  html.match(/"csrf_token":"([^"]+)"/)?.[1];

console.log('cookies', jar.length, 'csrf', csrf ? 'yes' : 'no');

const uid = '25025320';
const headers: Record<string, string> = {
  'User-Agent': ua,
  'X-IG-App-ID': '936619743392459',
  Referer: 'https://www.instagram.com/instagram/',
  Origin: 'https://www.instagram.com',
  Cookie: cookieHeader(),
};
if (csrf) headers['X-CSRFToken'] = csrf;

const reels = await fetch(`https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=${uid}`, {
  headers,
});
storeCookies(reels);
console.log('reels status', reels.status, (await reels.text()).slice(0, 200));

const hi = await fetch(
  `https://www.instagram.com/api/v1/highlights/${uid}/highlights_tray/?supported_transfer_sdk_versions=0.131.0`,
  { headers },
);
console.log('highlights status', hi.status, (await hi.text()).slice(0, 200));
