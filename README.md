# Hatchlands

A creature-collecting and breeding game built with React, Vite and TypeScript.

**Status: early development / prototype.** It is not production-ready and not a finished game.
Live static client: https://japage1928.github.io/Hatchlands/

## What works today

- Deterministic, seed-based creature generation (15 "anchor" species with biology rules) in `shared/` (the server re-exports it).
- **Offline single-player loop** (no backend, no GPS), saved in the browser (`localStorage`, versioned) by `client/src/local/LocalGame.ts`:
  - Start with 1000 coins and a starter creature.
  - 3-5 wild creatures per hour, generated from your save's seed; they refresh on the hour.
  - Capture costs 50 coins per try; chance (10-90%) depends on species rarity, level and hybrid status.
  - Breeding costs 200 coins and hatches in 3 minutes.
  - Earn coins by releasing creatures (25 + 10 per level) or claiming a daily bonus (250).
- Creatures are shown as 2D PNG sprites (14 of 15 species have one; a placeholder is shown for the rest).
- Installable PWA shell (service worker, manifest, placeholder icons).
- Unit tests for the generator and the offline game service (`npm test`).

## What does not work / is not done

- The hosted site runs fully offline; the online/server mode is not wired into the UI (`client/src/api/client.ts` is kept for later).
- The Express/PostgreSQL server in `server/` exists but is not deployed and is not exercised by CI.
- Marketplace/trading is hidden. There is no tutorial, XP/levelling from play, or final art. Sprites and icons are placeholders.
- The game is moving toward **offline single-player first**; multiplayer is deferred. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Run it

Requires Node.js 20+ and npm 9+.

```bash
npm ci
npm run dev:client      # client dev server at http://localhost:5173/Hatchlands/
npm run build           # builds shared + client into client/dist
npm test                # runs the generator tests (vitest)
```

The server (optional, needs PostgreSQL) is described in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Project layout

```
client/    React + Vite PWA (2D sprites in client/public/sprites)
shared/    Shared types, anchor species, seeded RNG / genetics
server/    Express + PostgreSQL API and the deterministic generator (tests live here)
database/  SQL schema and seed data
docs/      Development, deployment, roadmap
```

## Docs

- [docs/ROADMAP.md](docs/ROADMAP.md) – planned phases
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) – dev setup (includes the legacy server/DB path)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) – GitHub Pages deployment
- [CHANGELOG.md](CHANGELOG.md)

## License

All rights reserved (placeholder, see [LICENSE](LICENSE)).
