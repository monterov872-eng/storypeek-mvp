# Local development (Silent View)

## One command (recommended)

From the **project root**:

```powershell
cd C:\Users\monte\projects\storypeek-mvp
npm install
npm run dev
```

This starts:

1. **Backend API** — `backend/` on port **3001** (`npm run dev` → `tsx watch src/index.ts`)
2. **Expo mobile app** — waits for `http://localhost:3001/health`, then runs `expo start`

When the backend is ready, the terminal shows:

```
[backend] Silent View API started successfully
[backend] Local:    http://localhost:3001
[backend] Emulator: http://10.0.2.2:3001 (Android)
[backend] Health:   http://localhost:3001/health
```

Press **`a`** in the Expo terminal to open the Android emulator.

### Android emulator + native build

```powershell
npm run dev:android
```

Starts the backend, waits for health, then runs `expo run:android`.

---

## Backend only (profile search API)

Profile searches call **`GET /v1/profile/:username`** on the backend.

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Confirm: open `http://localhost:3001/health` → `"status":"ok"`.

For stories, set `INSTAGRAM_SESSION_ID` in `backend/.env` (see `backend/docs/SESSION_SETUP.md`).

---

## Mobile API URL (Android emulator)

The app defaults automatically:

| Target | URL |
|--------|-----|
| Android emulator | `http://10.0.2.2:3001` |
| iOS simulator | `http://localhost:3001` |

Optional override in `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

Do **not** use `localhost` on the Android emulator — it points at the emulator itself, not your PC.

For a **physical phone** on the same Wi-Fi, set `EXPO_PUBLIC_API_URL` to your PC's LAN address (e.g. `http://192.168.x.x:3001`). Do not commit a fixed IP in code.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Could not reach the server" | Run `npm run dev` from project root (backend not running) |
| Search hangs then times out | Backend slow or Instagram blocked; check backend terminal logs |
| Wrong API on emulator | Ensure `EXPO_PUBLIC_API_URL` is `http://10.0.2.2:3001`, not `localhost` |
| Stories empty | Add `INSTAGRAM_SESSION_ID` to `backend/.env` |
