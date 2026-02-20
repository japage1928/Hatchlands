/**
 * Shared type definitions for Hatchlands
 * 
 * These types define the core data structures used across
 * the entire system for creatures, anchors, spawns, and world state.
 */

// ============================================================================
// ANCHOR SPECIES TYPES
// ============================================================================

export type AnchorId = 
  | 'dragon' | 'serpent' | 'phoenix' | 'griffin' | 'basilisk'
  | 'unicorn' | 'kraken' | 'chimera' | 'hydra' | 'sphinx'
  | 'pegasus' | 'manticore' | 'leviathan' | 'roc' | 'behemoth';

export interface AnchorSpecies {
  id: AnchorId;
  name: string;
  description: string;
  /** Base rarity 0-1, affects spawn probability */
  rarity: number;
  /** Biological traits that define physical constraints */
  biology: {
    /** Size category: tiny, small, medium, large, huge, colossal */
    sizeCategory: string;
    /** Primary habitat types */
    habitats: string[];
    /** Locomotion types: terrestrial, aquatic, aerial */
    locomotion: string[];
    /** Diet type: carnivore, herbivore, omnivore */
    diet: string;
  };
  /** Parts that can be used in generation */
  anatomy: {
    bodyParts: string[];
    headTypes: string[];
    limbTypes: string[];
    tailTypes: string[];
    wingTypes?: string[];
    finTypes?: string[];
  };
  /** Color palette constraints */
  colorPalettes: string[][];
  /** Material/texture rules */
  materials: string[];
  /** Forbidden part combinations */
  forbidden: {
    parts: string[];
  };
  /** Rules for hybridization with other anchors */
  hybridRules: {
    compatibleAnchors: AnchorId[];
    maxForeignParts: number;
    dominantTraits: string[];
  };
}

// ============================================================================
// CREATURE IDENTITY TYPES
// ============================================================================

export interface CreatureId {
  id: string;
  /** Generation seed for deterministic reconstruction */
  seed: number;
}

export interface GenomeSignature {
  /** Primary genetic data from parent A (if bred) */
  primaryGenes: number[];
  /** Secondary genetic data from parent B (if bred) */
  secondaryGenes?: number[];
  /** Mutation factors applied during breeding */
  mutations: number[];
  /** Generation number (0 = wild, 1+ = bred) */
  generation: number;
}

export interface AppearanceParams {
  /** Selected body parts by category */
  parts: {
    body: string;
    head: string;
    limbs: string[];
    tail?: string;
    wings?: string[];
    fins?: string[];
  };
  /** Color indices from anchor palette */
  colorIndices: number[];
  /** Material selections */
  materials: string[];
  /** Size variation multiplier 0.8-1.2 */
  scale: number;
  /** Additional procedural parameters */
  procedural: {
    [key: string]: number;
  };
}

export interface LineageNode {
  creatureId: string;
  generation: number;
  timestamp: number;
  parentA?: string;
  parentB?: string;
}

export type CreatureStatus = 
  | 'wild'        // Exists in world, uncaptured
  | 'captured'    // Owned by player
  | 'breeding'    // Currently in breeding process
  | 'listed'      // On market
  | 'traded';     // Recently traded

export interface Creature {
  // Identity
  id: string;
  seed: number;
  
  // Biology
  primaryAnchor: AnchorId;
  secondaryAnchor?: AnchorId;
  genomeSignature: GenomeSignature;
  appearanceParams: AppearanceParams;
  
  // Ownership & State
  ownerId?: string;
  status: CreatureStatus;
  
  // History
  lineageHistory: LineageNode[];
  capturedAt?: number;
  birthTimestamp: number;
  
  // Experience & Growth
  xp: number;
  level: number;
  
  // Optional metadata
  nickname?: string;
  portraitUrl?: string;
}

// ============================================================================
// WORLD & SPAWN TYPES
// ============================================================================

export interface Region {
  id: string;
  /** Geographic center */
  coordinates: {
    latitude: number;
    longitude: number;
  };
  /** Radius in meters */
  radius: number;
  /** Biome type affecting spawn composition */
  biome: string;
  /** Environmental factors */
  environment: {
    temperature: number;
    humidity: number;
    elevation: number;
  };
}

export interface TimeWindow {
  /** Unix timestamp ms */
  start: number;
  /** Unix timestamp ms */
  end: number;
}

export interface Spawn {
  id: string;
  /** Deterministic seed: hash(regionSeed + timeWindowSeed) */
  seed: number;
  regionId: string;
  timeWindow: TimeWindow;
  /** Generated creature data */
  creature: Creature;
  /** Spawn timestamp */
  spawnedAt: number;
  /** Expiry timestamp */
  expiresAt: number;
  /** Current lock status */
  locked: boolean;
  lockedBy?: string;
  lockedAt?: number;
}

// ============================================================================
// ENCOUNTER TYPES
// ============================================================================

export type EncounterAction = 'capture' | 'flee' | 'observe';

export interface Encounter {
  id: string;
  playerId: string;
  spawnId: string;
  creatureId: string;
  startedAt: number;
  expiresAt: number;
  action?: EncounterAction;
  resolved: boolean;
  success?: boolean;
}

// ============================================================================
// BREEDING TYPES
// ============================================================================

export interface BreedingRequest {
  id: string;
  parentAId: string;
  parentBId: string;
  playerId: string;
  breedingSeed: number;
  startedAt: number;
  completesAt: number;
  completed: boolean;
  offspringId?: string;
}

// ============================================================================
// MARKET TYPES
// ============================================================================

export interface TradeListing {
  id: string;
  creatureId: string;
  sellerId: string;
  price: number;
  currency: string;
  listedAt: number;
  expiresAt?: number;
  active: boolean;
}

export interface Trade {
  id: string;
  listingId: string;
  creatureId: string;
  sellerId: string;
  buyerId: string;
  price: number;
  completedAt: number;
}

// ============================================================================
// PLAYER TYPES
// ============================================================================

export interface Player {
  id: string;
  username: string;
  email?: string;
  createdAt: number;
  lastActiveAt: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  inventory: {
    currency: number;
    items: { [itemId: string]: number };
  };
  stats: {
    creaturesOwned: number;
    creaturesCaptured: number;
    creaturesBred: number;
    creaturesTraded: number;
  };
}

// ============================================================================
// WORLD CONTRACT TYPES
// ============================================================================

export interface WorldResponse {
  /** Current player data */
  player: Player;
  
  /** Nearby creature spawns in player's region */
  nearbyCreatures: Spawn[];
  
  /** Active market listings */
  marketListings: TradeListing[];
  
  /** Player's active encounters */
  encounters: Encounter[];
  
  /** Player's breeding requests */
  breedingStatus: BreedingRequest[];
  
  /** Player's owned creatures */
  ownedCreatures: Creature[];
  
  /** Server timestamp */
  serverTime: number;
  
  /** Current region info */
  currentRegion?: Region;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface CaptureAttemptRequest {
  encounterId: string;
  spawnId: string;
}

export interface BreedCreaturesRequest {
  parentAId: string;
  parentBId: string;
}

export interface ListCreatureRequest {
  creatureId: string;
  price: number;
  durationHours?: number;
}

export interface PurchaseCreatureRequest {
  listingId: string;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
}

// ============================================================================
// DETERMINISTIC GENERATION TYPES
// ============================================================================

export interface GenerationConfig {
  seed: number;
  primaryAnchorId: AnchorId;
  secondaryAnchorId?: AnchorId;
  parentGenomes?: {
    parentA: GenomeSignature;
    parentB: GenomeSignature;
  };
  environmentFactors?: {
    biome: string;
    rarity: number;
  };
}

export interface GenerationResult {
  creature: Creature;
  /** Debug info for generation process */
  metadata: {
    stepsExecuted: string[];
    randomValues: number[];
    constraintsApplied: string[];
  };
}
