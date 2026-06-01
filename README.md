# StoryPeek MVP

Cross-platform (iOS + Android) app to search **public** social profiles and view public stories and highlights. Anonymous — no login, no credentials stored.

> **Disclaimer:** This app is not affiliated with Instagram or Meta.

## Stack

| Layer | Choice |
|-------|--------|
| Mobile | **Expo (React Native) + TypeScript + Expo Router** |
| Backend | **Node.js + Express + TypeScript** |
| Ads (MVP stubs) | `react-native-google-mobile-ads` (wire AdMob IDs in production) |
| Analytics (MVP stubs) | Firebase Analytics via `@react-native-firebase/analytics` or Expo-compatible alternative |

### Why Expo over Flutter for this MVP

- Faster iteration: OTA updates with EAS, single JS/TS codebase, huge npm ecosystem for ads/analytics.
- Expo Router gives file-based navigation similar to Next.js — quick to add screens.
- AdMob and Firebase have mature React Native paths; team hiring is easier if you already know React.
- Flutter is excellent for UI consistency, but ads + third-party SDK wiring often takes longer for a solo/small team MVP.

## Architecture

```
┌─────────────────┐     HTTPS JSON      ┌──────────────────┐
│  Expo mobile    │ ◄─────────────────► │  Express API     │
│  (UI only)      │                     │  (rate limit)    │
└────────┬────────┘                     └────────┬─────────┘
         │                                         │
         │ AdMob / Analytics                       │ InstagramProvider
         ▼                                         ▼
   Google / Firebase                      mock │ live adapter
```

- **Mobile** never talks to Instagram directly — only your API. Unlock state is validated server-side (10 min TTL).
- **Backend** exposes stable REST endpoints; swap `MockInstagramProvider` → `LiveInstagramProvider` without changing the app.
- **Unlocks**: After rewarded/interstitial ad, client calls `POST /unlock` with `type: stories|highlights` and `username`; server returns expiry timestamp.

## API (v1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/v1/profile/:username` | Public profile metadata |
| GET | `/v1/profile/:username/stories` | Stories (requires unlock or returns 402) |
| GET | `/v1/profile/:username/highlights` | Highlight list |
| GET | `/v1/profile/:username/highlights/:id` | Highlight items |
| POST | `/v1/unlock` | Grant 12 min unlock after ad completion |
| POST | `/v1/rapid/stories` | Instagram stories via RapidAPI (server-side key) |
| GET | `/v1/rapid/stories/:username` | Same as POST (query by path) |

RapidAPI setup and test page: [backend/docs/RAPIDAPI_STORIES.md](backend/docs/RAPIDAPI_STORIES.md)

## Run locally

### Backend

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:3001` (set `EXPO_PUBLIC_API_URL` in mobile `.env`).

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Use Expo Go for quick testing; use EAS Build for store binaries.

## Live Instagram data

Three provider modes (`INSTAGRAM_PROVIDER`):

| Mode | Description |
|------|-------------|
| `mock` | Fake data for UI dev (default) |
| `web` | Server calls Instagram public web API (fast to test, fragile) |
| `rest` | **Recommended prod** — your API calls a third-party or sidecar proxy |

See [backend/docs/INSTAGRAM_PROVIDERS.md](backend/docs/INSTAGRAM_PROVIDERS.md) for setup and REST contract.

**Server session (stories/highlights, local only):** [backend/docs/SESSION_SETUP.md](backend/docs/SESSION_SETUP.md) — put `INSTAGRAM_SESSION_ID` in `backend/.env` only.

**Android local run:** [docs/ANDROID_LOCAL.md](docs/ANDROID_LOCAL.md)

**Quick live test:**

```bash
cd backend
cp .env.example .env
# Set INSTAGRAM_PROVIDER=web
npm run dev
```

**Production pattern:** run `examples/local-rest-proxy.ts` (or a vendor API) and set `INSTAGRAM_PROVIDER=rest`.

## Mock data

The backend ships with `MockInstagramProvider`. Usernames:

- `demo` — full profile with stories + highlights
- `private_user` — private account error
- `ghost` — not found
- `empty` — public but no stories

Replace with a **live provider** that respects public-only access and your legal review before production.

## Production backend (low cost)

1. **Railway** or **Fly.io** — ~$5–10/mo for a small Node container.
2. **Upstash Redis** — rate limits + unlock TTL (~free tier).
3. Optional **Cloudflare** in front for DDoS and caching static CDN URLs only (do not cache personalized unlock responses).

## Risks and limitations

1. **Instagram / Meta ToS** — Unofficial access to Instagram data may violate Meta Platform Terms and Instagram Terms of Use. App Store / Play Store may reject or remove the app; Meta may block infrastructure.
2. **No official public Stories API** — You depend on fragile unofficial methods or licensed third-party data; expect breakage when Instagram changes.
3. **“Anonymous”** — You do not collect Instagram logins, but device IDs, IPs, and ad/analytics SDKs still create a privacy footprint — disclose in Privacy Policy.
4. **Trademark** — Do not use Instagram logos or imply endorsement; keep the disclaimer visible.
5. **Rate limiting** — Required to avoid bans and abuse; may frustrate power users.
6. **Content moderation** — Public UGC can include sensitive material; consider reporting flows for store compliance.

## Next steps before launch

- [ ] Legal review of Terms, Privacy Policy, and data sourcing
- [ ] Implement `LiveInstagramProvider` behind feature flag
- [ ] AdMob app IDs + mediation
- [ ] Firebase (or Amplitude) analytics events
- [ ] EAS Build + store listings (no Instagram branding in screenshots)
- [ ] Spanish i18n (`expo-localization` + `i18next`)
