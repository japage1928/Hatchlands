# Hatchlands Server

Authoritative server for Hatchlands persistent world simulation.

## Architecture

The server follows a modular architecture with clear separation of concerns:

```
server/
├── src/
│   ├── engines/          # Core game engines
│   │   ├── generator.ts  # Deterministic creature generation
│   │   └── world.ts      # World simulation loop
│   ├── routes/           # API endpoints
│   │   ├── world.ts      # Main world state endpoint
│   │   ├── encounter.ts  # Encounter/capture system
│   │   ├── breeding.ts   # Breeding operations
│   │   └── market.ts     # Trading/marketplace
│   ├── middleware/       # Express middleware
│   │   └── auth.ts       # JWT authentication
│   ├── db/               # Database utilities
│   │   └── connection.ts # PostgreSQL connection
│   └── index.ts          # Server entry point
```

## Core Systems

### 1. Deterministic Generation Engine (`engines/generator.ts`)
- **Purpose**: Generate creatures from seeds with strict biological constraints
- **Key Features**:
  - Seed-based reproducibility
  - Anchor species constraint enforcement
  - Genome inheritance for breeding
  - Procedural parameter generation

### 2. World Simulation Engine (`engines/world.ts`)
- **Purpose**: Maintain persistent world state across regions and time
- **Key Features**:
  - Continuous spawn generation
  - Time window management
  - Region-based population control
  - Automatic cleanup of expired entities

### 3. API Routes

#### World Endpoint (`routes/world.ts`)
- **GET `/api/world`** - Returns complete world state:
  - Player data
  - Nearby spawns
  - Market listings
  - Active encounters
  - Breeding status
  - Owned creatures

#### Encounter System (`routes/encounter.ts`)
- **POST `/api/encounter/start`** - Lock spawn and create encounter
- **POST `/api/encounter/capture`** - Capture creature (costs currency)
- **POST `/api/encounter/flee`** - Abandon encounter

#### Breeding System (`routes/breeding.ts`)
- **POST `/api/breeding/start`** - Begin breeding process
- **POST `/api/breeding/complete`** - Generate offspring creature

#### Market System (`routes/market.ts`)
- **POST `/api/market/list`** - List creature for sale
- **POST `/api/market/purchase`** - Buy creature
- **DELETE `/api/market/listing/:id`** - Cancel listing

## Environment Configuration

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/hatchlands

# Server
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# World Simulation
SPAWN_GENERATION_INTERVAL_MS=60000
CLEANUP_INTERVAL_MS=300000
```

## Database Setup

1. Create database:
```bash
createdb hatchlands
```

2. Apply schema:
```bash
psql -d hatchlands -f ../database/schema.sql
```

3. (Optional) Seed sample data:
```bash
psql -d hatchlands -f ../database/seed.sql
```

## Development

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

## API Design Principles

1. **Server Authority**: All game logic executes server-side
2. **Determinism**: Same inputs always produce same outputs
3. **Immutability**: Historical data is append-only
4. **Validation**: All player actions are validated before execution
5. **Atomicity**: Database transactions ensure consistency

## Key Constraints

### Anchor Biology
- All creatures constrained by anchor species rules
- Forbidden parts strictly enforced
- Hybrid compatibility validated
- Material/palette restrictions applied

### Spawn Generation
- Deterministic: `seed = hash(regionId + timeWindow)`
- Independent of player activity
- Time-window based (1 hour windows)
- Auto-expires after spawn duration

### Ownership Transfer
- Creatures are unique records, never duplicated
- All transfers recorded in trade history
- Status updates reflect current state
- Lineage preserved permanently

## Performance Considerations

- Connection pooling for database (max 20 connections)
- Rate limiting on API endpoints
- Efficient indexing on queries
- Periodic cleanup of expired data
- Lazy loading of world state

## Security

- JWT-based authentication
- Session validation on every request
- Rate limiting to prevent abuse
- Input validation on all endpoints
- SQL injection prevention via parameterized queries

## Monitoring

Server logs include:
- Query execution times
- World simulation ticks
- Error traces
- Authentication events
- Resource cleanup operations

## Scaling Strategies

For production deployment:

1. **Horizontal Scaling**: 
   - Multiple server instances behind load balancer
   - Shared database connection pool
   - Session storage in Redis

2. **Database Optimization**:
   - Read replicas for world queries
   - Partitioning for historical data
   - Materialized views for complex queries

3. **Caching**:
   - Redis for active spawn cache
   - CDN for creature portraits
   - Memory cache for anchor definitions

## Testing

Run tests:
```bash
npm test
```

Test coverage includes:
- Deterministic generation validation
- Breeding genome inheritance
- Market transaction atomicity
- Encounter lock mechanisms
- World state consistency

## Troubleshooting

**Database connection fails**:
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

**Spawns not generating**:
- Check world simulation logs
- Verify regions exist in database
- Confirm TIME_WINDOW_DURATION_MS setting

**Authentication errors**:
- Verify JWT_SECRET matches
- Check token expiration
- Ensure session exists in database
