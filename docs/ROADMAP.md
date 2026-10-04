# Roadmap

Decisions: offline single-player first; clean 2D sprites (no 3D); keep a creature-collecting feel but with distinct, original names and art. Slow roll: one phase at a time.

## Phase 0 – Cleanup (this PR)
Junk files, 3D removal, docs consolidation, Pages/PWA fixes, real `npm test`.

## Phase 1 – Offline local-API mode
- Run the game with no server: move generation, spawning, capture, and breeding into a client-side module backed by the shared deterministic engine.
- Save state locally (IndexedDB/localStorage) with export/import.
- Keep the existing API shape behind an interface so a real backend can be re-added later.
- Remove the demo-mode special cases in `client/src/main.tsx`.

## Phase 2 – Original creature names and art direction
- Replace the placeholder element-style names (Ember, Tide, Bloom, …) and mythical anchor names with original names and a documented art direction.
- Replace the AI-generated placeholder sprites with consistent original 2D art (and a sprite for `behemoth`).
- Replace placeholder icons; do a trademark/IP sanity check on names.
- Confirm licensing/provenance of every shipped asset.

## Phase 3 – Tutorial and first-run experience
- Guided first capture and first breeding.
- Clear empty states, help text, and basic accessibility pass.

## Later (not committed)
- Optional backend/multiplayer, trading, map/geolocation, E2E tests, cleaning up the legacy `server/test/integration.test.ts` script, and reviewing `client/MOBILE_COMPONENTS.md` (aspirational, may not match the code).
