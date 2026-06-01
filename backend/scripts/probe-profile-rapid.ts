import 'dotenv/config';

const host = 'instagram-scraper-stable-api.p.rapidapi.com';
const key = process.env.RAPID_API_KEY?.trim();
const user = process.argv[2] ?? 'instagram';

if (!key) {
  console.error('RAPID_API_KEY missing');
  process.exit(1);
}

async function post(path: string, body: Record<string, string>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': host,
        'x-rapidapi-key': key,
      },
      body: new URLSearchParams(body),
      signal: controller.signal,
    });
    const text = await response.text();
    console.log('\n===', path, 'status', response.status, '===');
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      const keys = Object.keys(json);
      console.log('top keys:', keys.join(', '));
      if (json.user) console.log('user keys:', Object.keys(json.user as object).slice(0, 40));
      if (json.data) console.log('data keys:', Object.keys(json.data as object).slice(0, 40));
      console.log(JSON.stringify(json, null, 2).slice(0, 3500));
    } catch {
      console.log(text.slice(0, 600));
    }
  } finally {
    clearTimeout(timer);
  }
}

const profileUrl = `https://www.instagram.com/${user}/`;
await post('/get_ig_user_stories.php', { username_or_url: profileUrl });
await post('/get_ig_user_highlights.php', { username_or_url: profileUrl });
await post('/get_ig_user_posts.php', { username_or_url: profileUrl });
