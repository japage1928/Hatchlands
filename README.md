# Hatchlands

**A location-based multiplayer creature ecosystem**

Hatchlands is a persistent creature population simulator where players discover, capture, breed, and trade individual organisms in a shared world. Every creature is unique, deterministically generated, and permanently recorded.

## Core Principles

- **Persistent World Simulation**: Server-authoritative shared world
- **Individual Organisms**: Each creature is unique with lineage and identity
- **Deterministic Reconstruction**: Creatures rebuild identically from seed data
- **Anchor Biology**: 15 anchor species define biological constraints
- **True Ownership**: Creatures are transferable records, not duplicates

## Project Structure

```
hatchlands/
├── server/          # Server-side Node.js application
├── client/          # Client-side React + Three.js application
├── shared/          # Shared types and constants
└── database/        # Database schema and migrations
```

## Engines

1. **Biological Engine** - Anchor species constraint system
2. **Deterministic Engine** - Seed-based reconstruction
3. **Persistence Engine** - Permanent records and auditability
4. **Rendering Engine** - Parameter-driven 3D reconstruction
5. **Economy Engine** - Ownership transfer via trade
6. **World Simulation Engine** - Region-based population generation

## Setup

See individual README files in `server/` and `client/` directories.

## Architecture

- **Server**: Authoritative world state, generates spawns, validates actions
- **Client**: Displays world data, renders creatures, sends player actions
- **Database**: PostgreSQL for persistent storage

## Key Concepts

### Creature Identity
Every creature contains:
- `id` - Unique identifier
- `seed` - Generation seed
- `primaryAnchor` - Base species
- `secondaryAnchor` - Hybrid species (optional)
- `genomeSignature` - Genetic data
- `appearanceParams` - Visual parameters
- `lineageHistory` - Ancestry chain
- `status` - Current state

### World Contract
Primary endpoint: `GET /world`

Returns unified state:
- Player data
- Nearby creatures
- Market listings  
- Encounters
- Breeding status

### Spawn Rules
Spawns depend only on: `seed + region + time window`

Independent of player activity for fairness and reproducibility.

## 📱 Progressive Web App

Hatchlands is now **PWA-ready** with mobile-first design:

### Features
- ✅ Install to home screen (mobile & desktop)
- ✅ Offline support with service worker caching
- ✅ Touch-optimized UI (swipe, tap, haptic feedback)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ GitHub Pages deployment (auto-deploy on push)

### Quick Deploy
```bash
git push origin main  # Automatically deploys to GitHub Pages
```

**📱 Full PWA Guide:** [PWA_README.md](PWA_README.md)  
**🚀 Deployment Options:** [DEPLOYMENT.md](DEPLOYMENT.md)  
**🎨 Mobile Components:** [client/MOBILE_COMPONENTS.md](client/MOBILE_COMPONENTS.md)

---

## Documentation

- **[BUILD_SUMMARY.md](BUILD_SUMMARY.md)** - Complete build documentation
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development workflow
- **[PWA_README.md](PWA_README.md)** - ⭐ PWA & mobile features
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - ⭐ Production deployment
- **[server/README.md](server/README.md)** - Server API
- **[client/README.md](client/README.md)** - Client architecture
- **[client/MOBILE_COMPONENTS.md](client/MOBILE_COMPONENTS.md)** - ⭐ Touch UI
- **[shared/README.md](shared/README.md)** - Type system
- **[database/README.md](database/README.md)** - Database schema
