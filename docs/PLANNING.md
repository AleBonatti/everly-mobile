# Everly Mobile — Requirements & Planning

The native mobile client for Everly ("a list of things worth doing"), built with Expo/React Native against the existing Everly API. This doc is this repo's own source of truth — it supersedes `docs/MOBILE_PLANNING.md` from the `everly` monorepo, which covered the same project back when it was still planned as a monorepo sibling.

Written for someone with zero native app experience but strong TS/React/Node background — explanations lean on that existing knowledge rather than starting from scratch on JS/React concepts. Same spirit as `everly`'s own planning docs: decisions are made and justified here, with open questions called out explicitly.

---

## 0. Background: why this is a standalone repo

This project started life planned as `apps/mobile` inside the `everly` monorepo, reusing `packages/shared`'s Zod schemas via npm workspaces. That was abandoned after a day of hands-on debugging proved npm workspace dependency hoisting to be a structural blocker: `apps/web` needs `react@^19.2.7`, but Expo SDK 54/`react-native@0.81.5` needs an **exact-match** `react@19.1.0` (React Native enforces `react` and `react-native-renderer` must be byte-identical versions). Metro (Expo's bundler) didn't reliably respect npm's nested-`node_modules` boundary for that conflict, causing a hard runtime crash on some RN-internal imports.

The fix: a fully separate repo, so this project gets its own independent `node_modules` tree with zero possible interaction with `everly`'s dependency graph — not "configured to avoid conflict," genuinely only one tree exists. The accepted cost: the Zod schemas that define the API's request/response contracts can't be filesystem-shared anymore. This repo hand-maintains its own copies (small surface area, a handful of schemas — see §2), accepting manual drift risk as a bounded tradeoff rather than solving it preemptively with a published package.

**What this means going forward**: this repo has no dependency on, or build-time relationship with, `everly` at all. The only connection between the two projects is at runtime, over HTTP — this app is a client of the Everly API, nothing more. Everything below assumes that boundary.

---

## 1. Tooling: Expo (managed workflow)

**Decision: Expo managed workflow, not bare React Native.**

- **React Native** is the core framework: JS/TS code that renders to real native UI components (not a WebView) on iOS and Android from one codebase.
- **Expo** is a toolchain/library layer on top. "Bare React Native" means configuring the native iOS (Xcode/Swift) and Android (Gradle/Kotlin) projects directly. Expo abstracts that away — day-to-day work rarely touches Xcode or Android Studio.

Why Expo:
- Zero native experience is the starting point — bare RN means learning Gradle/Xcode internals on top of React Native itself. Expo removes that layer.
- **Expo Go** runs the app on a real physical phone within seconds — install the app, scan a QR code, done. Fast feedback loop.
- Modern Expo (Prebuild / continuous native generation) isn't a dead end — it's ejectable into bare native code later if a native module Expo doesn't support is ever needed. Rare in practice; camera, location, image picker, push notifications, secure storage all have official Expo libraries.
- **EAS (Expo Application Services)** handles cloud builds and store submission without owning a Mac for iOS builds.
- Industry-relevant: Expo is the de facto default for new RN projects, a legitimate current professional skill.

### Navigation

**Expo Router** (file-based routing, React Navigation under the hood) — mirrors the Next.js app-router mental model, path of least friction for a first project.

### Dependency set

- `expo` + `expo-router` (app shell, navigation)
- `nativewind` — used from the start, not added later. Real tradeoff accepted: NativeWind only reuses Tailwind's *class-name syntax* — RN's layout model is still Flexbox-only, no grid, no cascade, `View`/`Text`/`ScrollView` instead of `div`/`span`. It also adds a babel plugin + class-to-style compiler as one more moving part with its own version-compat surface against Expo SDK releases. Taken on anyway to avoid a mid-project full-restyle migration (styling touches every screen). Fallback if it becomes a recurring bug source: plain `StyleSheet.create` for new components, no forced migration of what already works.
- `@tanstack/react-query` — data-fetching/caching, same library pattern as `everly`'s web app.
- `react-hook-form` + `zod` — forms and validation; schemas are hand-copied from the API's contracts (§2), not imported.
- `expo-secure-store` — secure token storage (§3).
- `expo-image-picker` — camera/gallery access for item photos.

**Not needed for v1**: `react-native-maps` (interactive map picker) and `expo-location` (device GPS) — v1's location field is address-search-via-Nominatim only, matching the web app's desktop behavior (a plain HTTP fetch, no native map/GPS library). Add both back whenever a v1.1 interactive map picker is scoped.

### iOS and Android: parallel, not sequential

One RN codebase renders to both platforms simultaneously — there's no "iOS first" scoping decision the way there might be for two genuinely separate native codebases. What differs by platform is testing device access (Expo Go runs on both), and that iOS builds require a Mac beyond Expo Go (Apple's tooling is Mac-only; EAS Build's cloud builds sidestep this), plus differing store-account costs (Apple Developer $99/yr, Google Play Console $25 one-time). Design conventions (bottom tab bars + swipe-back on iOS vs. hardware back button + Material defaults on Android) are handled automatically by Expo/React Navigation.

Testing leans iOS-primary in practice (physical iPhones on hand, iOS 14 through latest; no physical Android device — emulator only via Android Studio). Treat pre-store-submission Android testing as a real checklist item given real-device/emulator gaps (camera, GPS, low-end performance quirks the emulator won't show).

---

## 2. What connects to the API, and what doesn't

This app is a pure HTTP client of the Everly API. Nothing is filesystem-shared with `everly` — no shared components (nothing UI-level ports; RN doesn't render HTML/CSS or run in a DOM), no React Router, no shared build tooling (Metro here, Vite there).

### API contracts (hand-copy, don't import)

The request/response shapes below are read directly from the API's current implementation (`packages/shared/src/{auth,items,categories}.ts` in the `everly` repo) as of 2026-08-17 — copy these into this repo's own types (e.g. `src/lib/api/schemas.ts`), don't reference `@everly/shared`.

**Auth** (`POST /auth/*`):
```ts
registerInput = { name: string (min 1), email: string, password: string (min 8) }
loginInput    = { email: string, password: string }
authUserWithToken = { id: uuid, name: string, email: string, token?: string }
```
`token` is only populated when the request signals a mobile client (§3) — otherwise identical to the web-facing `authUser` shape.

**Items** (`/items`, all under `Authorization: Bearer <token>`):
```ts
createItemInput = {
  categoryId: uuid,
  title: string (min 1),
  description?: string,
  notes?: string,
  imageUrl?: string,
  latitude?: number, longitude?: number, locationLabel?: string,
  importance?: number (1-5),
}
updateItemInput = Partial<createItemInput> & { isArchived?: boolean }
item = {
  id: uuid, categoryId: uuid, title: string,
  description: string | null, notes: string | null, imageUrl: string | null,
  latitude: number | null, longitude: number | null, locationLabel: string | null,
  importance: number, isArchived: boolean, createdAt: string, updatedAt: string,
}
itemsQuery = { category?: string[], q?: string, archived?: boolean (default false), sort?: 'newest'|'importance', page?: number, pageSize?: number }
paginatedItems = { items: Item[], total: number, page: number, pageSize: number }
```
Note: items reference a category by **`categoryId` (uuid)**, not a client-side key/slug — the mockups' category "chips" resolve to real category IDs fetched from `GET /categories`.

**Categories** (`/categories`):
```ts
createCategoryInput = { name: string (min 1), color: enum of 8 fixed hex values }
category = { id: uuid, name: string, color: string, isDefault: boolean }
```
Color is a fixed palette of 8 (`#ef4444` red, `#f97316` orange, `#f59e0b` amber, `#22c55e` green, `#14b8a6` teal, `#3b82f6` blue, `#a855f7` purple, `#ec4899` pink) — not a free hue picker. Mobile v1 only *selects* an existing category (no create/edit here), so this schema mainly matters for rendering the category chips/swatches correctly.

### Base URL and routes actually used by v1

All routes are prefixed on the API side: `/auth`, `/categories`, `/items`. Mobile v1 needs:
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` (with `X-Client: mobile` header on register/login, per §3)
- `GET /categories` (populate the select-only chip list)
- `GET /items` (list, with `category`/`archived`/`sort`/`page`/`pageSize` query params)
- `POST /items` (create)
- `PATCH /items/:id` (mark done/restore via `isArchived`, and later full edit)
- `DELETE /items/:id`
- `POST /items/:id/image` (photo upload)

The API's base URL (Render-hosted, same as the web app hits) should live in an env-driven config (e.g. `EXPO_PUBLIC_API_URL`), not hardcoded — the same backend serves both dev/staging/prod for web already, mirror that pattern here.

---

## 3. Auth: bearer token, not cookies

React Native's `fetch` has no cookie jar — there's no automatic `Set-Cookie` persistence/reattachment the way a browser does. The API supports a dual mechanism already, **implemented and live** on the API side (verified in `apps/api/src/routes/auth.ts` and `apps/api/src/plugins/authenticate.ts`, `everly` repo):

- `POST /auth/login` and `POST /auth/register` set the existing httpOnly cookie (web's mechanism, untouched) **and** additionally return `{ ..., token }` in the JSON body, but **only when the request sends `X-Client: mobile`** as a header. A plain web login response never contains a token field — the cookie stays the only thing web ever receives, preserving its httpOnly XSS protection.
- The server's `authenticate` decorator tries `request.jwtVerify()` first (which checks the `Authorization: Bearer` header), then falls back to `jwtVerify({ onlyCookie: true })` — one middleware serves both clients, no duplicated auth logic.

**What this repo needs to do:**
1. Send `X-Client: mobile` on every `/auth/login` and `/auth/register` call.
2. Store the returned `token` in **`expo-secure-store`** (wraps iOS Keychain / Android Keystore) — never `AsyncStorage`, which is unencrypted.
3. Attach `Authorization: Bearer <token>` manually on every subsequent API request (no automatic cookie jar to rely on).
4. On a `401` response, treat it as an expired/invalid session: clear the stored token and route to the login screen, rather than showing a generic error.

**Decided for v1: no refresh-token flow.** Forced re-login on expiry is accepted; a real refresh-token flow (short-lived access + longer-lived refresh, silently re-issued) is a deliberate v1.1+ deferral, not an oversight — revisit only once forced-re-login friction is actually felt in practice.

**Logout**: delete the token from `expo-secure-store` client-side. `POST /auth/logout` exists server-side (clears the cookie, for web) but isn't strictly required for mobile logout to work correctly — still fine to call it for consistency.

**CORS**: not a mobile concern — mobile requests don't send a browser `Origin` header, so `CORS_ORIGIN`/`credentials` config on the API only continues to matter for the web client.

---

## 4. Development, debugging, testing

### Local loop

1. `npx expo start` runs Metro and prints a QR code.
2. Scan with the **Expo Go** app on a physical phone (same WiFi) — loads over-the-air, no cable, no build.
3. **Fast Refresh** applies most JS edits live without losing component state.
4. Simulators/emulators (Xcode iOS Simulator; Android Studio emulator) are the alternative to a physical device.

### Debugging

- **React Native DevTools** (bundled with recent Expo/RN) — Chrome/React-DevTools-style component inspection, console, network — launched from the terminal running `expo start`.
- Red full-screen error overlay with stack trace on uncaught JS errors during dev.
- `console.log` streams to the terminal running `expo start`.

### Testing

- **Unit/component**: `jest` + `@testing-library/react-native`.
- **E2E**: `Maestro` (recommended over the older, native-build-dependent Detox) — YAML test flows, no native build step required against Expo Go.
- **Manual QA before any release build**: one recent iOS device, one recent Android device, one older/smaller-screen Android device if available.

### CI

Own, independent GitHub Actions workflow in this repo (lint/typecheck/test on PRs) — no relationship to `everly`'s CI. **EAS Build** can also run from a workflow step to produce installable builds automatically, the mobile equivalent of a Vercel preview-per-PR — a stretch goal once the core app works, not day one.

---

## 5. Hosting and distribution

No new backend infrastructure — this app is just another HTTP client hitting the existing Render-hosted API, same Postgres (via the API only, never direct), same Supabase Storage for images (invisible to the client either way).

What's actually new is **app distribution**, which has no web equivalent to reuse:

- **EAS Build**: compiles to an installable `.ipa`/`.apk`/`.aab` without local Xcode/Android Studio. Free tier with usage limits.
- **EAS Submit**: automates pushing to the Apple App Store / Google Play Console.
- **EAS Update** (OTA): pushes JS-only changes directly to installed apps without a store review cycle — narrower than a full redeploy (native dependency changes still need a full store submission).
- **Store accounts**: Apple Developer Program ($99/yr), Google Play Console ($25 one-time) — needed only when ready to publish; TestFlight and Play Internal Testing both allow limited-audience sharing before that.

**Store publication is a real v1 goal**, targeted for right after the MVP is built and tested:
- Enroll in both store programs once the MVP feature set is roughly mid-build and clearly heading toward done — not day one, not at the finish line (Apple's review/enrollment can take days and shouldn't gate the release).
- Store-readiness is part of the MVP checklist: app icon, splash screen, real screenshots, a short store listing description, a privacy-policy URL (a static page, hostable on the existing Vercel web app), and accurate iOS permission-usage strings (human-readable reason shown in the permission prompt itself, e.g. "Everly uses your camera to add photos to your items").
- Development still goes through Expo Go / EAS Build's free internal-distribution builds first — store submission is the *last* step, not the development method throughout.

### Render cold starts and hosting cost — decided 2026-08-19

Render's free tier sleeps the API after inactivity (~15 min) and takes 30-60+ seconds to cold-start on the next request — not acceptable for real users hitting the app for the first time, and this affects the web app too, not just mobile (it's a pre-existing production-readiness gap this decision just surfaced). **Decided: upgrade to Render's paid Starter tier (~$7/mo) before public store submission**, to keep the API warm. Total real cost to actually publish: ~$7/mo (Render) + $99/yr (Apple Developer) + $25 one-time (Google Play Console).

**AWS migration considered and explicitly deferred** — moving just the API off Render onto AWS (App Runner, ECS Fargate, or EC2; DB/storage staying on Supabase, web frontend staying on Vercel) was discussed as a way to learn AWS as a CV skill. Real options and rough cost, for when this is revisited: **App Runner** (closest Render-equivalent, similar or slightly cheaper at this scale, least new AWS surface area to learn), **ECS Fargate** (a real step into "real AWS infra" — task definitions, cluster, ALB — but the ALB alone costs ~$16-18/mo regardless of traffic, often pricier than Render at this project's scale), **EC2** (cheapest in raw dollars, ~$5-8/mo or free-tier eligible, but you own OS patching/process supervision/TLS yourself). **Decided: finish the MVP through store submission on Render first, treat AWS migration as its own separate follow-up project afterward** — it's a genuine new skill area (IAM, networking basics), not a quick swap, and mixing it into the MVP finish line risks the same kind of multi-day detour the SDK/dev-client switch already was.

---

## 6. The MVP: what's in v1

Cut against two questions: does this prove a genuinely *new* piece of the RN/Expo learning surface, and is it required for a real, store-submittable app — not "nice to have."

**In scope:**
- **Auth**: login + register + logout only. No forgot-password, no email verification, no in-app settings/profile editing (those exist on web already, shared accounts).
- **Items — read**: list view, list-mode only (no grid), category-chip filter row, no free-text search.
- **Items — create**: title, description, category (select from existing, via chips), importance (1–5 dot selector, maps to `importance`), photo via `expo-image-picker` (camera or gallery) — the single most mobile-native feature in v1.
- **Items — update**: mark done / restore (`isArchived` toggle) from the list, **plus a full edit screen** (tap an item to open it pre-filled, same fields as create, Save updates the item) — added to MVP scope 2026-08-19, expanding beyond the original archive-toggle-only plan.
- **Items — delete**: confirm-dialog pattern, same as web. Lives on the item-edit screen (matches the mockup's original design), not as a separate list-view gesture.
- **Location**: address-search text field that geocodes via Nominatim (same free service the web app already uses) — matches desktop's actual behavior, not a GPS "use my location" button and not an interactive map.
- **Notes**: skipped for v1 — a secondary field even on web, not worth mobile screen real estate this early (though the API schema already supports it).

**Out of scope for v1** (candidates for v1.1 once the MVP is store-published and validated): free-text search, interactive map/location picker (`react-native-maps`), grid view + sort menu, archived-items filter switch, categories management screen (mobile v1 only *selects* an existing category — no add/edit/delete), in-app settings/password-change, forgot-password, email verification, push notifications, offline support, deep linking, refresh-token auth.

This keeps the novel-surface list focused: Expo Router navigation, bearer-token auth + secure storage, TanStack Query against the real API, and one real native-only capability (camera).

---

## 7. Screens, from the mockups

Design source of truth: `Everly Mobile Auth.dc.html` and `Everly Mobile.dc.html` in `../Everly bucket list app/` (one level above this repo, same location referenced by `everly`'s own design docs) — both are iPhone-frame, mobile-native layouts, not resized desktop.

**Logo assets, wired in 2026-08-20/21**: `everly-logo-dark.png` (486×189, wordmark) from `../Everly bucket list app/`, copied to `assets/everly-logo.png`, shown centered above the title on both auth screens (login, register). A second, more compact lockup, `Everly Logo-dark.png` (324×94) from `../logos/`, copied to `assets/everly-logo-header.png`, replaces the plain "Everly" text + tagline in the items list's header, centered in the top bar (only the dark variant is used anywhere — the app is dark-theme-only, no light-mode UI exists to pair with the light logo variants that also exist in both source folders).

The mockups define the **full eventual app**, broader than v1 — this section maps what to actually build now vs. defer, plus the concrete visual language to carry over (RN needs it translated to `StyleSheet`/NativeWind, not CSS, but the values themselves are directly reusable).

### Visual language

- **Fonts**: `Chango` (display/logo wordmark, e.g. "Everly" in the header) + `Urbanist` (body/UI text, weights 400–800). Both loadable via `expo-font` + Google Fonts.
- **Color system**: OKLCH throughout the mockups (e.g. background `oklch(0.15 0.01 60)`, primary accent `oklch(0.78 0.14 85)` — a warm amber/gold, text `oklch(0.92 0.01 60)`). React Native's `StyleSheet`/NativeWind don't support `oklch()` directly — convert the palette to hex/rgba equivalents once, up front, rather than per-component. **Confirmed background hex, 2026-08-20**: `#0e0a07`, sampled directly from the real app icon artwork (`Everly Logo-dark-bg.png`) — this is the canonical value to use everywhere `oklch(0.15 0.01 60)` appears in the mockups, once real theming/CSS work happens post-MVP (current screens approximate it with Tailwind's `neutral-950`, not this exact value yet — worth reconciling in a later polish pass).
- **Dark theme only** in the mockups — no light-mode toggle shown; treat dark as the only mode for v1 unless that's revisited.
- Category tag/chip colors are hue-based accents (the API's fixed 8-color palette, §2) with a translucent background + solid text, not filled blocks.
- Rounded corners throughout (~8–12px on inputs/buttons/cards), no hard edges.

### Auth screens (`Everly Mobile Auth.dc.html`) — build for v1

- **Login**: email + password fields, "Forgot password?" link (present visually but **must not be wired to a real target** — forgot/reset is out of MVP scope), primary "Log in" button, "Sign up" link to register.
- **Register**: name + email + password + confirm-password fields, client-side validation (min 8 char password, confirm match) mirrored from the mockup's inline logic, primary "Create account" button.
- **Not built in v1** (exist in the mockup's state machine, don't wire up): forgot-password, reset-link-sent confirmation, set-new-password, password-updated confirmation — four additional views, no navigation target should reach them yet.

### Items list screen — build for v1

- Header: logo/wordmark + tagline, avatar circle (initials) with a dropdown menu (Categories link, Log out) — **the "Categories" menu item should be omitted or disabled for v1** since the categories management screen itself isn't built.
- Search bar is present in the mockup header — **not built for v1** (§6).
- Category filter: mockup uses a filter-modal bottom sheet with multi-select + "show archived" switch — **v1 simplifies this to a plain category-chip row** (select one category or "all", no modal, no archived toggle, no multi-select).
- Item cards (list mode only — grid mode and the list/grid toggle are **not built for v1**): thumbnail image (or category-colored placeholder if no photo), category tag overlay, title, truncated description, importance dots (1–5, filled vs. unfilled), and a "Mark done"/"Restore" inline action.
- Floating "+" button (bottom-right) opens item create.
- Bottom toolbar icons for filter/sort/grid-toggle in the mockup — **v1 only needs the category-chip filter and the "+" button**; sort menu and grid toggle are deferred.
- Empty state: icon + "Your list is empty" / "No matches" messaging depending on whether filters are active — worth carrying over as-is, it's cheap and matches the product's voice.

### Item create/edit screen — build for v1

- Header: "Cancel" / screen title ("Add item" or "Edit item") / "Save".
- Photo picker area (mockup shows a placeholder "TAP TO ADD PHOTO" box) — wire to `expo-image-picker`, offering camera or gallery.
- Title (required), Description (multiline) fields.
- Category: chip row, single-select, populated from `GET /categories` — **no add/edit/delete category from this screen or anywhere in mobile v1**.
- Importance: 1–5 dot selector, tap to set.
- Location: address-search text field — **the mockup's interactive tap-to-drop-pin map is not built for v1**; the text field alone geocodes via Nominatim on submit, no map rendered at all.
- "Delete item" text action at the bottom, shown only when editing an existing item (not when creating) — confirm-dialog before actually deleting.

### Not built at all in v1

Categories screen (list/add/edit/delete categories) and Category edit screen — both fully present in the mockup, entirely deferred; mobile v1 only ever *selects* a category that already exists, created via the web app.

---

## 8. Feature-parity notes (web → mobile translation)

Flagging where a web concept doesn't port 1:1, so scoping doesn't assume a straight copy:

- **Maps**: the interactive drag-to-place map (`react-native-maps`) is deferred past v1 — only relevant once that picker is actually built.
- **Image upload**: `expo-image-picker` replaces the web `<input type="file">`/drag-drop, with a native camera-or-gallery choice — arguably a better UX than web here, worth leaning into.
- **Location**: matches desktop's Nominatim address-search, not the browser Geolocation API and not device GPS — a plain HTTP fetch, works unchanged from RN, no extra library.
- **Forms**: `react-hook-form` + `zod` work in RN, but inputs differ — no native `<input>`/`<select>`; RN's `TextInput` and community picker components stand in.
- **Routing/deep links**: out of scope for v1 — the password-reset flow isn't in the mobile MVP at all.
- **Auth**: see §3 — the biggest non-cosmetic web→mobile difference.

---

## 9. Suggested build order

1. **Expo scaffold** — Router + NativeWind installed and configured, hand-copied API types (§2) in place, confirm boot in Expo Go on a physical iPhone with Fast Refresh working.
2. **Auth screens** — login/register/logout against the real API, `X-Client: mobile` header wired, token in `expo-secure-store`, confirm a session persists across app restarts, confirm an expired/invalid token correctly redirects to login rather than erroring silently.
3. **Items list (read-only)** — logged-in user's items with category-chip filter (no search). First real data screen, proves TanStack Query + hand-copied schemas work end-to-end against the real API.
4. **Item create** — title, description, category, importance dots, photo via `expo-image-picker`, address-search location via Nominatim. The MVP's core "why build this on mobile" feature.
5. **Item update/delete** — mark done/restore toggle from the list; full edit screen (tap an item, pre-filled form, Save updates) with delete-with-confirm living on that screen. Implemented as one shared dynamic route, `app/item/[id].tsx` (`id === "new"` for create, a real UUID for edit), rather than separate create/edit files.
6. **iPhone manual QA pass** — real device pass across all iOS versions available, before moving to Android, while the feature set is still small.
7. **Android emulator pass** — same feature set; flag anything needing real-device verification later. **Deferred 2026-08-19**, out of build order — skipped ahead to step 9 (CI), revisit before store submission.
8. **Testing pass** — component tests + a smoke-level Maestro e2e flow (login → add item with photo → see it in list → mark done). **Deferred 2026-08-19** — user's explicit call: the API already has test coverage, mobile is a thin client on top of it, and other work is a higher priority right now. Revisit before store submission; no test infrastructure (Jest, Maestro) is set up yet in this repo.
9. **CI** — GitHub Actions workflow: lint/typecheck (test omitted, since automated tests are deferred per step 8's note above). **Done, 2026-08-19.** `.github/workflows/ci.yml`, triggers on PRs to `main` and pushes to `main`, runs `npm run lint` (`expo lint`, using `eslint-config-expo`'s flat config, added this session — first ESLint setup in this repo) and `npm run typecheck` (`tsc --noEmit`) on Node 20. Add a test step once step 8 (deferred testing pass) is picked back up.
10. **Store readiness + account enrollment** — **paused 2026-08-21, blocked on Apple.** Done so far: app icon, splash screen, bundle identifier (`com.alebonatti.everly`), app name, logo branding on auth screens + items header, store listing copy drafted (`../privacy/store-listing.md`), privacy policy content drafted (`../privacy/PrivacyPolicyPage.tsx` — **not yet wired into `everly`'s `App.tsx` or deployed**), screenshots captured. **Blocked**: Apple Developer Program enrollment is stuck pending a response from Apple customer care — cause unclear, not something resolvable from this repo. Google Play Console enrollment ($25 one-time) has not been started — user's explicit call to bundle it with the other paid steps (Apple + Render) rather than do it alone first, since it's considered lower priority than Apple. Render's paid tier upgrade (§5, needed to fix cold starts before real users) also not yet done, same reasoning.
11. **Internal distribution build** — **attempted, iOS blocked by the same Apple issue.** `eas build --platform ios --profile preview` fails with `Authentication with Apple Developer Portal failed! You have no team associated with your Apple account` — **correction to this doc's own earlier assumption**: EAS Build's cloud credential generation always goes through Apple's real Developer Portal API, even for `internal` distribution, which requires active Developer Program enrollment. This is different from local `expo run:ios --device` builds (used throughout steps 1–7), which sign via Xcode's separate, more lenient local "Personal Team" free-signing path that never touches the Developer Portal — that distinction wasn't understood until hitting this error. Android EAS Build has no equivalent blocker but was also paused (user's call, alongside the Google Play deferral above) rather than run alone. `eas.json` is already generated and committed (`cli`, `build.development/preview/production`, `submit.production` profiles) — resume with `eas build --platform ios --profile preview` once Apple enrollment clears, or `--platform android` in the meantime if that's picked back up first.
12. **Store submission** — EAS Submit to TestFlight/App Store and Play Console, once steps 10–11 are both done.
13. **(Post-MVP, v1.1+)** — **in progress ahead of steps 10–12, by explicit user decision 2026-08-21** ("move over the mvp and start completing the app" while Apple is blocked) — see the running feature list below as it grows, rather than the original placeholder list. Original placeholder scope: interactive map/location picker, search, categories management screen, in-app settings, forgot-password + email verification, refresh-token auth, push notifications, offline support, deep linking.

---

## 10. Known minor issues (deferred, not blocking)

Small bugs found during QA that aren't worth stopping progress for, tracked here so they aren't forgotten:

- **Pull-to-refresh on the items list appears to update before the pull gesture is released**, not just on release as `RefreshControl` should normally behave. Confirmed not a NativeWind/styling issue (reproduced identically with a plain `contentContainerStyle` instead of `contentContainerClassName`). Not yet root-caused — possibly a Simulator-specific trackpad-gesture quirk rather than a real device issue, or a genuine `RefreshControl` timing bug; needs isolated investigation (confirm on physical device specifically, check whether it's the spinner animating early — expected — vs. the actual data refetch firing early — not expected) before attempting a fix.
- **General text/content sizing across the app reads too small** — fonts, labels, form fields, spacing. Flagged during the 2026-08-19 iPhone QA pass, deliberately deferred to a dedicated UI/polish pass rather than fixed piecemeal.
