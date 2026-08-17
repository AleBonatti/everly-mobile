# everly-mobile

Native mobile client for [Everly](https://github.com/AleBonatti/everly) — "a list of things worth doing." Built with Expo (React Native) SDK 54, targeting iOS and Android.

## Relationship to the `everly` repo

This is a **separate repo from `everly`**, not a monorepo workspace. It talks to the same backend API that the `everly` web app uses (Render-hosted Fastify, same Supabase Postgres/Storage) — there is no separate mobile backend.

It started life as `apps/mobile` inside the `everly` monorepo, then was pulled out into this standalone repo on 2026-08-17 after real, reproduced dependency conflicts between the web app's React version and Expo/React Native's exact-pinned React requirement, that npm workspaces' hoisting couldn't resolve without workarounds. Full story, including what was tried and rejected, in `everly`'s `docs/MOBILE_PLANNING.md` §1.

## Planning & decisions

The authoritative planning doc lives in the `everly` repo, not here: [`docs/MOBILE_PLANNING.md`](../everly/docs/MOBILE_PLANNING.md) (relative path assumes this repo is checked out as a sibling of `everly`, e.g. both under `~/Work/Everly/`). It covers:

- Why this is a separate repo (§1)
- Tooling choices — Expo, Expo Router, NativeWind (§2)
- iOS/Android parallel development (§3)
- Dev/debug/test workflow (§4)
- The auth model — cookie for web, bearer token for mobile (§5)
- Hosting/infrastructure reuse (§6)
- MVP scope, concretely (§7)
- Web → mobile feature-parity notes (§8)
- The build order this project follows

Kept there rather than duplicated here to avoid drift — this repo's `docs/` folder is deliberately empty aside from this pointer.

## Shared types

`packages/shared`'s Zod schemas (`auth`, `items`, `categories`, `common`) from the `everly` repo are **not** imported directly — no filesystem link between the repos. The request/response contracts this app needs are hand-copied in, accepting manual drift risk as a known, small tradeoff (see doc §1's "known, accepted cost"). If the API's schemas change, this app's copies need a manual update to match.

## Getting started

```bash
npx expo start
```

Scan the QR code with the Expo Go app on a physical device (iOS or Android), or press `a`/`i` for an emulator/simulator.
