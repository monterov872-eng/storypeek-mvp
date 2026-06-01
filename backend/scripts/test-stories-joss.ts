import 'dotenv/config';
import { loadConfig } from '../src/config.js';
import { WebPublicInstagramSource } from '../src/services/instagram/sources/webPublic/source.js';

const config = loadConfig();
const source = new WebPublicInstagramSource(config);
const username = 'joss_x1400';

console.log('Session configured:', Boolean(process.env.INSTAGRAM_SESSION_ID));

const resolved = await source.resolveProfile(username);
console.log('Profile:', resolved.profile.username, 'userId:', resolved.userId);

try {
  const stories = await source.fetchStories(resolved);
  console.log('SUCCESS:', stories.length, 'stories');
} catch (e) {
  const err = e as Error & { code?: string };
  console.log('FAILED:', err.code, err.message);
}
