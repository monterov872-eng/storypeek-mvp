# Safe `INSTAGRAM_SESSION_ID` setup (local testing only)

## What this is

| | |
|---|---|
| **Users of your app** | Never log in. No passwords stored. |
| **Your backend server** | Uses one optional cookie so Instagram allows stories/highlights |
| **Where it lives** | **Only** `backend/.env` (gitignored) — never mobile, never git |

This is **not** end-user authentication. It is a developer-only bridge while you use Instagram’s public web API without a paid provider.

## Public stories require a session (including `@joss_x1400`)

Without `INSTAGRAM_SESSION_ID`, Instagram returns `{"reels":{},"status":"ok"}` — **empty but not “no stories.”** The backend logs `story_fetch_requires_session` and returns a clear error instead of “No stories.”

With `INSTAGRAM_SESSION_ID` in `backend/.env`, unlock → fetch returns real story items.

## Security rules

1. **Never** put `INSTAGRAM_SESSION_ID` in the mobile app, `EXPO_PUBLIC_*`, or client code.
2. **Never** commit `.env` — it is listed in `.gitignore`.
3. Use a **throwaway** Instagram account for testing, not your personal main account if you can avoid it.
4. **Rotate** the cookie when stories/highlights start failing (session expired).
5. **Revoke** by logging out of Instagram in the browser or changing password — old `sessionid` dies.
6. Production: use a secrets manager (Railway/Fly secrets), not a file in the repo.

## Step-by-step (Chrome / Edge)

1. Open **https://www.instagram.com** in a desktop browser.
2. Log in with a test account (any account you control).
3. Open **DevTools** → **Application** (Chrome) or **Storage** (Firefox).
4. Under **Cookies** → `https://www.instagram.com`, find **`sessionid`**.
5. Copy **only the Value** (long alphanumeric string). Do not copy the name.
6. Open `backend/.env` (create from `.env.example` if needed):

```env
PORT=3001
INSTAGRAM_PROVIDER=web

# Paste ONLY the sessionid value — no quotes needed unless your editor adds them
INSTAGRAM_SESSION_ID=YOUR_VALUE_HERE
```

7. Save the file. Restart the API:

```powershell
cd backend
npm run dev
```

8. Confirm session is loaded (value is **not** printed):

```powershell
npm run test:integration
```

You should see `Session configured: yes (hidden)`.

## Optional test usernames

Add to `backend/.env` for the integration suite:

```env
TEST_PUBLIC_USERNAME=natgeo
TEST_PRIVATE_USERNAME=some_known_private_account
TEST_NO_STORIES_USERNAME=some_public_account_with_no_active_story
```

- **Private test:** a real private account you know (friend/test account).
- **No stories test:** a public account with **no active story** right now (check in browser first).

## Verify without exposing the secret

```powershell
cd backend
npm run test:integration
```

Do **not** paste `INSTAGRAM_SESSION_ID` into chat, tickets, or screenshots.

## If tests fail

| Symptom | Action |
|---------|--------|
| `Session configured: no` | Add `INSTAGRAM_SESSION_ID` to `backend/.env` and restart |
| Stories/highlights `SKIP` | Session missing or expired — refresh cookie |
| `blocked` / HTML response | New `sessionid` from browser |
| Profile works, media fails | Normal without session; add session for full test |

## Switch to paid provider later

Set `INSTAGRAM_PROVIDER=rest` and remove `INSTAGRAM_SESSION_ID`. Mobile app unchanged.
