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
| `POST /auth/forgot-password` | Not called | Forgot-password flow |
| `POST /auth/reset-password` | Not called | Reset-password flow |
| `POST /auth/verify-email` | Not called | Email verification (not even represented in the mobile mockup — see §2) |
| `POST /auth/resend-verification` | Not called | Same as above |
| `PATCH /auth/me` | Not called | Profile editing (name) |
| `POST /auth/change-password` | Not called | Change-password, in-app settings |
| `POST /categories` | Not called | Add category |
| `PATCH /categories/:id` | Not called | Edit category |
| `DELETE /categories/:id` | Not called | Delete category |

Every items endpoint (`GET/POST/PATCH/DELETE /items`, `POST /items/:id/image`) is already fully used — items has no server-side gap, only the richer-interaction UI gaps in §1a above.

---

## 2. Feature groups (not yet sequenced into a release order)

### A. Auth completeness — forgot/reset password
Screens: 4 new views under `app/(auth)/`. API: 2 unused endpoints, already exist. Self-contained, no dependency on any other group. Mirrors the auth-screen pattern already established (login/register) closely enough that it's a natural next step technically, even though it's not high-visibility.

### B. Categories management
Screens: 2 new (list, add/edit) — likely `app/category/index.tsx` + `app/category/[id].tsx`, mirroring the existing `app/item/[id].tsx` create/edit pattern. API: 3 unused endpoints, already exist. Also needs the avatar-menu "Categories" entry point wired back in (currently omitted, per `PLANNING.md` §7). This is the one group that changes an existing screen's behavior too — once mobile can create categories, `app/item/[id].tsx`'s category picker stops being purely "select from what web created."

### C. In-app settings — profile + password
Screens: 1 new (`app/settings.tsx` or similar). API: 2 unused endpoints, already exist. Self-contained. Lowest priority of the account-related groups — web already covers this, so the value is parity/convenience, not unlocking anything mobile-only.

### D. Items list — richer browsing
Search, filter modal (multi-select + archived toggle), grid/list toggle, sort menu. All client-side UI work against the *existing* `GET /items` endpoint, which already supports `q`, `category[]`, `archived`, `sort` (confirmed in `itemsQuerySchema` — the API was already built for this, mobile just doesn't expose it yet). No new backend work. Highest-value, lowest-new-surface-area group — every other group needs at least one new screen; this one is entirely inside `app/index.tsx`.

### E. Interactive map / location picker
The one group requiring a **new native dependency** (`react-native-maps`, possibly `expo-location`) — a real, deliberate re-scoping of `PLANNING.md` §1's dependency set, not just new screens. Worth treating as its own decision (a mini version of this same planning exercise) when picked up, not folded silently into a "add a map" checklist item.

### F. Auth polish — email verification
Present in the API (`verify-email`, `resend-verification`), **absent from the mobile mockup entirely** — meaning this was never actually designed for mobile, unlike A-E which all have a mockup screen to build from. Worth deciding whether mobile needs this at all (web already has it; `PLANNING.md` §3 deliberately skipped email verification for mobile logins) before designing new screens from scratch.

### G. Housekeeping
- Call `POST /auth/logout` from mobile's `logout()` (currently just a local token clear) — small, no screen change, just consistency with how web behaves server-side.

---

## 3. Open questions for whoever picks this up

- **Sequencing**: no group here depends on another except B touching the existing item-edit category picker — otherwise these can be built in any order or in parallel across sessions.
- **Does mobile need email verification at all (F)?** Given it's absent from the mockup and was deliberately skipped for MVP mobile logins, this might be a "skip entirely" decision rather than a "when to build" one.
- **Group E (map) needs its own dependency-set decision** before any screen work starts — revisit `PLANNING.md` §1's "deferred, not needed for v1" note on `react-native-maps`/`expo-location` explicitly when this is picked up.
