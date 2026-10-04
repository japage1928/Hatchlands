# Changelog

## Unreleased – Phase 0 cleanup

- Removed ~50 zero-byte junk files from the repo root.
- Removed the Three.js / react-three-fiber viewer, procedural 3D renderer, and all GLB models (including Meshy-generated "imported" models). Creatures are now shown as 2D PNG sprites (moved to `client/public/sprites/`) with a placeholder fallback.
- Consolidated status/fix docs into `docs/`; deleted redundant ones (BUILD_SUMMARY, GITHUB_ACTIONS_TROUBLESHOOTING, GITHUB_PAGES_FIX, TEST_RESULTS, PWA_README). Rewrote README honestly.
- Added placeholder LICENSE (all rights reserved).
- GitHub Pages: workflow renamed to `deploy-pages.yml`, Node 20, runs tests; fixed icon/manifest/service-worker paths for the `/Hatchlands/` base; added placeholder PWA icons and favicon.
- `npm test` now runs vitest generator tests (replaced the unconfigured jest script).

## 7.1.0 and earlier

Pre-cleanup prototype history was squashed into a single commit.
