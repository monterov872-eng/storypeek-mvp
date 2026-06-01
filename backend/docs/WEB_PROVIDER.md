# Web-only Instagram provider (MVP)

## What works without paid APIs

| Feature | Without `INSTAGRAM_SESSION_ID` | With server session cookie |
|---------|-------------------------------|----------------------------|
| Public profile search | Yes | Yes |
| Profile photo / bio | Yes | Yes |
| Story count probe | Sometimes (often 0) | Yes |
| View stories | Usually blocked | Yes |
| View highlights | Blocked | Yes |

Instagram increasingly requires a **server-side session cookie** for stories/highlights. Your app still has **no user login** — this is a one-time developer setup on the API server.

## Enable stories & highlights

**→ Full safe setup guide: [SESSION_SETUP.md](./SESSION_SETUP.md)**

Quick version: copy browser cookie `sessionid` into **`backend/.env` only** (never mobile, never git):

```env
INSTAGRAM_PROVIDER=web
INSTAGRAM_SESSION_ID=your_sessionid_value
```

Restart API, then run:

```bash
npm run test:integration
```

## Test the provider

```bash
cd backend
npm run test:integration
npx tsx scripts/test-web-provider.ts natgeo
```

## Android app → local API

The emulator cannot use `localhost`. In `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

Physical device: use your PC LAN IP, e.g. `http://192.168.1.42:3001`
