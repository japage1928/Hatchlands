/**
 * World API Routes
 * 
 * Primary endpoint: GET /api/world
 * Returns unified world state for the player
 */

import { Router, Request, Response } from 'express';
import { WorldResponse, Player, Spawn, TradeListing, Encounter, BreedingRequest, Creature } from '@hatchlands/shared';
import { queryMany, queryOne } from '../db/connection';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/world
 * Returns complete world state for authenticated player
 */
router.get('/world', authenticate, async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).playerId;

    // Fetch player data
    const player = await getPlayer(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Fetch nearby creatures (spawns in player's region)
    const nearbyCreatures = await getNearbySpawns(player);

    // Fetch active market listings
    const marketListings = await getMarketListings();

    // Fetch player's active encounters
    const encounters = await getPlayerEncounters(playerId);

    // Fetch player's breeding status
    const breedingStatus = await getPlayerBreeding(playerId);

    // Fetch player's owned creatures
    const ownedCreatures = await getPlayerCreatures(playerId);

    // Get current region info
    const currentRegion = player.location
      ? await getCurrentRegion(player.location.latitude, player.location.longitude)
      : undefined;

    const response: WorldResponse = {
      player,
      nearbyCreatures,
      marketListings,
      encounters,
      breedingStatus,
      ownedCreatures,
      serverTime: Date.now(),
      currentRegion,
    };

    res.json(response);
  } catch (error) {
    console.error('World endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch world state' });
  }
});

/**
 * Get player data
 */
async function getPlayer(playerId: string): Promise<Player | null> {
  const row = await queryOne<any>(
    'SELECT * FROM players WHERE id = $1',
    [playerId]
  );

  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: parseInt(row.created_at),
    lastActiveAt: parseInt(row.last_active_at),
    location: row.latitude && row.longitude
      ? { latitude: parseFloat(row.latitude), longitude: parseFloat(row.longitude) }
      : undefined,
    inventory: {
      currency: row.currency,
      items: row.items || {},
    },
    stats: {
      creaturesOwned: row.creatures_owned,
      creaturesCaptured: row.creatures_captured,
      creaturesBred: row.creatures_bred,
      creaturesTraded: row.creatures_traded,
    },
  };
}

/**
 * Get spawns near player's location
 */
async function getNearbySpawns(player: Player): Promise<Spawn[]> {
  if (!player.location) return [];

  // Find regions near player (simplified - in production would use PostGIS)
  const regions = await queryMany<any>(
    `SELECT id FROM regions 
     WHERE latitude BETWEEN $1 AND $2 
     AND longitude BETWEEN $3 AND $4`,
    [
      player.location.latitude - 0.01,
      player.location.latitude + 0.01,
      player.location.longitude - 0.01,
      player.location.longitude + 0.01,
    ]
  );

  if (regions.length === 0) return [];

  const regionIds = regions.map(r => r.id);
  const now = Date.now();

  const spawns = await queryMany<any>(
    `SELECT s.*, c.* 
     FROM spawns s
     JOIN creatures c ON s.creature_id = c.id
     WHERE s.region_id = ANY($1)
     AND s.expires_at > $2
     AND s.locked = false`,
    [regionIds, now]
  );

  return spawns.map(mapSpawn);
}

/**
 * Get active market listings
 */
async function getMarketListings(): Promise<TradeListing[]> {
  const now = Date.now();
  const listings = await queryMany<any>(
    `SELECT * FROM trade_listings 
     WHERE active = true 
     AND (expires_at IS NULL OR expires_at > $1)
     ORDER BY listed_at DESC
     LIMIT 50`,
    [now]
  );

  return listings.map(mapListing);
}

/**
 * Get player's active encounters
 */
async function getPlayerEncounters(playerId: string): Promise<Encounter[]> {
  const now = Date.now();
  const encounters = await queryMany<any>(
    `SELECT * FROM encounters 
     WHERE player_id = $1 
     AND resolved = false
     AND expires_at > $2`,
    [playerId, now]
  );

  return encounters.map(mapEncounter);
}

/**
 * Get player's breeding requests
 */
async function getPlayerBreeding(playerId: string): Promise<BreedingRequest[]> {
  const breeding = await queryMany<any>(
    `SELECT * FROM breeding_requests 
     WHERE player_id = $1 
     AND completed = false
     ORDER BY started_at DESC`,
    [playerId]
  );

  return breeding.map(mapBreeding);
}

/**
 * Get player's owned creatures
 */
async function getPlayerCreatures(playerId: string): Promise<Creature[]> {
  const creatures = await queryMany<any>(
    `SELECT * FROM creatures 
     WHERE owner_id = $1 
     ORDER BY captured_at DESC`,
    [playerId]
  );

  return creatures.map(mapCreature);
}

/**
 * Get current region from coordinates
 */
async function getCurrentRegion(lat: number, lng: number): Promise<any> {
  const region = await queryOne<any>(
    `SELECT * FROM regions 
     WHERE latitude BETWEEN $1 AND $2 
     AND longitude BETWEEN $3 AND $4
     LIMIT 1`,
    [lat - 0.01, lat + 0.01, lng - 0.01, lng + 0.01]
  );

  if (!region) return null;

  return {
    id: region.id,
    coordinates: {
      latitude: parseFloat(region.latitude),
      longitude: parseFloat(region.longitude),
    },
    radius: region.radius,
    biome: region.biome,
    environment: {
      temperature: parseFloat(region.temperature) || 20,
      humidity: parseFloat(region.humidity) || 50,
      elevation: parseFloat(region.elevation) || 0,
    },
  };
}

// Mapping functions
function mapSpawn(row: any): Spawn {
  return {
    id: row.id,
    seed: parseInt(row.seed),
    regionId: row.region_id,
    timeWindow: {
      start: parseInt(row.time_window_start),
      end: parseInt(row.time_window_end),
    },
    creature: mapCreature(row),
    spawnedAt: parseInt(row.spawned_at),
    expiresAt: parseInt(row.expires_at),
    locked: row.locked,
    lockedBy: row.locked_by,
    lockedAt: row.locked_at ? parseInt(row.locked_at) : undefined,
  };
}

function mapCreature(row: any): Creature {
  return {
    id: row.id,
    seed: parseInt(row.seed),
    primaryAnchor: row.primary_anchor,
    secondaryAnchor: row.secondary_anchor,
    genomeSignature: row.genome_signature,
    appearanceParams: row.appearance_params,
    ownerId: row.owner_id,
    status: row.status,
    lineageHistory: row.lineage_history || [],
    capturedAt: row.captured_at ? parseInt(row.captured_at) : undefined,
    birthTimestamp: parseInt(row.birth_timestamp),
    xp: row.xp,
    level: row.level,
    nickname: row.nickname,
    portraitUrl: row.portrait_url,
  };
}

function mapListing(row: any): TradeListing {
  return {
    id: row.id,
    creatureId: row.creature_id,
    sellerId: row.seller_id,
    price: row.price,
    currency: row.currency,
    listedAt: parseInt(row.listed_at),
    expiresAt: row.expires_at ? parseInt(row.expires_at) : undefined,
    active: row.active,
  };
}

function mapEncounter(row: any): Encounter {
  return {
    id: row.id,
    playerId: row.player_id,
    spawnId: row.spawn_id,
    creatureId: row.creature_id,
    startedAt: parseInt(row.started_at),
    expiresAt: parseInt(row.expires_at),
    action: row.action,
    resolved: row.resolved,
    success: row.success,
  };
}

function mapBreeding(row: any): BreedingRequest {
  return {
    id: row.id,
    parentAId: row.parent_a_id,
    parentBId: row.parent_b_id,
    playerId: row.player_id,
    breedingSeed: parseInt(row.breeding_seed),
    startedAt: parseInt(row.started_at),
    completesAt: parseInt(row.completes_at),
    completed: row.completed,
    offspringId: row.offspring_id,
  };
}

export default router;
