const username = process.argv[2] ?? 'instagram';
const html = await fetch(`https://www.instagram.com/${username}/`, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html',
  },
}).then((r) => r.text());

const m = html.match(/<script type="application\/json" id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (!m) {
  console.log('no next data');
  process.exit(1);
}
const data = JSON.parse(m[1]);
const user = data?.props?.pageProps?.user ?? data?.props?.pageProps?.graphql?.user;
console.log('user keys highlight', Object.keys(user ?? {}).filter((k) => /highlight|reel|story/i.test(k)));
console.log('edge_highlight_reels', user?.edge_highlight_reels?.edges?.length);
console.log('has_public_story', user?.has_public_story);
