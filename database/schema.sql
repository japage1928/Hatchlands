-- Hatchlands Database Schema
-- PostgreSQL 14+

-- ============================================================================
-- PLAYERS
-- ============================================================================

CREATE TABLE players (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  created_at BIGINT NOT NULL,
  last_active_at BIGINT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  currency INTEGER DEFAULT 1000 NOT NULL,
  items JSONB DEFAULT '{}'::jsonb,
  creatures_owned INTEGER DEFAULT 0,
  creatures_captured INTEGER DEFAULT 0,
  creatures_bred INTEGER DEFAULT 0,
  creatures_traded INTEGER DEFAULT 0
);

CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_location ON players(latitude, longitude);

-- ============================================================================
-- CREATURES
-- ============================================================================

CREATE TABLE creatures (
  id VARCHAR(36) PRIMARY KEY,
  seed BIGINT NOT NULL,
  
  -- Biology
  primary_anchor VARCHAR(20) NOT NULL,
  secondary_anchor VARCHAR(20),
  genome_signature JSONB NOT NULL,
  appearance_params JSONB NOT NULL,
  
  -- Ownership
  owner_id VARCHAR(36) REFERENCES players(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'wild',
  
  -- History
  lineage_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  captured_at BIGINT,
  birth_timestamp BIGINT NOT NULL,
  
  -- Progression
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  
  -- Metadata
  nickname VARCHAR(100),
  portrait_url TEXT,
  
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX idx_creatures_owner ON creatures(owner_id);
CREATE INDEX idx_creatures_status ON creatures(status);
CREATE INDEX idx_creatures_anchor ON creatures(primary_anchor, secondary_anchor);
CREATE INDEX idx_creatures_birth ON creatures(birth_timestamp);

-- ============================================================================
-- REGIONS
-- ============================================================================

CREATE TABLE regions (
  id VARCHAR(36) PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL,
  biome VARCHAR(50) NOT NULL,
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  elevation DECIMAL(8, 2),
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_regions_location ON regions(latitude, longitude);
CREATE INDEX idx_regions_biome ON regions(biome);

-- ============================================================================
-- SPAWNS
-- ============================================================================

CREATE TABLE spawns (
  id VARCHAR(36) PRIMARY KEY,
  seed BIGINT NOT NULL,
  region_id VARCHAR(36) NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  creature_id VARCHAR(36) NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  
  -- Time window
  time_window_start BIGINT NOT NULL,
  time_window_end BIGINT NOT NULL,
  
  -- Timestamps
  spawned_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  
  -- Lock management
  locked BOOLEAN DEFAULT FALSE,
  locked_by VARCHAR(36) REFERENCES players(id) ON DELETE SET NULL,
  locked_at BIGINT,
  
  UNIQUE(region_id, time_window_start, seed)
);

CREATE INDEX idx_spawns_region ON spawns(region_id);
CREATE INDEX idx_spawns_time_window ON spawns(time_window_start, time_window_end);
CREATE INDEX idx_spawns_expires ON spawns(expires_at);
CREATE INDEX idx_spawns_locked ON spawns(locked, locked_by);

-- ============================================================================
-- ENCOUNTERS
-- ============================================================================

CREATE TABLE encounters (
  id VARCHAR(36) PRIMARY KEY,
  player_id VARCHAR(36) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  spawn_id VARCHAR(36) NOT NULL REFERENCES spawns(id) ON DELETE CASCADE,
  creature_id VARCHAR(36) NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  
  started_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  
  action VARCHAR(20),
  resolved BOOLEAN DEFAULT FALSE,
  success BOOLEAN,
  
  created_at BIGINT NOT NULL,
  resolved_at BIGINT
);

CREATE INDEX idx_encounters_player ON encounters(player_id);
CREATE INDEX idx_encounters_spawn ON encounters(spawn_id);
CREATE INDEX idx_encounters_resolved ON encounters(resolved);
CREATE INDEX idx_encounters_expires ON encounters(expires_at);

-- ============================================================================
-- BREEDING
-- ============================================================================

CREATE TABLE breeding_requests (
  id VARCHAR(36) PRIMARY KEY,
  parent_a_id VARCHAR(36) NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  parent_b_id VARCHAR(36) NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  player_id VARCHAR(36) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  breeding_seed BIGINT NOT NULL,
  
  started_at BIGINT NOT NULL,
  completes_at BIGINT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  
  offspring_id VARCHAR(36) REFERENCES creatures(id) ON DELETE SET NULL,
  
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_breeding_player ON breeding_requests(player_id);
CREATE INDEX idx_breeding_parents ON breeding_requests(parent_a_id, parent_b_id);
CREATE INDEX idx_breeding_completed ON breeding_requests(completed, completes_at);

-- ============================================================================
-- MARKET
-- ============================================================================

CREATE TABLE trade_listings (
  id VARCHAR(36) PRIMARY KEY,
  creature_id VARCHAR(36) NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  seller_id VARCHAR(36) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  price INTEGER NOT NULL,
  currency VARCHAR(20) DEFAULT 'coins',
  
  listed_at BIGINT NOT NULL,
  expires_at BIGINT,
  active BOOLEAN DEFAULT TRUE,
  
  created_at BIGINT NOT NULL,
  
  UNIQUE(creature_id)
);

CREATE INDEX idx_listings_seller ON trade_listings(seller_id);
CREATE INDEX idx_listings_active ON trade_listings(active, expires_at);
CREATE INDEX idx_listings_price ON trade_listings(price);

CREATE TABLE trades (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL REFERENCES trade_listings(id) ON DELETE CASCADE,
  creature_id VARCHAR(36) NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  seller_id VARCHAR(36) NOT NULL REFERENCES players(id) ON DELETE SET NULL,
  buyer_id VARCHAR(36) NOT NULL REFERENCES players(id) ON DELETE SET NULL,
  
  price INTEGER NOT NULL,
  completed_at BIGINT NOT NULL,
  
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_trades_seller ON trades(seller_id);
CREATE INDEX idx_trades_buyer ON trades(buyer_id);
CREATE INDEX idx_trades_creature ON trades(creature_id);
CREATE INDEX idx_trades_completed ON trades(completed_at);

-- ============================================================================
-- SESSION MANAGEMENT
-- ============================================================================

CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  player_id VARCHAR(36) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  last_used_at BIGINT NOT NULL
);

CREATE INDEX idx_sessions_player ON sessions(player_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update creature ownership count
CREATE OR REPLACE FUNCTION update_creature_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.owner_id IS NOT NULL THEN
      UPDATE players SET creatures_owned = creatures_owned + 1 WHERE id = NEW.owner_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.owner_id IS NOT NULL AND OLD.owner_id != NEW.owner_id THEN
      UPDATE players SET creatures_owned = creatures_owned - 1 WHERE id = OLD.owner_id;
    END IF;
    IF NEW.owner_id IS NOT NULL AND OLD.owner_id != NEW.owner_id THEN
      UPDATE players SET creatures_owned = creatures_owned + 1 WHERE id = NEW.owner_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.owner_id IS NOT NULL THEN
      UPDATE players SET creatures_owned = creatures_owned - 1 WHERE id = OLD.owner_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creature_ownership_trigger
AFTER INSERT OR UPDATE OR DELETE ON creatures
FOR EACH ROW EXECUTE FUNCTION update_creature_counts();

-- Clean up expired spawns
CREATE OR REPLACE FUNCTION cleanup_expired_spawns()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM spawns WHERE expires_at < EXTRACT(EPOCH FROM NOW()) * 1000;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions WHERE expires_at < EXTRACT(EPOCH FROM NOW()) * 1000;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
