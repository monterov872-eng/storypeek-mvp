/**
 * Integration tests for web Instagram provider.
 * Run: npm run test:integration
 *
 * Requires backend/.env with INSTAGRAM_PROVIDER=web
 * Stories/highlights need INSTAGRAM_SESSION_ID in backend/.env
 */
import 'dotenv/config';
import { loadConfig } from '../src/config.js';
import { ProviderError } from '../src/services/instagram/errors.js';
import { WebPublicInstagramSource } from '../src/services/instagram/sources/webPublic/source.js';

const config = loadConfig();
const source = new WebPublicInstagramSource(config);

const PUBLIC = process.env.TEST_PUBLIC_USERNAME ?? 'natgeo';
const PRIVATE = process.env.TEST_PRIVATE_USERNAME ?? '';
const NO_STORIES = process.env.TEST_NO_STORIES_USERNAME ?? '';

const sessionConfigured = Boolean(process.env.INSTAGRAM_SESSION_ID?.trim());

type Result = 'PASS' | 'FAIL' | 'SKIP';

function maskSession(): string {
  return sessionConfigured ? 'yes (hidden)' : 'no';
}

async function run(name: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    return 'PASS';
  } catch (e) {
    const err = e as Error & { code?: string };
    if ((err as Error & { skipped?: boolean }).skipped) {
      console.log(`  SKIP  ${name} — ${err.message}`);
      return 'SKIP';
    }
    console.log(`  FAIL  ${name} — ${err.message}${err.code ? ` [${err.code}]` : ''}`);
    return 'FAIL';
  }
}

function skip(msg: string): never {
  const e = new Error(msg) as Error & { skipped: boolean };
  e.skipped = true;
  throw e;
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertCode(err: unknown, code: string) {
  assert(err instanceof ProviderError, `Expected ProviderError, got ${err}`);
  assert(err.code === code, `Expected code ${code}, got ${err.code}`);
}

console.log('\nStoryPeek web provider integration tests\n');
console.log(`  Provider:          ${config.INSTAGRAM_PROVIDER}`);
console.log(`  Session configured: ${maskSession()}`);
console.log(`  Public username:   ${PUBLIC}`);
console.log(`  Private username:  ${PRIVATE || '(set TEST_PRIVATE_USERNAME in .env)'}`);
console.log(`  No-stories user:   ${NO_STORIES || '(set TEST_NO_STORIES_USERNAME in .env)'}`);
console.log('');

const results: Result[] = [];

results.push(
  await run('1. Public profile lookup', async () => {
    const r = await source.resolveProfile(PUBLIC);
    assert(!r.profile.isPrivate, 'profile should be public');
    assert(r.profile.username.length > 0, 'username required');
    assert(r.profile.profilePictureUrl.startsWith('http'), 'avatar URL required');
    assert(r.userId.length > 0, 'userId required');
    console.log(`         → @${r.profile.username} (${r.profile.fullName}) stories=${r.profile.storyCount} highlights=${r.profile.highlightCount}`);
  }),
);

results.push(
  await run('2. Public current stories', async () => {
    if (!sessionConfigured) {
      skip('INSTAGRAM_SESSION_ID not set in backend/.env');
    }
    const resolved = await source.resolveProfile(PUBLIC);
    if (resolved.profile.storyCount === 0) {
      skip(`@${PUBLIC} has no active stories right now — try another TEST_PUBLIC_USERNAME`);
    }
    const stories = await source.fetchStories(resolved);
    assert(stories.length > 0, 'expected at least one story');
    assert(stories[0].mediaUrl.startsWith('http'), 'story media URL required');
    console.log(`         → ${stories.length} story item(s)`);
  }),
);

results.push(
  await run('3. Public highlights', async () => {
    if (!sessionConfigured) {
      skip('INSTAGRAM_SESSION_ID not set in backend/.env');
    }
    const resolved = await source.resolveProfile(PUBLIC);
    if (resolved.profile.highlightCount === 0) {
      skip(`@${PUBLIC} has no highlights`);
    }
    const highlights = await source.fetchHighlights(resolved);
    assert(highlights.length > 0, 'expected highlight tray items');
    assert(highlights[0].coverUrl.startsWith('http'), 'highlight cover URL required');
    console.log(`         → ${highlights.length} highlight(s): ${highlights.map((h) => h.title).join(', ')}`);

    const first = highlights[0];
    const detail = await source.fetchHighlight(resolved, first.id);
    assert(detail.items.length > 0, 'highlight should contain items');
    console.log(`         → highlight "${detail.title}" has ${detail.items.length} item(s)`);
  }),
);

results.push(
  await run('4. Private account error', async () => {
    if (!PRIVATE) {
      skip('Set TEST_PRIVATE_USERNAME in backend/.env to a known private account');
    }
    try {
      await source.resolveProfile(PRIVATE);
      throw new Error('Expected ACCOUNT_PRIVATE but profile loaded');
    } catch (e) {
      assertCode(e, 'ACCOUNT_PRIVATE');
    }
  }),
);

results.push(
  await run('5. No stories error', async () => {
    let username = NO_STORIES;
    if (!username) {
      const resolved = await source.resolveProfile(PUBLIC);
      if (resolved.profile.storyCount > 0) {
        skip(
          'Set TEST_NO_STORIES_USERNAME to a public account with no active story, or use an account with storyCount 0',
        );
      }
      username = PUBLIC;
    }
    const resolved = await source.resolveProfile(username);
    try {
      await source.fetchStories(resolved);
      if (resolved.profile.storyCount === 0) {
        throw new Error('Expected NO_STORIES when storyCount is 0');
      }
      skip(`@${username} currently has stories — set TEST_NO_STORIES_USERNAME to an account with none`);
    } catch (e) {
      assertCode(e, 'NO_STORIES');
    }
  }),
);

const pass = results.filter((r) => r === 'PASS').length;
const fail = results.filter((r) => r === 'FAIL').length;
const skipped = results.filter((r) => r === 'SKIP').length;

console.log('\n---');
console.log(`  ${pass} passed, ${fail} failed, ${skipped} skipped`);
console.log('');

if (fail > 0) process.exit(1);
if (!sessionConfigured) {
  console.log('  Tip: Add INSTAGRAM_SESSION_ID to backend/.env for full stories/highlights tests.');
  console.log('  See backend/docs/SESSION_SETUP.md\n');
}
