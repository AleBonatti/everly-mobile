# Real-Device Testing — Bug List

Bugs found while testing on a real Android device (Samsung Galaxy S25) as part of the Android publish push, ahead of the Play Store submission. These are regressions/gaps against already-built MVP screens — surfaced only once running on real hardware, not caught on emulator or during original development. Unlike `docs/POST_MVP.md` (new scope) or `docs/PLANNING.md` (MVP definition), this doc tracks fix-it items against existing features.

Expected to grow as testing continues (more Android devices, then iOS once Apple Developer enrollment clears).

Status legend: 🔴 open · 🟡 in progress · ✅ fixed

---

## Log

### 1. Home screen footer bar overlaps system navigation bar

**Status:** ✅ fixed
**Device:** Galaxy S25 (gesture nav / 3-button nav — confirm which)

The bottom bar on the items list (filters + add button) is partially covered by the phone's own system navigation bar (back/home/recent-apps). Fixed by adding `useSafeAreaInsets()` from `react-native-safe-area-context` and applying `paddingBottom: insets.bottom + 12` (inline style) to the footer `View` in `app/index.tsx`, replacing the fixed `pb-6` class. The `+12` value (down from an initial `+24`) was tuned by hand on-device to match the mockup's visual weight on top of the safe-area inset.

### 2. Search input text is too large

**Status:** ✅ fixed

The items-list search bar's text/box rendered too large relative to the rest of the UI. Root cause was two-fold: (1) the `TextInput` had no explicit font-size class, falling back to RN's larger default — fixed with `text-[13px]` to match the mockup's explicit `font-size:13px`. (2) Android's native `TextInput` reserves its own intrinsic vertical padding/font padding independent of the container's `py-*` class, which is why reducing the container padding alone (even down to `py-0`) didn't fully remove the extra height — fixed by setting `paddingVertical: 0` and `includeFontPadding: false` directly on the `TextInput`'s `style` prop in `app/index.tsx`, then restoring the outer container's padding to control the actual visual spacing.

### 3. Map/location picker broken on real device

**Status:** ✅ fixed

Three separate root causes bundled under one symptom:
- **Map rendered nothing at all**: the Google Maps API key's Android app restriction in Google Cloud Console was locked to the wrong SHA-1 certificate fingerprint (didn't match the local debug keystore at `android/app/debug.keystore`, which is separate from the classic global `~/.android/debug.keystore` path — Expo's prebuild generates its own project-local one). Real devices enforce this restriction where some emulator setups don't, which is why it only surfaced on-device. Fixed by updating the key's Android restriction entry in Cloud Console with the correct debug SHA-1 (obtained via `keytool -list -v -keystore android/app/debug.keystore ...` — note: JDK 25's `keytool` has a locale-crash bug on non-English systems, worked around with `LANG=en_US.UTF-8`). **Follow-up needed before Play Store release**: the release build's SHA-1 will come from Play Console's "App signing key certificate" (Google re-signs the app under Play App Signing), not a local keystore — must be added to this same key restriction before the store submission.
- **Keyboard covering the Location input** and **no scroll-into-view on focus**: same root cause as #5 below — see that entry, fixed by the same `react-native-keyboard-controller` swap applied in `app/item/[id].tsx`.
- **Geocode not triggering on keyboard dismiss**: the address-to-pin geocode only fired on `onSubmitEditing` (keyboard's explicit submit action), not on blur/dismiss-by-tapping-away. Not yet explicitly re-verified as fixed post-keyboard-fix — worth a dedicated re-check that dismissing the keyboard without pressing "submit" still triggers geocoding, since the underlying trigger logic (`onSubmitEditing` only) wasn't itself changed, only the keyboard-covering symptom around it.

### 4. Auth screen transitions look wrong

**Status:** ✅ fixed

Initially misdiagnosed as a side-effect of the keyboard-avoidance bug (#5) — it wasn't. After the keyboard fix, the transition still looked wrong: a brief flash of white background on the incoming screen during the login/register/forgot-password slide, before the view "snapped" in rather than sliding smoothly. Root cause: neither the auth stack (`app/(auth)/_layout.tsx`) nor the root stack (`app/_layout.tsx`) set `contentStyle` on their `Stack`, so React Navigation's native stack container used the system default (white) background during the transition animation, before each screen's own `bg-screen` className had painted over it. Fixed by adding a `screen: "#0e0a07"` entry to `src/lib/theme.ts` (matching `tailwind.config.js`'s existing `screen` token — this is a legitimate `theme.ts` case since `contentStyle` needs a raw JS value, not a className) and setting `contentStyle: { backgroundColor: colors.screen }` in both stacks' `screenOptions`.

### 5. Auth forms partially covered by keyboard

**Status:** ✅ fixed

Root cause, confirmed across this and item #3's location field: Expo SDK 54+ made edge-to-edge display mandatory on Android, which breaks the classic `android:windowSoftInputMode="adjustResize"` + RN's built-in `KeyboardAvoidingView` combo — `behavior="height"` in particular fights the OS resize instead of cooperating with it. Fixed by installing `react-native-keyboard-controller` (`npx expo install react-native-keyboard-controller`), wrapping the app root (`app/_layout.tsx`) in its `KeyboardProvider`, and swapping RN's core `KeyboardAvoidingView` for the library's version (used with `behavior="padding"` on all platforms, no more `Platform.OS` branching) in `src/components/AuthScreenLayout.tsx`, `app/item/[id].tsx`, and `app/settings.tsx`.

**Regressions caught and fixed during this change** (all in `src/components/AuthScreenLayout.tsx` / `src/components/FormInput.tsx`):
- Swapping the layout's plain centered `View` for a `ScrollView` (needed so fields scroll into view instead of being squeezed) broke width propagation down to the actual form inputs — `FormInput` had no explicit `w-full`, so it was shrinking to intrinsic content size once nested one level deeper inside the new `ScrollView` content container. Fixed by adding `w-full` directly to `FormInput`'s className, and separately adding `w-full` to `AuthScreenLayout`'s inner wrapping `View` (which used `items-center`, causing it to shrink-to-fit rather than stretch to the scroll container's width — meaning each screen's own `max-w-sm` cap was resolving against an already-shrunk parent, not the real screen width). Each auth screen's own form block still correctly caps at `max-w-sm` (384px) and centers within the now-full-width wrapper, so tablet/wide-screen layout remains correctly constrained.
- The items-list search bar's `TextInput` (`app/index.tsx`) was unrelated to this fix directly, but its `paddingVertical: 0` override (added while fixing issue #2) meant the search bar's container `py-*` became the sole source of the bar's vertical padding — worth remembering if that bar ever looks off again, the container padding is now doing all the work, not the input.

---

## Notes

- Items #3 and #5 (keyboard covering content) were in fact the same missing pattern (RN's core `KeyboardAvoidingView` fighting SDK 54+'s mandatory edge-to-edge on Android) — one shared fix (`react-native-keyboard-controller`) resolved both, plus incidentally fixed #4 (auth transition jank) as well.
- The Google Maps SHA-1 restriction fix (#3) has a known follow-up required before the actual Play Store submission — see that entry above. Worth carrying into the Play Store publish checklist once that work starts.
- Re-test on emulator after each fix where practical, but final verification should be on the real device given that's where these were caught.
