# SilentView — iOS & device testing

## API base URL

| Environment | URL |
|-------------|-----|
| Android emulator | `http://10.0.2.2:3001` (default) |
| iOS simulator | `http://127.0.0.1:3001` (default) |
| Physical device | Your computer's LAN IP, e.g. `http://192.168.1.42:3001` |
| Production | Set via `--dart-define=API_BASE_URL=https://...` |

Start the backend from the repo root:

```bash
cd backend
npm run dev
```

## iOS simulator

```bash
cd flutter
flutter pub get
open -a Simulator   # macOS only
flutter run -d "iPhone 16"
```

Physical iPhone on the same Wi‑Fi:

```bash
flutter run -d ios --dart-define=API_BASE_URL=http://YOUR_LAN_IP:3001
```

## Android emulator

```bash
cd flutter
flutter pub get
flutter run -d emulator-5554
```

## Ads

Google AdMob **test** IDs are configured. Replace with production IDs before store submission (see `docs/RELEASE_CHECKLIST.md`).

## Legal

In-app: **Home → Legal & privacy** (Privacy Policy, Terms, Disclaimer).
