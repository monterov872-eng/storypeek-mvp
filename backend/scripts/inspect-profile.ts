import 'dotenv/config';

const username = process.argv[2] ?? 'instagram';
const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
const r = await fetch(url, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'X-IG-App-ID': '936619743392459',
    Referer: `https://www.instagram.com/${username}/`,
    Origin: 'https://www.instagram.com',
  },
});
const j = await r.json();
const u = j.data.user;
console.log('keys', Object.keys(u).filter((k) => /story|reel|highlight/i.test(k)));
console.log('has_public_story', u.has_public_story);
console.log('highlight_reel_count', u.highlight_reel_count);
