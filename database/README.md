# Hatchlands Database

PostgreSQL database for Hatchlands persistent world.

## Schema Overview

### Core Tables
- **players**: Player accounts and stats
- **creatures**: Individual organism records
- **regions**: Geographic spawn areas
- **spawns**: Active creature spawns in the world
- **encounters**: Player interaction with spawns
- **breeding_requests**: Breeding operations
- **trade_listings**: Market listings
- **trades**: Completed transactions
- **sessions**: Authentication tokens

## Setup

### Prerequisites
- PostgreSQL 14 or higher
- psql command-line tool

### Local Development

1. Create database:
```bash
createdb hatchlands
```

2. Apply schema:
```bash
psql -d hatchlands -f schema.sql
```

3. Load seed data (optional):
```bash
psql -d hatchlands -f seed.sql
```

### Environment Variables

Create `.env` file in server directory:
```
DATABASE_URL=postgresql://user:password@localhost:5432/hatchlands
```

## Maintenance

### Clean up expired data
```sql
SELECT cleanup_expired_spawns();
SELECT cleanup_expired_sessions();
```

### Backup
```bash
pg_dump hatchlands > backup.sql
```

### Restore
```bash
psql hatchlands < backup.sql
```

## Design Principles

1. **Immutable History**: Lineage and trades are append-only
2. **Deterministic**: Creatures can be reconstructed from seed data
3. **Server Authoritative**: All state validated server-side
4. **No Cascading Deletes**: Preserve historical records
5. **Indexed Queries**: Optimized for world state retrieval
