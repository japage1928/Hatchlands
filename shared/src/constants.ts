/**
 * Shared constants for Hatchlands
 */

// ============================================================================
// GAME CONSTANTS
// ============================================================================

/** Number of anchor species in the game */
export const ANCHOR_COUNT = 15;

/** Spawn duration in milliseconds (1 hour) */
export const SPAWN_DURATION_MS = 60 * 60 * 1000;

/** Encounter lock duration in milliseconds (5 minutes) */
export const ENCOUNTER_LOCK_DURATION_MS = 5 * 60 * 1000;

/** Breeding duration in milliseconds (24 hours) */
export const BREEDING_DURATION_MS = 24 * 60 * 60 * 1000;

/** Market listing default duration (7 days) */
export const LISTING_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/** Region radius in meters for spawn detection */
export const REGION_RADIUS_METERS = 1000;

/** Time window duration for spawn generation (1 hour) */
export const TIME_WINDOW_DURATION_MS = 60 * 60 * 1000;

// ============================================================================
// CREATURE GENERATION
// ============================================================================

/** Size variation range */
export const SIZE_VARIATION = {
  MIN: 0.8,
  MAX: 1.2,
};

/** Base XP required per level */
export const XP_PER_LEVEL = 100;

/** Maximum creature level */
export const MAX_LEVEL = 100;

/** Mutation rate during breeding (0-1) */
export const MUTATION_RATE = 0.1;

/** Maximum mutations per breeding */
export const MAX_MUTATIONS = 3;

// ============================================================================
// ECONOMY
// ============================================================================

/** Starting currency for new players */
export const STARTING_CURRENCY = 1000;

/** Capture cost */
export const CAPTURE_COST = 50;

/** Breeding cost */
export const BREEDING_COST = 200;

/** Market listing fee */
export const LISTING_FEE = 25;

/** Minimum creature price */
export const MIN_CREATURE_PRICE = 100;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  WORLD: '/api/world',
  CAPTURE: '/api/encounter/capture',
  BREED: '/api/breeding/start',
  LIST_CREATURE: '/api/market/list',
  PURCHASE: '/api/market/purchase',
  UPDATE_LOCATION: '/api/player/location',
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Creature
  CREATURE_NOT_FOUND: 'CREATURE_NOT_FOUND',
  CREATURE_NOT_OWNED: 'CREATURE_NOT_OWNED',
  CREATURE_BUSY: 'CREATURE_BUSY',
  
  // Encounter
  ENCOUNTER_NOT_FOUND: 'ENCOUNTER_NOT_FOUND',
  ENCOUNTER_EXPIRED: 'ENCOUNTER_EXPIRED',
  SPAWN_LOCKED: 'SPAWN_LOCKED',
  SPAWN_NOT_FOUND: 'SPAWN_NOT_FOUND',
  
  // Breeding
  INCOMPATIBLE_ANCHORS: 'INCOMPATIBLE_ANCHORS',
  BREEDING_IN_PROGRESS: 'BREEDING_IN_PROGRESS',
  
  // Market
  LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  CANNOT_BUY_OWN: 'CANNOT_BUY_OWN',
  
  // General
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
