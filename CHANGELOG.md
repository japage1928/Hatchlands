# Changelog

## Unreleased – Milestone 1: offline single-player loop

- Moved the deterministic creature generator from `server/src/engines/` into `shared/` (server re-exports it).
- New `client/src/local/LocalGame.ts`: offline game service (world, encounters, capture, flee, breeding, release, daily bonus) with a versioned localStorage save.
- Local hourly spawns (3-5 per hour, seeded per save), starter creature, rarity/level-based capture chance (50 coins/try), 3-minute breeding (200 coins), 1000 starting coins.
- Removed the old demo-mode code from `main.tsx`; the app is offline-only for now. Marketplace hidden.
- Added client vitest suite (`client/test/localGame.spec.ts`); `npm test` runs server + client tests.

## Unreleased – Phase 0 cleanup

- Removed ~50 zero-byte junk files from the repo root.
- Removed the Three.js / react-three-fiber viewer, procedural 3D renderer, and all GLB models (including Meshy-generated "imported" models). Creatures are now shown as 2D PNG sprites (moved to `client/public/sprites/`) with a placeholder fallback.
- Consolidated status/fix docs into `docs/`; deleted redundant ones (BUILD_SUMMARY, GITHUB_ACTIONS_TROUBLESHOOTING, GITHUB_PAGES_FIX, TEST_RESULTS, PWA_README). Rewrote README honestly.
- Added placeholder LICENSE (all rights reserved).
- GitHub Pages: workflow renamed to `deploy-pages.yml`, Node 20, runs tests; fixed icon/manifest/service-worker paths for the `/Hatchlands/` base; added placeholder PWA icons and favicon.
- `npm test` now runs vitest generator tests (replaced the unconfigured jest script).

## 7.1.0 and earlier

Pre-cleanup prototype history was squashed into a single commit.
