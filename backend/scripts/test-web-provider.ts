import 'dotenv/config';
import { loadConfig } from '../src/config.js';
import { WebPublicInstagramSource } from '../src/services/instagram/sources/webPublic/source.js';

async function rawProbe(username: string) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  const r = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'X-IG-App-ID': '936619743392459',
      Accept: '*/*',
      Referer: 'https://www.instagram.com/',
      Origin: 'https://www.instagram.com',
    },
  });
  console.log('raw status', r.status);
  console.log((await r.text()).slice(0, 120));
}

process.env.INSTAGRAM_PROVIDER = 'web';
const config = loadConfig();

if (process.argv.includes('--probe')) {
  await rawProbe(process.argv[process.argv.indexOf('--probe') + 1] ?? 'instagram');
  process.exit(0);
}
const src = new WebPublicInstagramSource(config);
const users = process.argv.slice(2).length ? process.argv.slice(2) : ['instagram', 'nasa'];

for (const u of users) {
  console.log('\n---', u, '---');
  try {
    const r = await src.resolveProfile(u);
    console.log('profile', {
      userId: r.userId,
      username: r.profile.username,
      storyCount: r.profile.storyCount,
      highlightCount: r.profile.highlightCount,
    });
    try {
      const stories = await src.fetchStories(r);
      console.log('stories', stories.length);
    } catch (e) {
      const err = e as Error & { code?: string };
      console.log('stories error', err.code, err.message);
    }
    try {
      const highlights = await src.fetchHighlights(r);
      console.log('highlights', highlights.length, highlights.map((h) => h.title));
    } catch (e) {
      const err = e as Error & { code?: string };
      console.log('highlights error', err.code, err.message);
    }
  } catch (e) {
    const err = e as Error & { code?: string };
    console.log('profile error', err.code, err.message);
  }
}
