# Build & Run Commands

Quick reference for running this app during development. See `docs/PLANNING.md` for the full architecture/decisions; this doc is just the commands.

## Prerequisites (one-time)

- Xcode installed, signed in with an Apple ID (Xcode → Settings → Accounts → "Personal Team" is enough for local builds, no paid Developer Program needed).
- API server running locally (`everly/apps/api`), or `EXPO_PUBLIC_API_URL` in `.env` pointed at a reachable one — the app talks to a real backend, nothing runs standalone.
- `.env` at the repo root sets `EXPO_PUBLIC_API_URL`. This value depends on what you're testing against, and must be swapped by hand when switching targets:

  | Target | `.env` value |
  |---|---|
  | iOS Simulator | `http://localhost:3000` |
  | Physical device | `http://<your Mac's LAN IP>:3000` — find it with `ipconfig getifaddr en0` (or `en1`). This changes when your Mac reconnects to WiFi, so re-check it if the app suddenly can't reach the server. |

  After editing `.env`, restart the Metro bundler (`npx expo start`) — env vars are read at bundle time, not live.

## Day-to-day development (no native changes)

```bash
npx expo start
```
Starts Metro. Press `i` to (re)open on iOS. Fast Refresh applies JS/TS/styling edits instantly — no rebuild needed. Use this for the vast majority of work.

## Full native rebuild

Only needed when:
- Installing a package with native code (anything that isn't pure JS — most `expo-*` packages, `react-native-*` packages).
- Editing `app.json`, `babel.config.js`, or `metro.config.js`.

**iOS Simulator** (default day-to-day target — faster, no cable, but can't fully test camera/GPS):
```bash
npx expo run:ios
```

**Physical iPhone** (needed for a real pass on camera, GPS, and before considering any feature "done" — per `docs/PLANNING.md` §3/§9):
```bash
npx expo run:ios --device
```
Requires the phone plugged in via USB (first time), Developer Mode enabled on-device (Settings → Privacy & Security → Developer Mode), and the dev certificate trusted (Settings → General → VPN & Device Management).

## Choosing a specific simulator device

```bash
xcrun simctl list devices available
```
Lists every installed simulator (device model + iOS version) with its name.

```bash
npx expo run:ios --simulator "iPhone SE (3rd generation)"
```
Boots and installs on that specific simulator (name must match exactly). Useful for checking layout/safe-area behavior on an older or smaller screen, not just whatever's currently booted.

To install more simulator device types or iOS versions: Xcode → Settings → Platforms (or Components) → download additional runtimes.

## Android

```bash
npx expo run:android
```
No physical Android device available for this project — Android Studio's emulator only (per `docs/PLANNING.md` §1/§9). Not yet set up/tested as of this doc's writing; revisit before any Android-specific QA pass.

## Type-checking (no build needed)

```bash
npx tsc --noEmit
```
Fast, catches TS errors without a native rebuild. Run this after any schema/type change before bothering with a full rebuild.

## Known noise, safe to ignore

- **iOS Simulator only**: `CHHapticPattern` / `hapticpatternlibrary.plist` errors in the terminal on keyboard/form-field focus — the Simulator has no vibration hardware; iOS's virtual keyboard's haptic calls fail harmlessly. Doesn't appear on a physical device.
- `(node:...) [DEP0151] DeprecationWarning` for `react-native-worklets`'s `main` field — comes from inside `react-native-reanimated`'s own packaging, not this project's code.
