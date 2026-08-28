# Build & Run Commands

Quick reference for running this app during development. See `docs/PLANNING.md` for the full architecture/decisions; this doc is just the commands.

## Prerequisites (one-time)

- Xcode installed, signed in with an Apple ID (Xcode → Settings → Accounts → "Personal Team" is enough for local builds, no paid Developer Program needed). For Android prerequisites (Android Studio, SDK paths, JDK), see the [Android](#android) section below.
- `.env` also sets `GOOGLE_MAPS_API_KEY`, consumed by `app.config.js` for `react-native-maps`. Required on Android (the map is blank without it); iOS uses Apple Maps and doesn't need it.
- API server running locally (`everly/apps/api`), or `EXPO_PUBLIC_API_URL` in `.env` pointed at a reachable one — the app talks to a real backend, nothing runs standalone.
- `.env` at the repo root sets `EXPO_PUBLIC_API_URL`. This value depends on what you're testing against, and must be swapped by hand when switching targets:

  | Target | `.env` value |
  |---|---|
  | iOS Simulator | `http://localhost:3000` |
  | Android emulator | `http://10.0.2.2:3000` — the emulator's alias for the host machine's `localhost`; plain `localhost` resolves to the emulator itself and will fail. |
  | Physical device (iOS or Android) | `http://<your Mac's LAN IP>:3000` — find it with `ipconfig getifaddr en0` (or `en1`). This changes when your Mac reconnects to WiFi, so re-check it if the app suddenly can't reach the server. |
  | Production API | `https://api.everlylist.com` |

  After editing `.env`, restart the Metro bundler (`npx expo start`) — env vars are read at bundle time, not live.

## Day-to-day development (no native changes)

```bash
npx expo start
```
Starts Metro. Press `i` to (re)open on iOS, `a` for Android. Fast Refresh applies JS/TS/styling edits instantly — no rebuild needed. Use this for the vast majority of work.

## Full native rebuild

Only needed when:
- Installing a package with native code (anything that isn't pure JS — most `expo-*` packages, `react-native-*` packages).
- Editing `app.config.js`, `babel.config.js`, or `metro.config.js`.

**iOS Simulator** (default day-to-day target — faster, no cable, but can't fully test camera/GPS):
```bash
npx expo run:ios
```

**Physical iPhone** (needed for a real pass on camera, GPS, and before considering any feature "done" — per `docs/PLANNING.md` §3/§9):
```bash
npx expo run:ios --device
```
Requires the phone plugged in via USB (first time), Developer Mode enabled on-device (Settings → Privacy & Security → Developer Mode), and the dev certificate trusted (Settings → General → VPN & Device Management).

**Android** (emulator or connected device):
```bash
npx expo run:android
```
See the [Android](#android) section for device setup, emulator setup, and the Google Maps key requirement.

## When a native rebuild doesn't pick up an app.config.js change

`npx expo run:ios`/`run:android` call `expo prebuild` internally to (re)generate the native `ios/`/`android/` project folders from `app.config.js` + installed packages' config plugins — normally this is automatic and invisible. Try a plain rebuild first for any `app.config.js` change (icon, splash, package/bundle identifier, plugin config, permission strings):

```bash
npx expo run:ios      # or: npx expo run:android
```

**If the change doesn't show up** (confirmed to happen with NativeWind's babel/metro setup, `expo-image-picker`'s permission strings, and the app icon/bundle identifier — this is a recurring, not hypothetical, gotcha on this project): `expo prebuild`'s normal *incremental* merge into an already-existing `ios/`/`android/` doesn't always pick up every kind of change. Force a full clean regeneration instead:

```bash
rm -rf ios android
npx expo prebuild --clean
npx expo run:ios      # or: npx expo run:android
```

`ios/`/`android/` are gitignored build artifacts (nothing hand-edited lives there) — deleting and regenerating them is always safe, just slower (a full native rebuild, a few minutes) than the incremental path.

## Choosing a specific iOS simulator device

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

Android is set up and actively tested — a real Samsung Galaxy S25 is the primary Android target (see `docs/DEVICE_TESTING_BUGS.md` for bugs that only surfaced on real hardware).

### Prerequisites (one-time)

- Android Studio installed, with the Android SDK and platform-tools.
- `~/.zshrc` exports the SDK paths (already set up on this machine):
  ```bash
  export ANDROID_HOME="$HOME/Library/Android/sdk"
  export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
  ```
- JDK 17 (Temurin 17 is what's installed here). Note: JDK 25's `keytool` has a locale-crash bug on non-English systems — prefix with `LANG=en_US.UTF-8` if you hit it.
- `GOOGLE_MAPS_API_KEY` in `.env` — required for `react-native-maps` on Android (wired through `app.config.js` in both the `react-native-maps` plugin and `android.config.googleMaps`). Without it the map renders blank.

### Physical device (primary Android target)

Enable Developer options (Settings → About phone → tap "Build number" 7×) and USB debugging, then plug in via USB.

```bash
adb devices
```
Confirm the device is listed as `device`. If it says `unauthorized`, accept the "Allow USB debugging?" prompt on the phone (tick "Always allow from this computer"); re-plug the cable if the prompt doesn't appear.

```bash
npx expo run:android
```
Builds and installs the debug APK on the connected device. With multiple targets connected (device + emulator, say), `-d` / `--device` prompts for one, or takes a device name directly:

```bash
npx expo run:android --device                 # prompts with a list
npx expo run:android --device <device-name>   # name from `adb devices -l`
```

For a release-flavored local build (catches Proguard/minification issues the debug build hides):
```bash
npx expo run:android --variant release
```

### Emulator

No AVD is currently defined on this machine (`emulator -list-avds` returns nothing) — create one in Android Studio → Device Manager before using the emulator path.

```bash
emulator -list-avds                 # names of installed AVDs
emulator -avd <name> &              # boot one
npx expo run:android                # then build/install onto it
```

Emulator caveats: it does **not** enforce the Google Maps API key's SHA-1 app restriction the way a real device does, and it can't meaningfully test camera or GPS — so a real-device pass is required before considering any feature done (per `docs/PLANNING.md` §3/§9).

### Maps API key and signing fingerprints

The Google Maps key is restricted in Google Cloud Console to the `com.alebonatti.everly` package plus a SHA-1 fingerprint. **Two** fingerprints must be registered, or the map renders blank on one build type or the other:

1. **Debug** — from the project-local keystore that `expo prebuild` generates (not the global `~/.android/debug.keystore`):
   ```bash
   LANG=en_US.UTF-8 keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
2. **Release** — Google Play App Signing's key, copied from Play Console (Protected with Play → Play Store protection → Protect app signing key → App signing → Classical key).

Both are already registered as of 2026-08-26.

### Cloud builds (EAS)

Profiles live in `eas.json`. The `production` profile builds an **app bundle** (`.aab`) for Play Store submission and auto-increments the version code (`appVersionSource: "remote"`, so the version code is tracked by EAS, not the repo).

```bash
eas build --platform android --profile development   # dev client, internal distribution
eas build --platform android --profile preview       # installable APK-style internal build
eas build --platform android --profile production    # AAB for the Play Store
```

```bash
eas submit --platform android --profile production   # upload the AAB to Play Console
```

Build both platforms at once with `--platform all`.

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
- **Android**: the first `npx expo run:android` after a clean prebuild downloads Gradle dependencies and takes several minutes — subsequent builds are incremental and much faster.
