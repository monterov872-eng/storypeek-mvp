import 'dotenv/config';

const host = 'instagram-scraper-stable-api.p.rapidapi.com';
const key = process.env.RAPID_API_KEY!.trim();

const response = await fetch(`https://${host}/get_ig_user_posts.php`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-rapidapi-host': host,
    'x-rapidapi-key': key,
  },
  body: new URLSearchParams({ username_or_url: 'instagram' }),
});

const json = (await response.json()) as Record<string, unknown>;
console.log('keys', Object.keys(json));
for (const k of Object.keys(json)) {
  if (k === 'posts') continue;
  console.log(k, JSON.stringify(json[k]).slice(0, 500));
}

function walk(obj: unknown, path = '', depth = 0): void {
  if (depth > 4 || obj == null) return;
  if (typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    if (obj.length > 0) walk(obj[0], `${path}[0]`, depth + 1);
    return;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (/follow|profile|media_count|post|biography|full_name|pic/i.test(key)) {
      console.log(`${path}.${key}`, typeof value === 'object' ? JSON.stringify(value).slice(0, 200) : value);
    }
    if (typeof value === 'object') walk(value, `${path}.${key}`, depth + 1);
  }
}

walk(json);
