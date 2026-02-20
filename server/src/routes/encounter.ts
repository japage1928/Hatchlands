/**
 * Encounter & Capture Routes
 */

import { Router, Request, Response } from 'express';
import { Encounter, CaptureAttemptRequest } from '@hatchlands/shared';
import { query, queryOne } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateId, ENCOUNTER_LOCK_DURATION_MS, CAPTURE_COST } from '@hatchlands/shared';

const router = Router();

/**
 * POST /api/encounter/start
 * Start an encounter with a spawn
 */
router.post('/encounter/start', authenticate, async (req: Request, res: Response) => {
  try {
    const playerId = (req as AuthRequest).playerId!;
    const { spawnId } = req.body;

    if (!spawnId) {
      return res.status(400).json({ error: 'Spawn ID required' });
    }

    // Check if spawn exists and is not locked
    const spawn = await queryOne<any>(
      'SELECT * FROM spawns WHERE id = $1 AND expires_at > $2',
      [spawnId, Date.now()]
    );

    if (!spawn) {
      return res.status(404).json({ error: 'Spawn not found or expired' });
    }

    if (spawn.locked) {
      return res.status(409).json({ error: 'Spawn already locked by another player' });
    }

    // Lock the spawn
    const now = Date.now();
    await query(
      'UPDATE spawns SET locked = true, locked_by = $1, locked_at = $2 WHERE id = $3',
      [playerId, now, spawnId]
    );

    // Create encounter
    const encounter: Encounter = {
      id: generateId(),
      playerId,
      spawnId,
      creatureId: spawn.creature_id,
      startedAt: now,
      expiresAt: now + ENCOUNTER_LOCK_DURATION_MS,
      resolved: false,
    };

    await query(
      `INSERT INTO encounters (
        id, player_id, spawn_id, creature_id, started_at, expires_at, resolved, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        encounter.id,
        encounter.playerId,
        encounter.spawnId,
        encounter.creatureId,
        encounter.startedAt,
        encounter.expiresAt,
        encounter.resolved,
        now,
      ]
    );

    res.json({ encounter });
  } catch (error) {
    console.error('Start encounter error:', error);
    res.status(500).json({ error: 'Failed to start encounter' });
  }
});

/**
 * POST /api/encounter/capture
 * Attempt to capture a creature
 */
router.post('/encounter/capture', authenticate, async (req: Request, res: Response) => {
  try {
    const playerId = (req as AuthRequest).playerId!;
    const { encounterId, spawnId } = req.body as CaptureAttemptRequest;

    // Validate encounter
    const encounter = await queryOne<any>(
      'SELECT * FROM encounters WHERE id = $1 AND player_id = $2 AND resolved = false',
      [encounterId, playerId]
    );

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    if (Date.now() > parseInt(encounter.expires_at)) {
      return res.status(410).json({ error: 'Encounter expired' });
    }

    // Check player currency
    const player = await queryOne<any>(
      'SELECT currency FROM players WHERE id = $1',
      [playerId]
    );

    if (!player || player.currency < CAPTURE_COST) {
      return res.status(402).json({ error: 'Insufficient funds' });
    }

    // Deduct cost
    await query(
      'UPDATE players SET currency = currency - $1, creatures_captured = creatures_captured + 1 WHERE id = $2',
      [CAPTURE_COST, playerId]
    );

    // Transfer creature ownership
    const now = Date.now();
    await query(
      `UPDATE creatures SET 
        owner_id = $1, 
        status = 'captured', 
        captured_at = $2,
        updated_at = $3
       WHERE id = $4`,
      [playerId, now, now, encounter.creature_id]
    );

    // Mark encounter as resolved
    await query(
      'UPDATE encounters SET resolved = true, action = $1, success = true, resolved_at = $2 WHERE id = $3',
      ['capture', now, encounterId]
    );

    // Unlock and remove spawn
    await query(
      'DELETE FROM spawns WHERE id = $1',
      [spawnId]
    );

    res.json({ success: true, creatureId: encounter.creature_id });
  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ error: 'Failed to capture creature' });
  }
});

/**
 * POST /api/encounter/flee
 * Flee from an encounter
 */
router.post('/encounter/flee', authenticate, async (req: Request, res: Response) => {
  try {
    const playerId = (req as AuthRequest).playerId!;
    const { encounterId, spawnId } = req.body;

    const now = Date.now();

    // Mark encounter as resolved
    await query(
      'UPDATE encounters SET resolved = true, action = $1, success = false, resolved_at = $2 WHERE id = $3',
      ['flee', now, encounterId]
    );

    // Unlock spawn
    await query(
      'UPDATE spawns SET locked = false, locked_by = NULL, locked_at = NULL WHERE id = $1',
      [spawnId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Flee error:', error);
    res.status(500).json({ error: 'Failed to flee encounter' });
  }
});

export default router;
