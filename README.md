# everly-mobile

Native mobile client for [Everly](https://github.com/AleBonatti/everly) — "a list of things worth doing." Built with Expo (React Native) SDK 57, targeting iOS and Android.

## Relationship to the `everly` repo

This is a **separate repo from `everly`**, not a monorepo workspace. It talks to the same backend API that the `everly` web app uses (Render-hosted Fastify, same Supabase Postgres/Storage) — there is no separate mobile backend.

It started life as `apps/mobile` inside the `everly` monorepo, then was pulled out into this standalone repo on 2026-08-17 after real, reproduced dependency conflicts between the web app's React version and Expo/React Native's exact-pinned React requirement, that npm workspaces' hoisting couldn't resolve without workarounds. Full story, including what was tried and rejected, in this repo's own `docs/PLANNING.md` §0.

## Planning & decisions

The authoritative planning doc lives in **this repo**: [`docs/PLANNING.md`](docs/PLANNING.md). It covers:

- Why this is a separate repo (§0)
- Tooling choices — Expo, Expo Router, NativeWind (§1)
- What connects to the API, and what doesn't — hand-copied schemas, auth model (§2–3)
- Dev/debug/test workflow (§4)
- Hosting/infrastructure reuse (§5)
- MVP scope, concretely (§6)
- Screens, mapped from the design mockups (§7)
- Web → mobile feature-parity notes (§8)
- The build order this project follows (§9)

For exact build/run commands (Simulator vs. physical device, choosing a specific simulator, etc.), see [`docs/BUILD_COMMANDS.md`](docs/BUILD_COMMANDS.md).

## Shared types

`packages/shared`'s Zod schemas (`auth`, `items`, `categories`, `common`) from the `everly` repo are **not** imported directly — no filesystem link between the repos. The request/response contracts this app needs are hand-copied into `src/lib/api/schemas.ts`, accepting manual drift risk as a known, small tradeoff (see `docs/PLANNING.md` §0's "known, accepted cost"). If the API's schemas change, this app's copies need a manual update to match.

## Running the app

This app uses a local Expo dev client, **not Expo Go** — Expo Go's public build lags behind current Expo SDK releases, so this project builds and installs its own native binary instead. See `docs/BUILD_COMMANDS.md` for full details; the short version:

```bash
npx expo run:ios
```

Builds and installs on the iOS Simulator — the primary day-to-day target. Requires `.env` to have `EXPO_PUBLIC_API_URL=http://localhost:3000` (or wherever the API is reachable from the Simulator) and the API server running.

```bash
npx expo run:ios --device
```

Builds and installs on a physical iPhone over USB — used for a real-device pass once a feature is complete, and for anything the Simulator can't fake (camera, GPS). Requires `EXPO_PUBLIC_API_URL` set to the Mac's LAN IP instead of `localhost`, since a physical device can't reach the Mac's `localhost`.

Once a native build is installed (either target), day-to-day iteration is just:

```bash
npx expo start
```

with Fast Refresh applying JS/TS/styling changes instantly — no rebuild needed unless a native dependency or `app.json`/`babel.config.js`/`metro.config.js` changes.
