# Run StoryPeek on Android (local MVP)

## Prerequisites

- Node.js 20+
- [Android Studio](https://developer.android.com/studio) with an emulator **or** a USB-connected phone
- Expo Go from Play Store (fastest) **or** Android Studio emulator + `npx expo run:android`

## 1. Start the API (web provider)

```powershell
cd C:\Users\monte\projects\storypeek-mvp\backend
copy .env.example .env
```

Edit `.env` (see **`backend/docs/SESSION_SETUP.md`** for safe `INSTAGRAM_SESSION_ID` setup):

```
INSTAGRAM_PROVIDER=web
INSTAGRAM_SESSION_ID=your_sessionid_value
```

`.env` is gitignored — users never see this cookie; only your server uses it.

```powershell
npm run dev
```

Confirm: open `http://localhost:3001/health` → `"instagramProvider":"web"`

## 2. Point the app at the API

```powershell
cd C:\Users\monte\projects\storypeek-mvp\mobile
```

Edit `.env`:

| Target | `EXPO_PUBLIC_API_URL` |
|--------|------------------------|
| Android emulator | `http://10.0.2.2:3001` |
| Physical phone (same Wi‑Fi) | `http://YOUR_PC_IP:3001` |

## 3. Start Expo

```powershell
npx expo start
```

Press **`a`** to open on the Android emulator, or scan the QR code with Expo Go on your phone.

## 4. Test search

1. Open app → search `natgeo` or `nasa`
2. Profile should load with photo and bio
3. Tap **Watch ad · Unlock Stories** (stub ad) → view stories if server session is configured
4. Tap **Unlock Highlights** for highlight rings

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Network request failed | Wrong API URL — use `10.0.2.2` on emulator |
| Profile not loading | Backend not running; check firewall allows port 3001 |
| Stories always empty | Add `INSTAGRAM_SESSION_ID` to `backend/.env` (see `backend/docs/WEB_PROVIDER.md`) |
| Cleartext HTTP blocked | `app.json` already sets `usesCleartextTraffic: true` for dev |

## Production build (later)

Use EAS Build and HTTPS API URL — cleartext HTTP is for local dev only.
