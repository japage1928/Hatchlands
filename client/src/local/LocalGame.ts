/**
 * Offline single-player game service.
 *
 * Mirrors the calls the UI used to make against the server (load world,
 * start encounter, capture, flee, start/finish breeding) but keeps all state
 * in a versioned localStorage save. No backend, no GPS.
 */
import {
  ANCHOR_SPECIES,
  AnchorId,
  BreedingRequest,
  Creature,
  Encounter,
  SeededRandom,
  Spawn,
  generateCreature,
  generateWildCreature,
  hashString,
  deriveOffspringSeed,
  predictOffspringBlueprint,
} from '@hatchlands/shared';

export const SAVE_KEY = 'hatchlands.save';
export const SAVE_VERSION = 1;

export const OFFLINE_RULES = {
  startingCurrency: 1000,
  captureCost: 50,
  breedingCost: 200,
  breedingDurationMs: 3 * 60 * 1000,
  spawnWindowMs: 60 * 60 * 1000,
  minSpawns: 3,
  maxSpawns: 5,
  encounterDurationMs: 5 * 60 * 1000,
  dailyBonus: 250,
  releaseBase: 25,
  releasePerLevel: 10,
  starterAnchors: ['dragon', 'serpent', 'phoenix'] as AnchorId[],
};

export const PLAYER_ID = 'local-player';

export interface SaveData {
  version: number;
  /** Per-save world seed; drives spawns and capture rolls. */
  seed: number;
  createdAt: number;
  currency: number;
  creatures: Creature[];
  spawns: Spawn[];
  spawnWindowStart: number;
  breeding: BreedingRequest[];
  encounter: (Encounter & { attempts: number }) | null;
  lastDailyBonusDay: string | null;
  stats: { captured: number; bred: number; released: number };
}

export interface WorldState {
  currency: number;
  creatures: Creature[];
  spawns: Spawn[];
  breeding: BreedingRequest[];
  spawnWindowStart: number;
  nextSpawnRefreshAt: number;
  dailyBonusAvailable: boolean;
  stats: SaveData['stats'];
}

export interface CaptureResult {
  success: boolean;
  chance: number;
  currency: number;
  creatureId?: string;
  message: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class GameError extends Error {}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Capture chance (0-1) from species rarity, level and hybrid status. Common, low-level creatures are easiest. */
export function getCaptureChance(creature: Creature): number {
  const rarity = ANCHOR_SPECIES[creature.primaryAnchor]?.rarity ?? 0.05; // 0.02 (rare) .. 0.15 (common)
  let chance = 0.4 + rarity * 3; // 0.46 .. 0.85
  chance -= (creature.level - 1) * 0.03;
  if (creature.secondaryAnchor) chance -= 0.1;
  return Math.round(clamp(chance, 0.1, 0.9) * 100) / 100;
}

export function getReleaseReward(creature: Creature): number {
  return OFFLINE_RULES.releaseBase + OFFLINE_RULES.releasePerLevel * creature.level;
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** Deterministic spawns for one hourly window of one save. */
export function generateSpawnsForWindow(saveSeed: number, windowStart: number): Spawn[] {
  const rng = new SeededRandom(hashString(`${saveSeed}-${windowStart}`));
  const count = rng.nextInt(OFFLINE_RULES.minSpawns, OFFLINE_RULES.maxSpawns + 1);
  const spawns: Spawn[] = [];
  for (let i = 0; i < count; i++) {
    const seed = hashString(`${saveSeed}-${windowStart}-${i}`);
    const creature = generateWildCreature(seed).creature;
    creature.id = `wild-${seed}`;
    creature.level = 1 + new SeededRandom(seed ^ 0x5bd1e995).nextInt(0, 10);
    creature.xp = (creature.level - 1) * 100;
    creature.birthTimestamp = windowStart;
    spawns.push({
      id: `spawn-${windowStart}-${i}`,
      seed,
      regionId: 'local',
      timeWindow: { start: windowStart, end: windowStart + OFFLINE_RULES.spawnWindowMs },
      creature,
      spawnedAt: windowStart,
      expiresAt: windowStart + OFFLINE_RULES.spawnWindowMs,
      locked: false,
    });
  }
  return spawns;
}

export class LocalGame {
  private save: SaveData;

  constructor(
    private storage: StorageLike,
    private now: () => number = () => Date.now(),
    newSeed: () => number = () => Math.floor(Math.random() * 0x7fffffff),
  ) {
    this.save = this.load() ?? this.createSave(newSeed());
    this.refresh();
  }

  // ---------------------------------------------------------------- save/load
  private load(): SaveData | null {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as SaveData;
      if (data?.version !== SAVE_VERSION || !Array.isArray(data.creatures)) return null; // future: migrate
      return data;
    } catch {
      return null;
    }
  }

  private persist(): void {
    this.storage.setItem(SAVE_KEY, JSON.stringify(this.save));
  }

  private createSave(seed: number): SaveData {
    const t = this.now();
    const rng = new SeededRandom(seed);
    const anchor = rng.choice(OFFLINE_RULES.starterAnchors);
    const starter = generateCreature({ seed: hashString(`starter-${seed}`), primaryAnchorId: anchor }).creature;
    Object.assign(starter, {
      id: `starter-${seed}`,
      status: 'captured',
      ownerId: PLAYER_ID,
      capturedAt: t,
      birthTimestamp: t,
      level: 3,
      xp: 200,
      nickname: 'Starter',
    });
    return {
      version: SAVE_VERSION,
      seed,
      createdAt: t,
      currency: OFFLINE_RULES.startingCurrency,
      creatures: [starter],
      spawns: [],
      spawnWindowStart: -1,
      breeding: [],
      encounter: null,
      lastDailyBonusDay: null,
      stats: { captured: 0, bred: 0, released: 0 },
    };
  }

  /** Roll spawns over on hour change and expire stale encounters. */
  private refresh(): void {
    const t = this.now();
    const windowStart = Math.floor(t / OFFLINE_RULES.spawnWindowMs) * OFFLINE_RULES.spawnWindowMs;
    if (windowStart !== this.save.spawnWindowStart) {
      this.save.spawnWindowStart = windowStart;
      this.save.spawns = generateSpawnsForWindow(this.save.seed, windowStart);
      this.save.encounter = null;
    }
    if (this.save.encounter && this.save.encounter.expiresAt <= t) this.save.encounter = null;
    this.persist();
  }

  // ---------------------------------------------------------------- queries
  getWorld(): WorldState {
    this.refresh();
    const s = this.save;
    return {
      currency: s.currency,
      creatures: [...s.creatures],
      spawns: [...s.spawns],
      breeding: [...s.breeding],
      spawnWindowStart: s.spawnWindowStart,
      nextSpawnRefreshAt: s.spawnWindowStart + OFFLINE_RULES.spawnWindowMs,
      dailyBonusAvailable: s.lastDailyBonusDay !== dayKey(this.now()),
      stats: { ...s.stats },
    };
  }

  getSave(): SaveData {
    return JSON.parse(JSON.stringify(this.save));
  }

  // ---------------------------------------------------------------- encounters
  startEncounter(spawnId: string): Encounter & { captureChance: number } {
    this.refresh();
    const spawn = this.save.spawns.find((s) => s.id === spawnId);
    if (!spawn) throw new GameError('That creature has moved on.');
    const t = this.now();
    const encounter = {
      id: `enc-${spawnId}-${t}`,
      playerId: PLAYER_ID,
      spawnId,
      creatureId: spawn.creature.id,
      startedAt: t,
      expiresAt: t + OFFLINE_RULES.encounterDurationMs,
      resolved: false,
      attempts: 0,
    };
    this.save.encounter = encounter;
    this.persist();
    return { ...encounter, captureChance: getCaptureChance(spawn.creature) };
  }

  capture(request: { encounterId: string; spawnId: string }): CaptureResult {
    this.refresh();
    const enc = this.save.encounter;
    if (!enc || enc.id !== request.encounterId || enc.spawnId !== request.spawnId) {
      throw new GameError('This encounter has ended.');
    }
    const spawn = this.save.spawns.find((s) => s.id === request.spawnId);
    if (!spawn) throw new GameError('That creature has moved on.');
    if (this.save.currency < OFFLINE_RULES.captureCost) {
      throw new GameError(`Not enough coins (capture costs ${OFFLINE_RULES.captureCost}).`);
    }

    this.save.currency -= OFFLINE_RULES.captureCost;
    enc.attempts += 1;
    const chance = getCaptureChance(spawn.creature);
    // Deterministic per save + spawn + attempt number, so reloading can't reroll.
    const roll = new SeededRandom(hashString(`${this.save.seed}-${spawn.id}-${enc.attempts}`)).next();
    const success = roll < chance;

    if (success) {
      const creature: Creature = {
        ...spawn.creature,
        status: 'captured',
        ownerId: PLAYER_ID,
        capturedAt: this.now(),
      };
      this.save.creatures.unshift(creature);
      this.save.spawns = this.save.spawns.filter((s) => s.id !== spawn.id);
      this.save.encounter = null;
      this.save.stats.captured += 1;
    }
    this.persist();
    return {
      success,
      chance,
      currency: this.save.currency,
      creatureId: success ? spawn.creature.id : undefined,
      message: success ? 'You caught the creature!' : 'The creature escaped! Try again or flee.',
    };
  }

  flee(encounterId: string): void {
    if (this.save.encounter?.id === encounterId) {
      this.save.encounter = null;
      this.persist();
    }
  }

  // ---------------------------------------------------------------- breeding
  startBreeding(request: { parentAId: string; parentBId: string }): BreedingRequest {
    this.refresh();
    const { parentAId, parentBId } = request;
    if (parentAId === parentBId) throw new GameError('Pick two different creatures.');
    const a = this.save.creatures.find((c) => c.id === parentAId);
    const b = this.save.creatures.find((c) => c.id === parentBId);
    if (!a || !b) throw new GameError('Creature not found.');
    if (a.status !== 'captured' || b.status !== 'captured') throw new GameError('One of these creatures is busy.');
    if (this.save.currency < OFFLINE_RULES.breedingCost) {
      throw new GameError(`Not enough coins (breeding costs ${OFFLINE_RULES.breedingCost}).`);
    }
    const t = this.now();
    this.save.currency -= OFFLINE_RULES.breedingCost;
    a.status = 'breeding';
    b.status = 'breeding';
    const req: BreedingRequest = {
      id: `breed-${t}-${this.save.breeding.length}`,
      parentAId,
      parentBId,
      playerId: PLAYER_ID,
      breedingSeed: deriveOffspringSeed(a, b, t),
      startedAt: t,
      completesAt: t + OFFLINE_RULES.breedingDurationMs,
      completed: false,
    };
    this.save.breeding.push(req);
    this.persist();
    return req;
  }

  completeBreeding(breedingId: string): Creature {
    const req = this.save.breeding.find((r) => r.id === breedingId);
    if (!req || req.completed) throw new GameError('Breeding not found.');
    if (this.now() < req.completesAt) throw new GameError('The egg is not ready yet.');
    const a = this.save.creatures.find((c) => c.id === req.parentAId);
    const b = this.save.creatures.find((c) => c.id === req.parentBId);
    if (!a || !b) throw new GameError('Parent creature missing.');

    const bp = predictOffspringBlueprint(a, b, req.breedingSeed);
    const t = this.now();
    const id = `bred-${req.breedingSeed}-${req.id}`;
    const offspring: Creature = {
      id,
      seed: bp.seed,
      primaryAnchor: bp.primaryAnchor,
      secondaryAnchor: bp.secondaryAnchor,
      genomeSignature: bp.genomeSignature,
      appearanceParams: bp.appearanceParams,
      ownerId: PLAYER_ID,
      status: 'captured',
      lineageHistory: [
        { creatureId: id, generation: bp.genomeSignature.generation, timestamp: t, parentA: a.id, parentB: b.id },
      ],
      capturedAt: t,
      birthTimestamp: t,
      xp: 0,
      level: 1,
    };
    a.status = 'captured';
    b.status = 'captured';
    req.completed = true;
    req.offspringId = id;
    this.save.breeding = this.save.breeding.filter((r) => r.id !== req.id);
    this.save.creatures.unshift(offspring);
    this.save.stats.bred += 1;
    this.persist();
    return offspring;
  }

  // ---------------------------------------------------------------- economy
  releaseCreature(creatureId: string): number {
    const c = this.save.creatures.find((x) => x.id === creatureId);
    if (!c) throw new GameError('Creature not found.');
    if (c.status !== 'captured') throw new GameError('This creature is busy.');
    if (this.save.creatures.length <= 1) throw new GameError('You must keep at least one creature.');
    const reward = getReleaseReward(c);
    this.save.creatures = this.save.creatures.filter((x) => x.id !== creatureId);
    this.save.currency += reward;
    this.save.stats.released += 1;
    this.persist();
    return reward;
  }

  claimDailyBonus(): number {
    const today = dayKey(this.now());
    if (this.save.lastDailyBonusDay === today) throw new GameError('Daily bonus already claimed today.');
    this.save.lastDailyBonusDay = today;
    this.save.currency += OFFLINE_RULES.dailyBonus;
    this.persist();
    return OFFLINE_RULES.dailyBonus;
  }

  /** Wipe the save and start over. */
  reset(newSeed: number = Math.floor(Math.random() * 0x7fffffff)): void {
    this.storage.removeItem(SAVE_KEY);
    this.save = this.createSave(newSeed);
    this.refresh();
  }
}
