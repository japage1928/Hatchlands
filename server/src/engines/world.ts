/**
 * World Simulation Engine
 * 
 * Generates and maintains creature spawns across regions and time windows.
 * Runs continuously to ensure world state is current.
 */

import { Spawn, Region, Creature } from '@hatchlands/shared';
import {
  generateSpawnSeed,
  getCurrentTimeWindow,
  generateId,
  TIME_WINDOW_DURATION_MS,
  SPAWN_DURATION_MS,
} from '@hatchlands/shared';
import { generateWildCreature } from './generator';
import { query, queryMany } from '../db/connection';

export class WorldSimulationEngine {
  private running: boolean = false;
  private intervalId?: NodeJS.Timeout;

  /**
   * Start world simulation loop
   */
  start(intervalMs: number = 60000): void {
    if (this.running) {
      console.log('World simulation already running');
      return;
    }

    this.running = true;
    console.log('Starting world simulation engine');

    // Initial generation
    this.tick().catch(console.error);

    // Periodic updates
    this.intervalId = setInterval(() => {
      this.tick().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop world simulation loop
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.running = false;
    console.log('Stopped world simulation engine');
  }

  /**
   * Execute one simulation tick
   */
  private async tick(): Promise<void> {
    console.log('World simulation tick');

    try {
      // Clean up expired spawns
      await this.cleanupExpiredSpawns();

      // Get all regions
      const regions = await this.getActiveRegions();

      // Generate spawns for current time window
      for (const region of regions) {
        await this.generateRegionSpawns(region);
      }

      console.log(`Processed ${regions.length} regions`);
    } catch (error) {
      console.error('World simulation error:', error);
    }
  }

  /**
   * Get active regions from database
   */
  private async getActiveRegions(): Promise<Region[]> {
    const rows = await queryMany<any>(
      'SELECT * FROM regions'
    );

    return rows.map(row => ({
      id: row.id,
      coordinates: {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
      },
      radius: row.radius,
      biome: row.biome,
      environment: {
        temperature: parseFloat(row.temperature) || 20,
        humidity: parseFloat(row.humidity) || 50,
        elevation: parseFloat(row.elevation) || 0,
      },
    }));
  }

  /**
   * Generate spawns for a region in current time window
   */
  private async generateRegionSpawns(region: Region): Promise<void> {
    const now = Date.now();
    const timeWindowStart = getCurrentTimeWindow(TIME_WINDOW_DURATION_MS);
    const timeWindowEnd = timeWindowStart + TIME_WINDOW_DURATION_MS;

    // Generate deterministic seed for this region/time combo
    const spawnSeed = generateSpawnSeed(region.id, timeWindowStart);

    // Check if spawn already exists
    const existing = await queryMany<any>(
      'SELECT id FROM spawns WHERE region_id = $1 AND time_window_start = $2',
      [region.id, timeWindowStart]
    );

    if (existing.length > 0) {
      // Spawn already generated for this time window
      return;
    }

    // Generate creature for this spawn
    const generationResult = generateWildCreature(spawnSeed, region.biome);
    const creature = generationResult.creature;

    // Insert creature
    await this.insertCreature(creature);

    // Insert spawn
    const spawn: Spawn = {
      id: generateId(),
      seed: spawnSeed,
      regionId: region.id,
      timeWindow: {
        start: timeWindowStart,
        end: timeWindowEnd,
      },
      creature: creature,
      spawnedAt: now,
      expiresAt: now + SPAWN_DURATION_MS,
      locked: false,
    };

    await this.insertSpawn(spawn);

    console.log(`Generated spawn ${spawn.id} in region ${region.id}`);
  }

  /**
   * Insert creature into database
   */
  private async insertCreature(creature: Creature): Promise<void> {
    await query(
      `INSERT INTO creatures (
        id, seed, primary_anchor, secondary_anchor, genome_signature,
        appearance_params, status, lineage_history, birth_timestamp,
        xp, level, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING`,
      [
        creature.id,
        creature.seed,
        creature.primaryAnchor,
        creature.secondaryAnchor || null,
        JSON.stringify(creature.genomeSignature),
        JSON.stringify(creature.appearanceParams),
        creature.status,
        JSON.stringify(creature.lineageHistory),
        creature.birthTimestamp,
        creature.xp,
        creature.level,
        Date.now(),
        Date.now(),
      ]
    );
  }

  /**
   * Insert spawn into database
   */
  private async insertSpawn(spawn: Spawn): Promise<void> {
    await query(
      `INSERT INTO spawns (
        id, seed, region_id, creature_id, time_window_start, time_window_end,
        spawned_at, expires_at, locked, locked_by, locked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (region_id, time_window_start, seed) DO NOTHING`,
      [
        spawn.id,
        spawn.seed,
        spawn.regionId,
        spawn.creature.id,
        spawn.timeWindow.start,
        spawn.timeWindow.end,
        spawn.spawnedAt,
        spawn.expiresAt,
        spawn.locked,
        spawn.lockedBy || null,
        spawn.lockedAt || null,
      ]
    );
  }

  /**
   * Clean up expired spawns
   */
  private async cleanupExpiredSpawns(): Promise<void> {
    const now = Date.now();
    const result = await query(
      'DELETE FROM spawns WHERE expires_at < $1',
      [now]
    );
    
    if (result.rowCount && result.rowCount > 0) {
      console.log(`Cleaned up ${result.rowCount} expired spawns`);
    }
  }
}

// Singleton instance
export const worldSimulation = new WorldSimulationEngine();
