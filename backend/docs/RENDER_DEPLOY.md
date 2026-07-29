# Deploy Silent View API to Render

This guide deploys the **backend** (`backend/`) as a Render Web Service. The mobile app calls this API for profile searches, stories, and highlights.

---

## Prerequisites

- [Render](https://render.com) account (free tier works for testing)
- GitHub repo connected to Render
- Backend secrets ready (see [Environment variables](#environment-variables))

---

## 1. Create a Web Service on Render

1. Open [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**
2. Connect this repository
3. Use these settings:

| Setting | Value |
|---------|--------|
| **Name** | `silent-view-api` (or your choice) |
| **Region** | Closest to your users |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` |

Render injects `PORT` automatically. The server listens on **`0.0.0.0`** and uses `process.env.PORT`.

---

## 2. Environment variables

Set these in **Render → your service → Environment**:

### Required

| Variable | Example | Notes |
|----------|---------|--------|
| `NODE_ENV` | `production` | Enables production mode |
| `INSTAGRAM_PROVIDER` | `web` | Use `web` for free public scraping, or `rest` for a paid proxy |
| `INSTAGRAM_SESSION_ID` | *(secret)* | Required for stories with `web` provider. See `SESSION_SETUP.md` |

### Optional (recommended for production)

| Variable | Notes |
|----------|--------|
| `RAPID_API_KEY` | If using RapidAPI for stories/highlights |
| `RAPID_HIGHLIGHT_API_KEY` | Separate RapidAPI product for highlight items |
| `RAPID_HIGHLIGHT_API_HOST` | RapidAPI host for highlight stories |

### Do not set manually

| Variable | Notes |
|----------|--------|
| `PORT` | Render sets this automatically |

---

## 3. Deploy and verify

1. Click **Create Web Service** (or **Manual Deploy** after saving env vars)
2. Wait for the build log to show `npm run build` completing
3. When live, open:

```
https://YOUR-SERVICE.onrender.com/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "storypeek-api",
  "instagramProvider": "web",
  "rapidApiConfigured": false,
  "rapidHighlightApiConfigured": false
}
```

4. Test a profile search (replace username):

```
https://YOUR-SERVICE.onrender.com/v1/profile/natgeo
```

(Add header `x-device-id: test-device` — the API requires it.)

---

## 4. Point the mobile app at Render

Production builds use **`EXPO_PUBLIC_API_URL`** (HTTPS only — cleartext HTTP is disabled in production).

### Option A — `eas.json` (recommended)

After Render gives you a URL like `https://silent-view-api.onrender.com`, update `mobile/eas.json`:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://silent-view-api.onrender.com"
  }
}
```

Replace `YOUR-SERVICE.onrender.com` placeholder with your actual Render URL **before** running `eas build --profile production`.

### Option B — EAS secret

```bash
cd mobile
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://silent-view-api.onrender.com
```

### Development vs production (automatic)

| Mode | API URL source |
|------|----------------|
| **Local dev** (`npm run dev`, `__DEV__`) | Auto: `http://10.0.2.2:3001` (Android emulator) or `http://localhost:3001` (iOS). Override with `mobile/.env` if needed. |
| **Production EAS build** | `EXPO_PUBLIC_API_URL` from `eas.json` or EAS secrets → Render HTTPS URL |

No code changes needed when switching — set the env var for production builds only.

---

## 5. Build production app

```bash
cd mobile
eas build --platform android --profile production
```

The AAB will call your Render API over HTTPS.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Render | Check build logs; ensure **Root Directory** is `backend` |
| Service sleeps (free tier) | First request after idle may take ~30s; upgrade or accept cold starts |
| 502 / deploy failed | Verify **Start Command** is `npm start` and build produced `dist/` |
| Rate limits wrong IP | `trust proxy` is enabled in `app.ts` for Render |
| Stories empty | Set `INSTAGRAM_SESSION_ID` in Render env (see `SESSION_SETUP.md`) |
| App can't connect in production | Confirm `EXPO_PUBLIC_API_URL` uses `https://` and matches your Render URL |

---

## Render settings summary (copy-paste)

```
Root Directory:  backend
Build Command:   npm install && npm run build
Start Command:   npm start
Health Check:    /health
```
