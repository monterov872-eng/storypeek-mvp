/**
 * Test highlights parser + optional live RapidAPI call.
 *
 *   npx tsx scripts/test-rapid-highlights.ts
 *   npx tsx scripts/test-rapid-highlights.ts --live jenifer.nty
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.js';
import { parseRapidApiHighlightsWithMeta } from '../src/services/rapidApi/parseHighlights.js';
import { fetchRapidApiHighlights } from '../src/services/rapidApi/rapidApiHighlights.js';

const here = dirname(fileURLToPath(import.meta.url));

function runFixture(name: string, payload: unknown, username: string) {
  const { highlights, meta } = parseRapidApiHighlightsWithMeta(payload, username);
  console.log(`[fixture:${name}] parsed=${highlights.length} buckets=${meta.arrayBuckets}`);
  if (highlights[0]) {
    console.log('  first:', highlights[0].id, highlights[0].title, highlights[0].coverUrl.slice(0, 48));
  }
}

const trayFixture = {
  tray: [
    {
      id: 'highlight:17927864314604086',
      title: 'GRWM',
      cover_media: {
        thumbnail_src: 'https://cdn.example.com/cover.jpg',
      },
    },
  ],
};

const edgesFixture = {
  data: {
    user: {
      edge_highlight_reels: {
        edges: [
          {
            node: {
              id: 'highlight:18067016518767507',
              title: 'Travel',
              cover_media_cropped_thumbnail: {
                url: 'https://cdn.example.com/thumb.jpg',
              },
            },
          },
        ],
      },
    },
  },
};

const nestedItemsFixture = {
  data: {
    data: {
      items: [
        {
          id: 'highlight:18223279177302854',
          title: 'CFO Podcast',
          cover_media: {
            cropped_image_version: { url: 'https://cdn.example.com/cfo.jpg' },
          },
        },
      ],
    },
  },
};

console.log('--- Parser fixtures ---');
runFixture('tray', trayFixture, 'jenifer.nty');
runFixture('edges', edgesFixture, 'jenifer.nty');
runFixture('nested-items', nestedItemsFixture, 'jenifer.nty');

try {
  const sample = JSON.parse(readFileSync(join(here, '../tmp-highlights.json'), 'utf8'));
  runFixture('tmp-highlights', sample, 'instagram');
} catch {
  console.log('[fixture:tmp-highlights] skipped (file missing)');
}

const liveArg = process.argv.indexOf('--live');
if (liveArg >= 0) {
  const username = process.argv[liveArg + 1] ?? 'jenifer.nty';
  console.log('\n--- Live RapidAPI ---', username);
  const config = loadConfig();
  try {
    const result = await fetchRapidApiHighlights(username, config);
    console.log('highlights', result.highlights.length);
    for (const h of result.highlights.slice(0, 5)) {
      console.log(' -', h.title, h.id);
    }
  } catch (err) {
    const e = err as Error & { code?: string };
    console.error('live error', e.code ?? e.name, e.message);
  }
}
