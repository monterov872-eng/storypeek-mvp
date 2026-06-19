# SilentView Release Checklist

Use this checklist before submitting to the App Store or Google Play. Nothing in this document publishes the app automatically.

## Shared requirements

- [ ] Privacy Policy URL or in-app Privacy Policy (implemented in app under **Legal & privacy**)
- [ ] Terms of Use (in-app)
- [ ] Disclaimer (in-app)
- [ ] Support / contact email configured (`Monterov872@gmail.com`)
- [ ] App screenshots (phone sizes: SE, standard, Pro Max)
- [ ] App description and subtitle
- [ ] Content rating questionnaire completed
- [ ] No subscription or premium IAP (ads only)
- [ ] Replace AdMob **test** app/unit IDs with production IDs
- [ ] Point `API_BASE_URL` to production backend via `--dart-define`

## iOS App Store

### Identity
- [ ] Display name: **SilentView** (Spanish: **Vista Silenciosa** via `es.lproj/InfoPlist.strings`)
- [ ] Bundle ID: `com.silentview.app`
- [ ] Version: `1.0.0` / Build: `1` (from `pubspec.yaml`)

### Technical
- [ ] Apple Developer account + signing certificates
- [ ] App Store Connect app record created
- [ ] `GADApplicationIdentifier` set to production AdMob app ID in `Info.plist`
- [ ] App Tracking Transparency copy if you enable personalized ads
- [ ] Privacy Nutrition Labels (data collected: local search history; ads identifier if using AdMob)
- [ ] Backend reachable over **HTTPS** in production (ATS)

### Store listing
- [ ] Category suggestion: **Photo & Video** or **Entertainment**
- [ ] Age rating: likely **12+** (social/content viewer; verify with questionnaire)
- [ ] Notes: third-party Instagram content, not affiliated with Meta

### Permissions
- [ ] Internet only (no camera, contacts, or location required)

## Google Play Store

### Identity
- [ ] App name: **SilentView**
- [ ] Application ID: `com.silentview.app`
- [ ] Version code / name from `pubspec.yaml`

### Technical
- [ ] Play Console app created
- [ ] Release signing keystore (replace debug signing in `build.gradle.kts`)
- [ ] `com.google.android.gms.ads.APPLICATION_ID` production value in `AndroidManifest.xml`
- [ ] Target API level meets Play requirements

### Store listing
- [ ] Category: **Entertainment** or **Social**
- [ ] Content rating: IARC questionnaire
- [ ] Data safety form: local storage, ads, no account credentials

### Permissions
- [ ] `INTERNET` only

## API / security notes

- SilentView does **not** collect Instagram passwords.
- Content is fetched via your backend and third-party APIs; availability is not guaranteed.
- Rate limits should return user-friendly messages (handled in app).
- Use HTTPS and authentication on production API endpoints.
- For physical devices during development, run with your LAN IP:
  `flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3001`

## Pre-release smoke test

- [ ] Search public profile → stats, avatar, posts grid
- [ ] Search private profile → public stats visible, locked content
- [ ] Stories viewer timing (video length, 5s images)
- [ ] Highlight viewer + one ad before album
- [ ] Carousel post viewer
- [ ] Interstitial before stories (or skip if ad fails)
- [ ] Network timeout shows friendly message + retry
- [ ] Legal pages open from Home

## Build commands (later)

```bash
# iOS release (after signing setup)
cd flutter
flutter build ipa --dart-define=API_BASE_URL=https://YOUR_API_HOST

# Android release (after keystore setup)
flutter build appbundle --dart-define=API_BASE_URL=https://YOUR_API_HOST
```
