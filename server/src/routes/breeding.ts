/**
 * Breeding & Lineage Routes
 */

import { Router, Request, Response } from 'express';
import { BreedCreaturesRequest, BreedingRequest } from '@hatchlands/shared';
import { query, queryOne, queryMany } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateId, BREEDING_DURATION_MS, BREEDING_COST } from '@hatchlands/shared';
import { generateCreature } from '../engines/generator';
import { isCompatibleForHybrid } from '@hatchlands/shared';

const router = Router();

/**
 * POST /api/breeding/start
 * Start breeding two creatures
 */
router.post('/breeding/start', authenticate, async (req: Request, res: Response) => {
  try {
    const playerId = (req as AuthRequest).playerId!;
    const { parentAId, parentBId } = req.body as BreedCreaturesRequest;

    // Validate both creatures exist and are owned by player
    const creatures = await queryMany<any>(
      'SELECT * FROM creatures WHERE id IN ($1, $2) AND owner_id = $3',
      [parentAId, parentBId, playerId]
    );

    if (creatures.length !== 2) {
      return res.status(404).json({ error: 'One or both creatures not found or not owned' });
    }

    const [parentA, parentB] = creatures;

    // Check if creatures are available (not breeding, not listed)
    if (parentA.status !== 'captured' || parentB.status !== 'captured') {
      return res.status(400).json({ error: 'Creatures must be captured and available' });
    }

    // Check anchor compatibility
    if (!isCompatibleForHybrid(parentA.primary_anchor, parentB.primary_anchor)) {
      return res.status(400).json({ error: 'Incompatible anchors for breeding' });
    }

    // Check player currency
    const player = await queryOne<any>(
      'SELECT currency FROM players WHERE id = $1',
      [playerId]
    );

    if (!player || player.currency < BREEDING_COST) {
      return res.status(402).json({ error: 'Insufficient funds' });
    }

    // Deduct cost
    await query(
      'UPDATE players SET currency = currency - $1 WHERE id = $2',
      [BREEDING_COST, playerId]
    );

    // Mark creatures as breeding
    await query(
      `UPDATE creatures SET status = 'breeding', updated_at = $1 WHERE id IN ($2, $3)`,
      [Date.now(), parentAId, parentBId]
    );

    // Create breeding request
    const now = Date.now();
    const breedingSeed = Math.floor(Math.random() * 1000000000);
    
    const breeding: BreedingRequest = {
      id: generateId(),
      parentAId,
      parentBId,
      playerId,
      breedingSeed,
      startedAt: now,
      completesAt: now + BREEDING_DURATION_MS,
      completed: false,
    };

    await query(
      `INSERT INTO breeding_requests (
        id, parent_a_id, parent_b_id, player_id, breeding_seed,
        started_at, completes_at, completed, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        breeding.id,
        breeding.parentAId,
        breeding.parentBId,
        breeding.playerId,
        breeding.breedingSeed,
        breeding.startedAt,
        breeding.completesAt,
        breeding.completed,
        now,
      ]
    );

    res.json({ breeding });
  } catch (error) {
    console.error('Start breeding error:', error);
    res.status(500).json({ error: 'Failed to start breeding' });
  }
});

/**
 * POST /api/breeding/complete
 * Complete a breeding request and generate offspring
 */
router.post('/breeding/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const playerId = (req as AuthRequest).playerId!;
    const { breedingId } = req.body;

    // Get breeding request
    const breeding = await queryOne<any>(
      'SELECT * FROM breeding_requests WHERE id = $1 AND player_id = $2 AND completed = false',
      [breedingId, playerId]
    );

    if (!breeding) {
      return res.status(404).json({ error: 'Breeding request not found' });
    }

    const now = Date.now();
    if (now < parseInt(breeding.completes_at)) {
      return res.status(400).json({ error: 'Breeding not yet complete' });
    }

    // Get parent creatures
    const parents = await queryMany<any>(
      'SELECT * FROM creatures WHERE id IN ($1, $2)',
      [breeding.parent_a_id, breeding.parent_b_id]
    );

    if (parents.length !== 2) {
      return res.status(404).json({ error: 'Parent creatures not found' });
    }

    const [parentA, parentB] = parents;

    // Generate offspring
    const offspringResult = generateCreature({
      seed: parseInt(breeding.breeding_seed),
      primaryAnchorId: parentA.primary_anchor,
      secondaryAnchorId: parentB.primary_anchor,
      parentGenomes: {
        parentA: parentA.genome_signature,
        parentB: parentB.genome_signature,
      },
    });

    const offspring = offspringResult.creature;
    offspring.ownerId = playerId;
    offspring.status = 'captured';
    offspring.lineageHistory = [
      {
        creatureId: offspring.id,
        generation: offspring.genomeSignature.generation,
        timestamp: now,
        parentA: parentA.id,
        parentB: parentB.id,
      },
    ];

    // Insert offspring creature
    await query(
      `INSERT INTO creatures (
        id, seed, primary_anchor, secondary_anchor, genome_signature,
        appearance_params, owner_id, status, lineage_history, birth_timestamp,
        xp, level, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        offspring.id,
        offspring.seed,
        offspring.primaryAnchor,
        offspring.secondaryAnchor,
        JSON.stringify(offspring.genomeSignature),
        JSON.stringify(offspring.appearanceParams),
        offspring.ownerId,
        offspring.status,
        JSON.stringify(offspring.lineageHistory),
        offspring.birthTimestamp,
        offspring.xp,
        offspring.level,
        now,
        now,
      ]
    );

    // Mark breeding as complete
    await query(
      'UPDATE breeding_requests SET completed = true, offspring_id = $1 WHERE id = $2',
      [offspring.id, breedingId]
    );

    // Return parent creatures to captured status
    await query(
      `UPDATE creatures SET status = 'captured', updated_at = $1 WHERE id IN ($2, $3)`,
      [now, parentA.id, parentB.id]
    );

    // Update player stats
    await query(
      'UPDATE players SET creatures_bred = creatures_bred + 1 WHERE id = $1',
      [playerId]
    );

    res.json({ offspring });
  } catch (error) {
    console.error('Complete breeding error:', error);
    res.status(500).json({ error: 'Failed to complete breeding' });
  }
});

export default router;
