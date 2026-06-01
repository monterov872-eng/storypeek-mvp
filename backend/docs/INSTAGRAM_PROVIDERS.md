# Instagram data providers

StoryPeek keeps Instagram access behind a **pluggable `InstagramDataSource`**. The REST API and mobile app never change when you swap providers.

## Architecture

```
Routes (v1)
    └── InstagramProvider (LiveInstagramProvider)
            └── InstagramDataSource
                    ├── WebPublicInstagramSource   (env: INSTAGRAM_PROVIDER=web)
                    ├── GenericRestInstagramSource (env: INSTAGRAM_PROVIDER=rest)  ← recommended prod
                    └── (mock via MockInstagramProvider)
```

## Which provider should I use?

| Provider | Env | Best for |
|----------|-----|----------|
| **mock** | `INSTAGRAM_PROVIDER=mock` | Local UI development |
| **web** | `INSTAGRAM_PROVIDER=web` | Lowest cost / fastest live test; breaks when Instagram changes |
| **rest** | `INSTAGRAM_PROVIDER=rest` | **Production** — vendor API or your own thin proxy |

### Recommended production path (`rest`)

1. Sign up for a **third-party Instagram data API** (or run a small proxy you control).
2. Map their responses to the contract in `genericRest/source.ts`.
3. Set `INSTAGRAM_REST_BASE_URL` and `INSTAGRAM_REST_API_KEY`.
4. When the vendor changes, update only the proxy — not the mobile app.

This avoids running fragile scrapers on your main API server and makes compliance review easier (one integration point).

### Web public provider (`web`)

Uses Instagram’s public web endpoints from the server:

- `GET /api/v1/users/web_profile_info/?username=`
- `GET /api/v1/feed/reels_media/?reel_ids={userId}`
- `GET /api/v1/highlights/{userId}/highlights_tray/`

**Public accounts only** — private profiles return `ACCOUNT_PRIVATE`.

If story requests return 401/403, set optional `INSTAGRAM_SESSION_ID` (server env only, not the mobile app). Rotate it regularly.

## Enable live data locally

```bash
cd backend
cp .env.example .env
# Edit .env: INSTAGRAM_PROVIDER=web
npm run dev
```

Verify: `GET http://localhost:3001/health` → `"instagramProvider": "web"`

Then search a **real public username** from the mobile app.

## Generic REST contract

Your proxy or vendor should expose:

```
GET /users/:username/profile
→ { "userId": "123", "profile": { ... Profile fields } }

GET /users/:username/stories
→ { "stories": [ ... StoryItem ] }

GET /users/:username/highlights
→ { "highlights": [ ... HighlightSummary ] }

GET /users/:username/highlights/:highlightId
→ { "highlight": { ... HighlightDetail } }
```

Errors should use HTTP status or body `{ "error": { "code": "ACCOUNT_PRIVATE" } }` matching `ApiErrorCode`.

## Compliance reminders

- Only index **public** profiles; reject private accounts.
- Do not collect Instagram passwords in the app or API.
- Disclose third-party data handling in your Privacy Policy.
- Instagram/Meta may restrict automated access; plan for provider swaps.
