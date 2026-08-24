# Everly Mobile — Post-MVP Roadmap

Companion to `docs/PLANNING.md`, which scopes and documents v1 (the MVP) only. This doc picks up where that one stops — everything here is deliberately **out of MVP scope**, tracked separately so `PLANNING.md` doesn't grow past its original purpose.

Written 2026-08-21, grounded in an actual audit of the mockups (`Everly Mobile Auth.dc.html`, `Everly Mobile.dc.html`) against what's built, plus a check of which API endpoints already exist server-side but have no mobile caller yet — not a guessed feature list. Same spirit as `PLANNING.md`: concrete, scoped, with the reasoning kept alongside the decision.

---

## 0. Why this doc exists, and how it relates to `PLANNING.md`

`docs/PLANNING.md` §6/§7 define the MVP precisely, and explicitly list what's deferred — but a placeholder one-line list at the bottom of that doc isn't the same as a real plan. This doc gives the deferred work the same treatment the MVP got: concrete scope, source-grounded (mockup + API audit), sequenced.

**Nothing here is committed to a release order yet** — §2 groups the work; picking what to build first is a live decision, not fixed by this doc alone.

### Follow the mockup layout, not just its feature list

`docs/PLANNING.md` §7 was careful to treat `../Everly bucket list app/Everly Mobile Auth.dc.html` and `Everly Mobile.dc.html` as the **design source of truth** for the MVP screens — same rule applies here. §1 below documents *what's missing feature-wise*; when actually building any of it, go back to those two files (not this doc's prose descriptions) for the real layout: spacing, component structure, exact copy, button placement, and the specific interaction details (e.g. the filter modal's bottom-sheet slide-up behavior, the category-edit screen's swatch-picker grid, the exact four-state auth flow's screen order). This doc's bullet points are a map of *what exists*, not a substitute for opening the actual mockup file before writing a screen.

Two things worth carrying over explicitly, since they're easy to lose sight of once away from `PLANNING.md` §7's own reminder:
- **Visual language stays identical** — same dark-only theme, same `Chango`/`Urbanist` fonts, same OKLCH-derived palette (background `#0e0a07`, confirmed exact hex in `PLANNING.md` §7; accent `oklch(0.78 0.14 85)`, still only approximated with Tailwind's `neutral`/`amber` classes as of the MVP — worth reconciling to the real hex values as part of *any* new screen built from here on, not deferred forever).
- **The mockups define the full eventual app**, so a screen's mockup markup may include mockup-only elements that don't apply once real API data is wired in (placeholder counts, prototype-only "continue" shortcuts like the reset-password flow's dev shortcut link) — cross-check against the real API contracts in `PLANNING.md` §2 the same way the MVP build did, not just copy the mockup's mock state verbatim.

---

## 1. What's actually missing (source-grounded audit, 2026-08-21)

### 1a. Screens present in the mockups, not built in mobile

**Auth flows** (`Everly Mobile Auth.dc.html`'s state machine — `login`/`register` are built, these four are not):
- **Forgot password** — email field, "Send reset link."
- **Reset-link-sent confirmation** — checkmark, "Check your inbox," shows the submitted email.
- **Set new password** — new-password + confirm fields, min-8-char/match validation.
- **Password-updated confirmation** — checkmark, "Go to log in."

**Categories management** (`Everly Mobile.dc.html`, `screen: 'categories'` / `'categoryEdit'` — no mobile equivalent exists at all):
- **Categories list** — swatch, name, item count per category, tap to edit, "+" to add.
- **Category add/edit** — name field, 8-color swatch picker (the API's fixed palette), live preview chip, delete (blocked server-side with 409 if the category still has items).

**Items list, richer interactions** (mockup's `items` screen has more than v1's simplified version):
- **Free-text search** — a search bar in the header, filters by title/description.
- **Filter bottom-sheet modal** — multi-select categories (v1 only allows single-select via chips) + a "Show archived (N)" toggle.
- **Grid display mode** + the list/grid toggle — mockup actually defaults to grid; mobile only has list.
- **Sort menu** — "Newest first" / "Most important."
- **Browsing archived items as a filtered view** — v1 only has per-item mark-done/restore; there's no way to see what's already archived.
- **Avatar-menu "Categories" link** — was deliberately omitted in v1 per `PLANNING.md` §7, since the screen it points to didn't exist; relevant again once categories management is built.

**Item location** — the mockup's tap-to-drop-pin interactive map (`mapRef`, pin marker) on the item edit screen. v1 only has the Nominatim address-search text field, no map view. `PLANNING.md` §1 explicitly excludes `react-native-maps`/`expo-location` from the MVP's dependency set — bringing this in means revisiting that.

### 1b. API endpoints that exist, with no mobile caller yet

Confirmed by reading every mobile `src/lib/api/*.ts` file against the full `everly` API route set:

| Endpoint | Status | Feature it unlocks |
|---|---|---|
| `POST /auth/logout` | Not called (mobile logout only clears the local token) | Cosmetic gap — harmless, but worth calling for consistency with web |
| `POST /auth/forgot-password` | **Called** (Group A, done 2026-08-21) | Forgot-password flow |
| `POST /auth/reset-password` | Called from `everly` web (unchanged) — not mobile | Reset-password flow — mobile never calls this directly, see Group A's note on why |
| `POST /auth/verify-email` | Not called | Email verification (not even represented in the mobile mockup — see §2) |
| `POST /auth/resend-verification` | Not called | Same as above |
| `PATCH /auth/me` | **Called** (Group C, done 2026-08-21) | Profile editing (name) |
| `POST /auth/change-password` | **Called** (Group C, done 2026-08-21) | Change-password, in-app settings |
| `POST /categories` | **Called** (Group B, done 2026-08-21) | Add category |
| `PATCH /categories/:id` | **Called** (Group B, done 2026-08-21) | Edit category |
| `DELETE /categories/:id` | **Called** (Group B, done 2026-08-21) | Delete category |

Every items endpoint (`GET/POST/PATCH/DELETE /items`, `POST /items/:id/image`) is already fully used — items has no server-side gap, only the richer-interaction UI gaps in §1a above.

---

## 2. Feature groups (not yet sequenced into a release order)

### A. Auth completeness — forgot/reset password — **done, 2026-08-21**
Screens: 4 new views under `app/(auth)/`. API: 2 unused endpoints, already exist. Self-contained, no dependency on any other group. Mirrors the auth-screen pattern already established (login/register) closely enough that it's a natural next step technically, even though it's not high-visibility.

**Built as**: `app/(auth)/forgot-password.tsx` (one screen, not two — combines the "request" and "check your inbox" mockup states as one component's internal `isSent` boolean, matching the mockup's own state-machine treatment of them as a toggle rather than separate navigable routes), a "Forgot password?" link added to `login.tsx`, and `src/lib/api/auth.ts` (new file, `forgotPassword()`) + a `forgotPasswordInputSchema` addition to `schemas.ts`. Screens 3+4 (set-new-password, password-updated) were **not** built natively in mobile — same reasoning as Group F: the emailed reset link opens the phone's browser, not the native app (no Universal Links infrastructure), so those two screens are handled by `everly` web's existing `ResetPasswordPage.tsx` instead, which already worked correctly and needed only a small UX fix (see below).

**Real bugs found and fixed along the way**:
- `withMinDelay` (new file, `src/lib/withMinDelay.ts`) — added to prevent instant-response times leaking whether the security-preserving "always show success" forgot-password message (server never reveals if an email exists — same enumeration-prevention pattern as web) is exploitable via response-timing side-channel, and generally to avoid jarring instant UI flips. First version used `Promise.all`, which fails fast on rejection — meaning the delay only applied on *success*, not on error paths (found via manual testing with a wrong password). Fixed with `Promise.allSettled` + manual re-throw of the original rejection reason.
- Even after that fix, **login/register still showed no visible delay on success specifically** — root cause was a different, deeper issue: `AuthContext.tsx`'s `login()`/`register()` call `setUser(...)` *inside* the function, before the promise resolves back to the screen's `onSubmit` — and `setUser` immediately triggers `RootNavigation`'s redirect-away-from-login effect in `app/_layout.tsx`. Wrapping `withMinDelay` at the screen's call site couldn't fix this, since the navigation-triggering side effect had already fired inside `login()` before the wrapper ever got a chance to delay anything. Real fix: moved `withMinDelay` *inside* `AuthContext.tsx`, wrapping the raw `apiFetch` call itself, so `setUser` (and the navigation it triggers) only fires after the minimum delay has elapsed — not wrapped redundantly at both layers. `item/[id].tsx`'s Save/Delete also needed the same pattern (wrap the whole async operation, not the individual API calls) — done via an inline immediately-invoked async function passed to `withMinDelay`.
- `everly` web's `ResetPasswordPage.tsx` previously auto-navigated to `/login` via a "Go to log in" button on success — **not actually an auto-login** (confirmed no session cookie is set server-side by `/reset-password`), but still wrong UX for a mobile user who opened the link in their phone's browser: there's no reason to push them toward the *web* login, since the real next step is switching back to the native app themselves. Fixed to just show a final confirmation message, no button/navigation. **Same fix planned for `VerifyEmailPage.tsx`'s success state when Group F is built** — see that section.

### B. Categories management — **done, 2026-08-21**
Screens: 2 new (list, add/edit) — likely `app/category/index.tsx` + `app/category/[id].tsx`, mirroring the existing `app/item/[id].tsx` create/edit pattern. API: 3 unused endpoints, already exist. Also needs the avatar-menu "Categories" entry point wired back in (currently omitted, per `PLANNING.md` §7). This is the one group that changes an existing screen's behavior too — once mobile can create categories, `app/item/[id].tsx`'s category picker stops being purely "select from what web created."

**Built as**: `app/category/index.tsx` (list, no per-category item count — deliberately skipped, the API doesn't return one and it wasn't worth an extra full-items fetch just to show a number) and `app/category/[id].tsx` (add/edit, following the exact same `id === "new"` vs. real-UUID / cached-data-lookup pattern as `item/[id].tsx`, including `react-hook-form`'s `watch()` for a live color+name preview chip, and `withMinDelay` on both save and delete). `src/lib/api/categories.ts` gained `createCategory`/`updateCategory`/`deleteCategory`; `schemas.ts` gained the matching input schemas. The API's 409 "category still has items" delete-conflict response is handled explicitly via `ApiError`'s status field, showing a specific "move or delete those items first" message rather than a generic failure.

**Also built, since it was the actual blocker to reaching these screens**: the items list header's bare "Log out" button was replaced with a proper avatar (user's initials, derived client-side from `user.name`) + dropdown menu (Categories, Log out) — matching the mockup's original design that was simplified away back in step 4 of the MVP build, before Categories existed to link to. Implemented with RN's `Modal` (`transparent`, backdrop-tap-to-close) as the idiomatic equivalent of the mockup's DOM-`ref`-based click-outside-to-close pattern, which RN has no direct equivalent for.

### C. In-app settings — profile + password — **done, 2026-08-21**
Screens: 1 new (`app/settings.tsx` or similar). API: 2 unused endpoints, already exist. Self-contained. Lowest priority of the account-related groups — web already covers this, so the value is parity/convenience, not unlocking anything mobile-only.

**Built as**: `app/settings.tsx`, reachable from the avatar dropdown (now Categories / Settings / Log out). No mockup existed for this screen at all (confirmed via the same source scan used for the original audit — same situation as Group F's email verification), so the layout was designed fresh, matching existing conventions (`item/[id].tsx`'s form-field styling, `KeyboardAvoidingView`+dismiss pattern) rather than a mockup. Two independent sub-forms on one screen: name (email shown read-only, not editable per the API schema) and change-password (current + new + confirm, with the 400 "current password incorrect" response handled as a specific message via `ApiError.status`, not a generic failure). `AuthContext.tsx` gained `updateUserName()`, mirroring the existing `login`/`register` pattern of updating `user` state after a successful call — needed so the avatar's initials (derived from `user.name`) update live without a full session reload.

### D. Items list — richer browsing — **done, 2026-08-21**
Search, filter modal (multi-select + archived toggle), grid/list toggle, sort menu. All client-side UI work against the *existing* `GET /items` endpoint, which already supports `q`, `category[]`, `archived`, `sort` (confirmed in `itemsQuerySchema` — the API was already built for this, mobile just doesn't expose it yet). No new backend work. Highest-value, lowest-new-surface-area group — every other group needs at least one new screen; this one is entirely inside `app/index.tsx`.

**Built as**: search input added to the header (`itemsQuery`'s key/params now include `q`), the old single-select category-chip row replaced with a bottom-sheet `Modal` filter panel (multi-select categories via a checkbox-style toggle list + a "Show archived" on/off control — simplified from the mockup's animated sliding-knob switch, a deliberate scope cut, real switch styling left for Group H), a sort menu (Newest/Most important, `Modal`-free small popover positioned above its trigger), and grid/list view toggle with two separate card components (`ItemListCard`, `ItemGridCard`) — **defaults to grid**, matching the mockup's actual default (confirmed by re-reading the mockup source, not assumed). The floating "+" button moved into a proper bottom toolbar alongside Filters/Sort/Grid-toggle, matching the mockup's layout instead of floating alone.

**Real RN constraint hit**: `FlatList` doesn't support changing `numColumns` on an already-mounted list — throws if you flip between 1 and 2 columns live. Fixed with `key={displayMode}` on the `FlatList`, forcing a full remount whenever list/grid mode changes — the standard, correct workaround for this specific limitation, not a hack.

Icons throughout use plain Unicode characters (not SVGs matching the mockup) — a deliberate placeholder, revisit as part of Group H if they read as too plain once the real color system is in place.

### E. Interactive map / location picker
The one group requiring a **new native dependency** (`react-native-maps`, possibly `expo-location`) — a real, deliberate re-scoping of `PLANNING.md` §1's dependency set, not just new screens. **Decided 2026-08-21: deferred to its own dedicated planning pass** when picked up (a mini version of this same audit-then-plan exercise), not folded silently into a "add a map" checklist item — don't start building this from this doc's bullet alone.

### F. Auth polish — email verification — **decided 2026-08-21: required, not optional**
Present in the API (`verify-email`, `resend-verification`), **absent from the mobile mockup entirely** — meaning it was never actually designed for mobile in the mockups, unlike A–E. `PLANNING.md` §3 deliberately skipped email verification for mobile *logins* for the MVP (mobile users could log in unverified) — that MVP-era gate stays, but the user has confirmed verification itself is a real requirement for mobile going forward, just not yet built (currently the flow is effectively disabled for mobile since nothing ever prompts for it or handles the result).

**Chosen approach: web-based, mobile-aware landing page** — evaluated against two alternatives (Universal Links/deep linking directly into the native app, and in-app numeric-code entry) and deliberately rejected both for now:
- **Universal Links** would be the more "correct," polished pattern (the verification link opens the native app directly) but requires owning a real domain (not just Vercel's default `*.vercel.app`), hosting `apple-app-site-association` + Android `assetlinks.json` files, and real dual-platform deep-link testing — genuinely its own multi-session infrastructure project, not a fit for this feature group's scope.
- **In-app code entry** (email contains a short numeric code instead of a link, typed into a mobile screen) would need a real API change — a new short-code generation path separate from the existing long-token-in-URL flow — more backend work than the chosen option for no clear benefit at this stage.
- **Chosen instead**: reuse the *existing* email/token/API mechanism entirely unchanged (`apps/api`'s `verify-email` route, the `${APP_URL}/verify-email?token=...` link it already sends) — the tapped link opens in the phone's browser (not the native app), landing on `everly` web's existing `VerifyEmailPage.tsx`, which needs only a small UI tweak: detect it was likely opened from a mobile context and show "You're verified — you can close this and return to the Everly app" instead of (or alongside) its current desktop-oriented confirmation.
- **What mobile still needs to build**: a "check your email" screen shown right after register (before this, registering already logs the user in per §3's mobile-skips-verification-gate decision — this screen is purely informational/a nudge, not a login blocker), and a way for the app to know verification succeeded once the user comes back — simplest option is polling/refetching `GET /auth/me` (which already returns `emailVerified` — confirm this field exists on the response before building) on app foreground/resume, or a manual "I've verified, refresh" button; no push-notification or real-time mechanism needed for v1 of this feature.
- **`VerifyEmailPage.tsx`'s success state — decided 2026-08-21, while fixing the equivalent reset-password page (Group A)**: no "go to login"/navigation button, no auto-redirect to the web dashboard — just a clean, final confirmation message (e.g. "Your email has been verified"). Matches the same fix already applied to `ResetPasswordPage.tsx`'s success state for the same reason: a mobile user landing on this page in their phone's browser has no reason to be pushed toward the *web* login/dashboard — the real next step is switching back to the native app, which the page can't do for them, so it shouldn't imply a browser-side next step exists at all. Apply this consistently when this group is actually built, not decided fresh at that point.
- **Unverified-account restrictions — decided 2026-08-21, while actually building this group**: kept the existing no-restrictions MVP policy (`PLANNING.md` §3) — an unverified account can fully use the app (create/edit/delete items, manage categories, everything), the banner is purely informational, not a gate. **Explicitly flagged by the user as something to revisit and improve later** — this is a real, known gap (e.g. no protection at all against someone registering with an email they don't own and using the app indefinitely unverified), not a permanent design decision, just not being addressed as part of this pass. Revisit if/when this actually matters (real users, abuse concerns, etc.) rather than pre-emptively restricting now.

### G. Housekeeping
- Call `POST /auth/logout` from mobile's `logout()` (currently just a local token clear) — small, no screen change, just consistency with how web behaves server-side.

### H. Real color/style system — added 2026-08-21
Every screen built so far (auth, items list, item create/edit) approximates the mockups' visual language with Tailwind's stock `neutral`/`amber`/`red` palette rather than the mockups' actual OKLCH values — flagged repeatedly as a gap during MVP work (`PLANNING.md` §7's own "worth reconciling in a later polish pass" note) but never scoped as real work until now.

**Confirmed via a direct scan of `Everly Mobile.dc.html`'s source**: the mockups use **~40 distinct OKLCH color values**, not just the 3 headline colors (`#0e0a07` background, `oklch(0.78 0.14 85)` amber accent, `oklch(0.92 0.01 60)` primary text) already noted in `PLANNING.md` §7. This is a real palette with a full hierarchy — multiple background elevations (card vs. screen vs. modal-overlay, e.g. `oklch(0.19 0.012 60)` for cards vs. `oklch(0.15 0.01 60)` for the base background), border/divider tones, a full text-color scale (primary/secondary/muted/disabled), and semantic colors for danger (red family, hue ~25) and success (green family, hue ~150) beyond just the amber accent — plus alpha-channel variants (e.g. `oklch(0.15 0.01 60 / 0.7)` for the blurred header backdrop) that Tailwind's flat named classes can't represent at all.

**Why this needs real scoping, not a quick fix**: React Native/NativeWind don't support `oklch()` color syntax — every value needs converting to hex/rgba once, which means (a) deciding the conversion method (sample from source images like `#0e0a07` was, or compute OKLCH→sRGB directly — the mockups likely have a browser/design-tool source that can export exact hex, worth checking before hand-converting ~40 values), (b) building this into a proper design-token system (a NativeWind theme extension or a shared constants file) rather than hardcoding hex strings inline per-component the way current screens do, and (c) then going back through every already-built screen (auth, items list, item create/edit) to swap the approximated Tailwind classes for the real tokens — a real, multi-screen retrofit, not just new-screen work like most of A–G above.

**Not yet planned in detail** — this group needs the same audit-then-plan treatment Group E (map) is getting when picked up: first decide the conversion/token-system approach, then scope the retrofit screen-by-screen. Don't start swapping colors ad hoc without that plan, or the same "used `neutral-950` here, `#0e0a07` there" inconsistency this group exists to fix will just recur in a different form.

**Also in scope for this pass, found 2026-08-21 while building Group A**: submit-button loading-state UX is inconsistent across screens — `app/item/[id].tsx`'s Save button shows a real spinner (`ActivityIndicator`) during submission, while the three auth screens (`login.tsx`, `register.tsx`, `forgot-password.tsx`) instead swap the button's text (e.g. "Log in" → "Logging in..."). Additionally, **no screen visually dims/indicates a disabled button** — `disabled={isSubmitting}` correctly blocks the tap, but there's no opacity or style change communicating that state to the user. Both are functionally correct everywhere (every submit button genuinely disables and waits for its minimum-delay-wrapped API call, see `src/lib/withMinDelay.ts`), just visually inconsistent between screens — deliberately deferred here rather than patched piecemeal per-screen. When this group is picked up: standardize on one loading-indicator pattern (spinner is likely the better choice, matching what `item/[id].tsx` already does) and add a consistent disabled-opacity style, applied to all submit buttons at once.

---

## 3. Resolved questions (2026-08-21)

- **Sequencing**: no group here depends on another except B touching the existing item-edit category picker — otherwise these can be built in any order or in parallel across sessions. Confirmed with the user — no further sequencing decision needed.
- **Email verification (F)**: confirmed required for mobile, not optional — see F above for the chosen web-landing-page approach and why the two alternatives were rejected for now.
- **Group E (map)**: confirmed deferred to its own dedicated planning pass when picked up, not started from this doc's bullet alone — see E above.
