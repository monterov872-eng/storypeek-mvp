# RapidAPI Instagram Stories

Secure server-side proxy for [Instagram Scraper Stable API](https://rapidapi.com/thetechguy32744/api/instagram-scraper-stable-api). The RapidAPI key never ships to the mobile app or browser test page.

## Setup

1. Subscribe to **Instagram Scraper Stable API** on RapidAPI.
2. Copy your **X-RapidAPI-Key** from the RapidAPI dashboard.
3. Create `backend/.env` from the example:

```bash
cd backend
cp .env.example .env
```

4. Add your key:

```env
RAPID_API_KEY=your_rapidapi_key_here
RAPID_API_TIMEOUT_MS=20000
```

5. Install and start the API:

```bash
npm install
npm run dev
```

The server listens on `http://localhost:3001` by default.

## API endpoints

### POST `/v1/rapid/stories`

**Request (JSON)**

```json
{ "username": "natgeo" }
```

**Response (200)**

```json
{
  "username": "natgeo",
  "stories": [
    {
      "id": "123",
      "username": "natgeo",
      "mediaType": "image",
      "mediaUrl": "https://...",
      "thumbnailUrl": "https://...",
      "takenAt": "2026-05-19T12:00:00.000Z"
    }
  ],
  "provider": "rapidapi",
  "fetchedAt": "2026-05-19T12:00:00.000Z"
}
```

### GET `/api/stories/:username`

Flutter-friendly alias for the same RapidAPI proxy (Android emulator: `http://10.0.2.2:3001/api/stories/natgeo`).

### GET `/api/highlights/:username`

Uses `POST get_ig_user_highlights.php` (override with `RAPID_API_HIGHLIGHTS_PATH`).

The server tries `username_or_url` as plain username and profile URL, logs raw JSON (`rapidapi_raw_response`), then logs parse stats (`rapidapi_highlights_parsed`). If RapidAPI returns no parseable items (or rate limit), it can fall back to the web session provider when `INSTAGRAM_SESSION_ID` is set.

### GET `/api/highlights/:username/:highlightId/stories`

Opens a highlight tray item. Uses the same Stable API key with:

```env
RAPID_API_KEY=your_rapidapi_key_here
# optional override (default: /get_ig_user_highlights.php)
RAPID_HIGHLIGHT_STORIES_PATH=/get_ig_user_highlights.php
```

The server `POST`s `https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_user_highlights.php` with `username_or_url` and highlight id fields, then maps media URLs with the same parser as active stories (`parseStoriesMedia`).

If the highlight API is missing or fails, and `INSTAGRAM_SESSION_ID` is set, the server tries Instagram web `reels_media` before returning HTTP 200 with:

```json
{
  "stories": [],
  "storiesUnavailable": true,
  "notice": "Highlight opened, but story items endpoint is not available."
}
```

Optional query: `?title=Highlight%20Name`

Same routes exist under `/v1/rapid/highlights/…`.

### Raw response logging

Every RapidAPI call logs a JSON line to the backend console:

```json
{
  "event": "rapidapi_raw_response",
  "kind": "stories|highlights|highlight_stories",
  "username": "instagram",
  "highlightId": "highlight:18223279177302854",
  "path": "/get_ig_user_highlights.php",
  "status": 200,
  "raw": { }
}
```

Use this to inspect the upstream JSON shape while debugging parsers.

### GET `/v1/rapid/stories/:username`

Same response as POST; useful for quick tests in the browser.

### Errors

Errors use the same JSON shape as other StoryPeek routes:

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "RapidAPI is not configured. Set RAPID_API_KEY in backend/.env.",
    "reason": "upstream"
  }
}
```

## Test page (frontend)

With the backend running, open:

**http://localhost:3001/stories-test.html**

1. Enter a public Instagram username.
2. Click **Fetch stories**.
3. Images and videos render in a grid; raw JSON appears when the parser finds no media URLs.

The page calls `POST /v1/rapid/stories` on the same origin, so no API key is exposed in the browser.

## cURL example

```bash
curl -X POST http://localhost:3001/v1/rapid/stories \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"natgeo\"}"
```

## Health check

```bash
curl http://localhost:3001/health
```

Look for `"rapidApiConfigured": true` when `RAPID_API_KEY` is set, and `"rapidHighlightApiConfigured": true` when `RAPID_HIGHLIGHT_API_HOST` and `RAPID_HIGHLIGHT_API_KEY` are set.

## Security notes

- `RAPID_API_KEY`, `RAPID_HIGHLIGHT_API_KEY`, and `RAPID_HIGHLIGHT_API_HOST` are read only from server environment variables.
- Do not add the key to `EXPO_PUBLIC_*` or any mobile `.env`.
- Do not commit `backend/.env` (gitignored).
- Rate limiting applies via the existing IP and profile search limiters.
