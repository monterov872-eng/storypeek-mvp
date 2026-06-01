# Launch StoryPeek on Android emulator (UI first)

Focus: splash → home → navigation. Backend optional for profile search.

---

## Prerequisites (one-time)

1. **Node.js 20+** — https://nodejs.org  
2. **Android Studio** — https://developer.android.com/studio  
3. During Android Studio setup, install:
   - **Android SDK**
   - **Android SDK Platform** (API 34 recommended)
   - **Android Emulator**

4. Install JS dependencies (once):

```powershell
cd C:\Users\monte\projects\storypeek-mvp\mobile
npm install
```

---

## Step 1 — Create an Android emulator (one-time)

1. Open **Android Studio**.
2. **More Actions** → **Virtual Device Manager** (or **Tools → Device Manager**).
3. **Create Device** → pick **Pixel 7** (or any phone) → **Next**.
4. Select a system image (**API 34**, Download if needed) → **Next** → **Finish**.

---

## Step 2 — Start the emulator

1. In **Device Manager**, click the **Play** button on your virtual device.
2. Wait until the Android home screen is fully loaded (1–3 minutes first time).

Verify from PowerShell:

```powershell
adb devices
```

You should see something like `emulator-5554   device`.

If `adb` is not found, add Android SDK platform-tools to PATH:

`%LOCALAPPDATA%\Android\Sdk\platform-tools`

---

## Step 3 — Start Expo (Metro)

Open a **new terminal**:

```powershell
cd C:\Users\monte\projects\storypeek-mvp\mobile
npx expo start
```

Wait until you see the QR code and menu:

```
› Press a │ open Android
```

---

## Step 4 — Run the app on the emulator

With the emulator **already running**, press **`a`** in the Expo terminal.

Expo will:
- Install/open **Expo Go** on the emulator (first time may take a minute)
- Load your app bundle

**Alternative** (single command):

```powershell
cd C:\Users\monte\projects\storypeek-mvp\mobile
npx expo start --android
```

---

## Step 5 — UI checklist (no Instagram stories required)

| Screen | What to verify |
|--------|----------------|
| Splash | “StoryPeek” title, dark gradient, disclaimer at bottom |
| Home | Search bar, “Search” button, example usernames, API URL line at bottom |
| Settings | Gear icon (top right) → Settings screen |
| About | Settings → About & Legal → disclaimer + placeholder policies |

Tap through without searching — app should feel smooth and dark-themed.

---

## Step 6 — Test search flow (needs backend)

For profile search (not stories), start the API in **another terminal**:

```powershell
cd C:\Users\monte\projects\storypeek-mvp\backend
npm run dev
```

Confirm in browser on your PC: http://localhost:3001/health

Mobile `.env` for emulator (already set):

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

If you changed `.env`, restart Expo: **Ctrl+C** → `npx expo start` → **`a`**.

On emulator: search **`natgeo`** → profile card with photo and name (stories/highlights can be ignored for now).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Pressing `a` does nothing | Start emulator first; run `adb devices` |
| “No Android connected device” | Open Device Manager → Play on AVD |
| Red error / Metro failed | `cd mobile` → `npm install` → `npx expo start -c` |
| White screen | Wait 30s; shake emulator → Reload |
| “Network request failed” on search | Start `backend` with `npm run dev`; check API URL is `10.0.2.2` |
| Expo Go not installed | Press `a` again or install “Expo Go” from Play Store in emulator |
| Port in use | `npx expo start --port 8082` |

---

## Daily workflow (short)

```powershell
# Terminal 1 — optional, for search only
cd C:\Users\monte\projects\storypeek-mvp\backend
npm run dev

# Terminal 2 — app
cd C:\Users\monte\projects\storypeek-mvp\mobile
npx expo start
# Press a
```
