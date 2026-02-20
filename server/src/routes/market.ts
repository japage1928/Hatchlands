/**
 * Market/Trading Routes
 */

import { Router, Request, Response } from 'express';
import { ListCreatureRequest, PurchaseCreatureRequest, TradeListing, Trade } from '@hatchlands/shared';
import { query, queryOne } from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateId, LISTING_DURATION_MS, LISTING_FEE, MIN_CREATURE_PRICE } from '@hatchlands/shared';

const router = Router();

/**
 * POST /api/market/list
 * List a creature on the market
 */
router.post('/market/list', authenticate, async (req: Request, res: Response) => {
  try {
    const playerId = (req as AuthRequest).playerId!;
    const { creatureId, price, durationHours } = req.body as ListCreatureRequest;

    // Validate price
    if (price < MIN_CREATURE_PRICE) {
      return res.status(400).json({ error: `Minimum price is ${MIN_CREATURE_PRICE}` });
    }

    // Check creature ownership
    const creature = await queryOne<any>(
      'SELECT * FROM creatures WHERE id = $1 AND owner_id = $2',
      [creatureId, playerId]
    );

    if (!creature) {
      return res.status(404).json({ error: 'Creature not found or not owned' });
    }

    if (creature.status !== 'captured') {
      return res.status(400).json({ error: 'Creature must be captured and available' });
    }

    // Check player funds for listing fee
    const player = await queryOne<any>(
      'SELECT currency FROM players WHERE id = $1',
      [playerId]
    );

    if (!player || player.currency < LISTING_FEE) {
      return res.status(402).json({ error: 'Insufficient funds for listing fee' });
    }

    // Deduct listing fee
    await query(
      'UPDATE players SET currency = currency - $1 WHERE id = $2',
      [LISTING_FEE, playerId]
    );

    // Create listing
    const now = Date.now();
    const duration = durationHours ? durationHours * 60 * 60 * 1000 : LISTING_DURATION_MS;
    
    const listing: TradeListing = {
      id: generateId(),
      creatureId,
      sellerId: playerId,
      price,
      currency: 'coins',
      listedAt: now,
      expiresAt: now + duration,
      active: true,
    };

    await query(
      `INSERT INTO trade_listings (
        id, creature_id, seller_id, price, currency, listed_at, expires_at, active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        listing.id,
        listing.creatureId,
        listing.sellerId,
        listing.price,
        listing.currency,
        listing.listedAt,
        listing.expiresAt,
        listing.active,
        now,
      ]
    );

    // Update creature status
    await query(
      `UPDATE creatures SET status = 'listed', updated_at = $1 WHERE id = $2`,
      [now, creatureId]
    );

    res.json({ listing });
  } catch (error) {
    console.error('List creature error:', error);
    res.status(500).json({ error: 'Failed to list creature' });
  }
});

/**
 * POST /api/market/purchase
 * Purchase a creature from the market
 */
router.post('/market/purchase', authenticate, async (req: Request, res: Response) => {
  try {
    const buyerId = (req as AuthRequest).playerId!;
    const { listingId } = req.body as PurchaseCreatureRequest;

    // Get listing
    const listing = await queryOne<any>(
      'SELECT * FROM trade_listings WHERE id = $1 AND active = true',
      [listingId]
    );

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found or inactive' });
    }

    // Check expiration
    const now = Date.now();
    if (listing.expires_at && now > parseInt(listing.expires_at)) {
      return res.status(410).json({ error: 'Listing expired' });
    }

    // Can't buy own listing
    if (listing.seller_id === buyerId) {
      return res.status(400).json({ error: 'Cannot purchase your own listing' });
    }

    // Check buyer funds
    const buyer = await queryOne<any>(
      'SELECT currency FROM players WHERE id = $1',
      [buyerId]
    );

    if (!buyer || buyer.currency < listing.price) {
      return res.status(402).json({ error: 'Insufficient funds' });
    }

    // Transfer funds
    await query(
      'UPDATE players SET currency = currency - $1 WHERE id = $2',
      [listing.price, buyerId]
    );

    await query(
      'UPDATE players SET currency = currency + $1, creatures_traded = creatures_traded + 1 WHERE id = $2',
      [listing.price, listing.seller_id]
    );

    // Transfer creature ownership
    await query(
      `UPDATE creatures SET owner_id = $1, status = 'captured', updated_at = $2 WHERE id = $3`,
      [buyerId, now, listing.creature_id]
    );

    // Deactivate listing
    await query(
      'UPDATE trade_listings SET active = false WHERE id = $1',
      [listingId]
    );

    // Record trade
    const trade: Trade = {
      id: generateId(),
      listingId,
      creatureId: listing.creature_id,
      sellerId: listing.seller_id,
      buyerId,
      price: listing.price,
      completedAt: now,
    };

    await query(
      `INSERT INTO trades (
        id, listing_id, creature_id, seller_id, buyer_id, price, completed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        trade.id,
        trade.listingId,
        trade.creatureId,
        trade.sellerId,
        trade.buyerId,
        trade.price,
        trade.completedAt,
        now,
      ]
    );

    // Update buyer stats
    await query(
      'UPDATE players SET creatures_traded = creatures_traded + 1 WHERE id = $1',
      [buyerId]
    );

    res.json({ trade });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase creature' });
  }
});

/**
 * DELETE /api/market/listing/:id
 * Cancel a listing
 */
router.delete('/market/listing/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const playerId = (req as AuthRequest).playerId!;
    const listingId = req.params.id;

    const listing = await queryOne<any>(
      'SELECT * FROM trade_listings WHERE id = $1 AND seller_id = $2 AND active = true',
      [listingId, playerId]
    );

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const now = Date.now();

    // Deactivate listing
    await query(
      'UPDATE trade_listings SET active = false WHERE id = $1',
      [listingId]
    );

    // Return creature to captured status
    await query(
      `UPDATE creatures SET status = 'captured', updated_at = $1 WHERE id = $2`,
      [now, listing.creature_id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Cancel listing error:', error);
    res.status(500).json({ error: 'Failed to cancel listing' });
  }
});

export default router;
