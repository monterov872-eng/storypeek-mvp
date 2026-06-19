# Google Play Data Safety — Silent View

Answers for the Play Console **App content → Data safety** questionnaire, based on what
the app actually does in code. Review and adjust if you add analytics, crash reporting, or
change the backend.

## Summary

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all collected data encrypted in transit? | **Yes** (HTTPS to backend; AdMob uses HTTPS) |
| Do you provide a way for users to request data deletion? | No account exists; data is a random ID + local cache. Provide the support email; server records auto-expire. |

## Data types

### 1. Device or other IDs — Advertising ID (via Google AdMob)
- **Collected:** Yes
- **Shared:** Yes (with Google as the ads provider)
- **Processed ephemerally:** No
- **Required or optional:** Required (ads fund the app)
- **Purposes:** Advertising or marketing; Analytics (Google's); Fraud prevention, security, and compliance
- **Linked to identity:** No

### 2. Device or other IDs — App-generated installation ID (sent to Silent View backend)
- **Collected:** Yes
- **Shared:** No (only our own backend)
- **Processed ephemerally:** Yes (used for short-lived rate limits / unlock sessions)
- **Required or optional:** Required (app functionality)
- **Purposes:** App functionality; Fraud prevention, security, and compliance
- **Linked to identity:** No

### 3. App activity — Search history
- **Collected (transmitted off device):** No — stored **locally only** on the device.
  Local-only storage does not need to be declared as "collected." It is listed here for
  transparency. If you later send search history to the backend or analytics, you MUST
  update this answer to "Collected: Yes."

## Data NOT collected
- Personal info (name, email, address) — none
- Financial info — none (no IAP/subscriptions)
- Location — none
- Contacts — none
- Messages — none
- Photos/videos from the device — none (the app displays remote content only)
- Instagram credentials / passwords — never requested or stored

## Security practices
- Data encrypted in transit (HTTPS). Ensure the production backend (`EXPO_PUBLIC_API_URL`)
  is HTTPS before release.
- No login or password handling.

## Permissions (Android manifest)
- `INTERNET` (added automatically by Expo) — required for API calls and ads.
- `com.google.android.gms.permission.AD_ID` — added by the AdMob SDK for the advertising
  ID. This must be reflected in the Data Safety form (declared above).

## Ads / families policy
- The app is **not** designed for children. In AdMob, do not enable "child-directed
  treatment." Content rating is requested as PG (`MaxAdContentRating.PG`).
- Consider adding Google's User Messaging Platform (UMP) consent SDK before serving
  personalized ads in the EEA/UK. Until then the app requests non-personalized ads only.
