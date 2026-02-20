# Development Guide

## Getting Started

This guide will help you set up and run Hatchlands locally.

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Git

### Initial Setup

1. **Clone and Install**
```bash
cd c:\dev\Hatchlands
npm install
```

This installs dependencies for all workspaces (server, client, shared).

2. **Database Setup**
```bash
# Create database
createdb hatchlands

# Apply schema
psql -d hatchlands -f database/schema.sql

# (Optional) Load sample data
psql -d hatchlands -f database/seed.sql
```

3. **Configure Environment**

Server (`server/.env`):
```env
DATABASE_URL=postgresql://localhost:5432/hatchlands
PORT=3000
NODE_ENV=development
JWT_SECRET=development-secret
SPAWN_GENERATION_INTERVAL_MS=60000
```

Client (`client/.env.local`):
```env
VITE_API_URL=http://localhost:3000/api
```

4. **Build Shared Package**
```bash
cd shared
npm run build
cd ..
```

5. **Start Development**

In separate terminals:

Terminal 1 - Server:
```bash
npm run dev:server
```

Terminal 2 - Client:
```bash
npm run dev:client
```

Server: http://localhost:3000  
Client: http://localhost:5173

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Hatchlands                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Client    │ ───▶ │    Server    │ ───▶ │ Database  │ │
│  │React+Three.js│ HTTP │Express+Node  │  SQL │PostgreSQL │ │
│  └─────────────┘ ◀─── └──────────────┘ ◀─── └───────────┘ │
│                                                              │
│  Components:            Engines:          Tables:           │
│  - 3D Renderer          - Generator       - creatures       │
│  - World View           - World Sim       - spawns          │
│  - Marketplace          - Breeding        - players         │
│  - Inventory            - Market          - trades          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Shared Types & Constants                │  │
│  │  - Creature, Anchor, Spawn, GenomeSignature, etc.   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Code Organization

### Shared Package (`shared/`)
Contains TypeScript types, constants, and utilities used by both client and server.

**Key Files:**
- `types.ts` - Core data structures
- `anchors.ts` - 15 anchor species definitions
- `constants.ts` - Game configuration
- `utils.ts` - Seeded RNG, hashing, validation

### Server (`server/`)
Node.js/Express backend with PostgreSQL.

**Key Systems:**
- **Engines**: Core game logic (generation, world simulation)
- **Routes**: REST API endpoints
- **Middleware**: Auth, validation, rate limiting
- **DB**: PostgreSQL connection and queries

### Client (`client/`)
React SPA with Three.js rendering.

**Key Systems:**
- **Engine**: 3D creature renderer
- **Components**: React UI components
- **API**: HTTP client for server communication

## Development Workflow

### Making Changes

1. **Update Shared Types**
```bash
cd shared
# Edit src/types.ts
npm run build
```

2. **Server Changes**
```bash
cd server
# Edit source files
# Server auto-reloads with ts-node-dev
```

3. **Client Changes**
```bash
cd client
# Edit source files
# Vite auto-reloads
```

### Testing Changes

1. **Database Queries**
```bash
psql -d hatchlands
SELECT * FROM creatures LIMIT 5;
```

2. **API Endpoints**
```bash
# Health check
curl http://localhost:3000/health

# World state (requires auth token)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/world
```

3. **Generation Testing**
```typescript
// In server console
import { generateWildCreature } from './engines/generator';
const result = generateWildCreature(12345, 'forest');
console.log(result.creature);
```

## Common Tasks

### Add New Anchor Species
1. Edit `shared/src/anchors.ts`
2. Add species to `ANCHOR_SPECIES` object
3. Update `AnchorId` type in `shared/src/types.ts`
4. Rebuild shared package

### Add API Endpoint
1. Create route in `server/src/routes/`
2. Register in `server/src/index.ts`
3. Add client method in `client/src/api/client.ts`

### Add Database Table
1. Update `database/schema.sql`
2. Add migration if in production
3. Update types in `shared/src/types.ts`

### Modify Creature Generation
1. Edit `server/src/engines/generator.ts`
2. Adjust `generateAppearance()` or `generateGenome()`
3. Test determinism: same seed = same result

## Debugging

### Server Debugging
Add to `server/src/index.ts`:
```typescript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

### Client Debugging
```typescript
// Enable in components
console.log('World state:', worldState);
console.log('Creature params:', creature.appearanceParams);
```

### Database Debugging
```sql
-- Check spawn generation
SELECT s.*, c.primary_anchor, c.secondary_anchor 
FROM spawns s 
JOIN creatures c ON s.creature_id = c.id 
ORDER BY s.spawned_at DESC 
LIMIT 10;

-- Check player stats
SELECT username, creatures_owned, creatures_captured, currency 
FROM players;
```

## Performance Profiling

### Server
```typescript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} - ${Date.now() - start}ms`);
  });
  next();
});
```

### Client
Use React DevTools Profiler to identify slow renders.

### Database
```sql
EXPLAIN ANALYZE 
SELECT * FROM spawns 
WHERE region_id = 'region-forest-001' 
AND expires_at > 1708560000000;
```

## Git Workflow

```bash
# Feature branch
git checkout -b feature/new-anchor-species

# Make changes
git add .
git commit -m "feat: add manticore anchor species"

# Push and create PR
git push origin feature/new-anchor-species
```

## Deployment Checklist

- [ ] Update NODE_ENV to 'production'
- [ ] Change JWT_SECRET to secure value
- [ ] Set up production database
- [ ] Enable SSL/TLS
- [ ] Configure CORS properly
- [ ] Set up monitoring/logging
- [ ] Enable rate limiting
- [ ] Database backups configured
- [ ] CDN for client assets
- [ ] Load balancer if scaling

## Resources

- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [React Docs](https://react.dev/)
- [Three.js Docs](https://threejs.org/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
