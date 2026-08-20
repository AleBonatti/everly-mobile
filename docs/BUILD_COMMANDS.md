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

## When a native rebuild doesn't pick up an app.json change

`npx expo run:ios`/`run:android` call `expo prebuild` internally to (re)generate the native `ios/`/`android/` project folders from `app.json` + installed packages' config plugins — normally this is automatic and invisible. Try a plain rebuild first for any `app.json` change (icon, splash, bundle identifier, plugin config, permission strings):

```bash
npx expo run:ios
```

**If the change doesn't show up** (confirmed to happen with NativeWind's babel/metro setup, `expo-image-picker`'s permission strings, and the app icon/bundle identifier — this is a recurring, not hypothetical, gotcha on this project): `expo prebuild`'s normal *incremental* merge into an already-existing `ios/`/`android/` doesn't always pick up every kind of change. Force a full clean regeneration instead:

```bash
rm -rf ios android
npx expo prebuild --clean
npx expo run:ios
```

`ios/`/`android/` are gitignored build artifacts (nothing hand-edited lives there) — deleting and regenerating them is always safe, just slower (a full native rebuild, a few minutes) than the incremental path.

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

## Linting and type-checking (no build needed)

```bash
npm run lint
```
Runs `expo lint` (ESLint, `eslint-config-expo`'s flat config).

```bash
npm run typecheck
```
Runs `tsc --noEmit`. Fast, catches TS errors without a native rebuild.

Both run automatically in CI (`.github/workflows/ci.yml`) on every PR and push to `main` — run them locally first to catch issues before pushing.

## Known noise, safe to ignore

- **iOS Simulator only**: `CHHapticPattern` / `hapticpatternlibrary.plist` errors in the terminal on keyboard/form-field focus — the Simulator has no vibration hardware; iOS's virtual keyboard's haptic calls fail harmlessly. Doesn't appear on a physical device.
- `(node:...) [DEP0151] DeprecationWarning` for `react-native-worklets`'s `main` field — comes from inside `react-native-reanimated`'s own packaging, not this project's code.
