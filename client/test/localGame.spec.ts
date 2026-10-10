import { describe, expect, it } from 'vitest';
import {
  LocalGame,
  OFFLINE_RULES,
  SAVE_KEY,
  SAVE_VERSION,
  StorageLike,
  generateSpawnsForWindow,
  getCaptureChance,
  getReleaseReward,
} from '../src/local/LocalGame';

const HOUR = OFFLINE_RULES.spawnWindowMs;
const T0 = Date.UTC(2026, 9, 9, 12, 5, 0);

function memStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

function setup(seed = 42) {
  const storage = memStorage();
  let t = T0;
  const clock = { get: () => t, set: (v: number) => (t = v), add: (ms: number) => (t += ms) };
  const game = new LocalGame(storage, clock.get, () => seed);
  return { storage, clock, game };
}

/** Try every spawn until one capture succeeds (deterministic for a given seed). */
function catchOne(game: LocalGame): string {
  for (let guard = 0; guard < 200; guard++) {
    const spawn = game.getWorld().spawns[0];
    if (!spawn) throw new Error('no spawns left');
    const enc = game.startEncounter(spawn.id);
    for (let i = 0; i < 10; i++) {
      const r = game.capture({ encounterId: enc.id, spawnId: spawn.id });
      if (r.success) return r.creatureId!;
    }
    game.flee(enc.id);
  }
  throw new Error('never caught anything');
}

describe('new game + save/load', () => {
  it('starts with 1000 coins and one starter creature, saved under a versioned key', () => {
    const { game, storage } = setup();
    const w = game.getWorld();
    expect(w.currency).toBe(1000);
    expect(w.creatures).toHaveLength(1);
    expect(w.creatures[0].status).toBe('captured');
    expect(OFFLINE_RULES.starterAnchors).toContain(w.creatures[0].primaryAnchor);
    const saved = JSON.parse(storage.getItem(SAVE_KEY)!);
    expect(saved.version).toBe(SAVE_VERSION);
  });

  it('reloads the same state from storage', () => {
    const { game, storage, clock } = setup();
    const id = catchOne(game);
    const before = game.getWorld();
    const reloaded = new LocalGame(storage, clock.get, () => 999);
    const after = reloaded.getWorld();
    expect(after.currency).toBe(before.currency);
    expect(after.creatures.map((c) => c.id)).toEqual(before.creatures.map((c) => c.id));
    expect(after.creatures.some((c) => c.id === id)).toBe(true);
    expect(after.spawns.map((s) => s.id)).toEqual(before.spawns.map((s) => s.id));
  });

  it('ignores corrupt or wrong-version saves and starts fresh', () => {
    const storage = memStorage();
    storage.setItem(SAVE_KEY, '{not json');
    expect(new LocalGame(storage, () => T0, () => 1).getWorld().currency).toBe(1000);
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 999, creatures: [] }));
    expect(new LocalGame(storage, () => T0, () => 1).getWorld().creatures).toHaveLength(1);
  });
});

describe('spawns', () => {
  it('are deterministic for the same seed and hour, 3-5 per window', () => {
    const w = Math.floor(T0 / HOUR) * HOUR;
    const a = generateSpawnsForWindow(7, w);
    const b = generateSpawnsForWindow(7, w);
    expect(a.map((s) => s.creature.genomeSignature)).toEqual(b.map((s) => s.creature.genomeSignature));
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
    for (let h = 0; h < 48; h++) {
      const n = generateSpawnsForWindow(7, w + h * HOUR).length;
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  it('differ between hours and refresh when the hour changes', () => {
    const { game, clock } = setup();
    const first = game.getWorld().spawns.map((s) => s.id);
    clock.add(10 * 60 * 1000); // same hour
    expect(game.getWorld().spawns.map((s) => s.id)).toEqual(first);
    clock.add(HOUR);
    const next = game.getWorld();
    expect(next.spawns.map((s) => s.id)).not.toEqual(first);
    expect(next.nextSpawnRefreshAt).toBeGreaterThan(clock.get());
  });
});

describe('capture', () => {
  it('chance depends on rarity/level and stays within 10-90%', () => {
    const w = Math.floor(T0 / HOUR) * HOUR;
    for (let h = 0; h < 24; h++) {
      for (const s of generateSpawnsForWindow(3, w + h * HOUR)) {
        const c = getCaptureChance(s.creature);
        expect(c).toBeGreaterThanOrEqual(0.1);
        expect(c).toBeLessThanOrEqual(0.9);
        const higher = getCaptureChance({ ...s.creature, level: s.creature.level + 5 });
        expect(higher).toBeLessThanOrEqual(c);
      }
    }
  });

  it('costs 50 per attempt and moves the creature into the collection on success', () => {
    const { game } = setup();
    const start = game.getWorld();
    const id = catchOne(game);
    const after = game.getWorld();
    const attempts = (start.currency - after.currency) / OFFLINE_RULES.captureCost;
    expect(Number.isInteger(attempts)).toBe(true);
    expect(attempts).toBeGreaterThanOrEqual(1);
    expect(after.creatures.find((c) => c.id === id)?.status).toBe('captured');
    expect(after.spawns.some((s) => s.creature.id === id)).toBe(false);
  });

  it('is deterministic for the same save (reloading cannot reroll)', () => {
    const run = () => {
      const { game } = setup(1234);
      const spawn = game.getWorld().spawns[0];
      const enc = game.startEncounter(spawn.id);
      const results: boolean[] = [];
      for (let i = 0; i < 10 && !results.includes(true); i++) {
        results.push(game.capture({ encounterId: enc.id, spawnId: spawn.id }).success);
      }
      return results;
    };
    expect(run()).toEqual(run());
  });

  it('refuses when out of coins', () => {
    const { storage, clock } = setup();
    const save = JSON.parse(storage.getItem(SAVE_KEY)!);
    save.currency = 10;
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    const g = new LocalGame(storage, clock.get);
    const spawn = g.getWorld().spawns[0];
    const enc = g.startEncounter(spawn.id);
    expect(() => g.capture({ encounterId: enc.id, spawnId: spawn.id })).toThrow(/Not enough coins/);
  });
});

describe('breeding', () => {
  it('costs 200, locks parents, and hatches an offspring after the short timer', () => {
    const { game, clock } = setup();
    catchOne(game);
    const [a, b] = game.getWorld().creatures;
    const coins = game.getWorld().currency;
    const req = game.startBreeding({ parentAId: a.id, parentBId: b.id });
    expect(req.completesAt - req.startedAt).toBe(OFFLINE_RULES.breedingDurationMs);
    expect(req.completesAt - req.startedAt).toBeLessThanOrEqual(5 * 60 * 1000);
    let w = game.getWorld();
    expect(w.currency).toBe(coins - 200);
    expect(w.creatures.filter((c) => c.status === 'breeding')).toHaveLength(2);
    expect(() => game.startBreeding({ parentAId: a.id, parentBId: b.id })).toThrow(/busy/);
    expect(() => game.completeBreeding(req.id)).toThrow(/not ready/);

    clock.add(OFFLINE_RULES.breedingDurationMs);
    const baby = game.completeBreeding(req.id);
    w = game.getWorld();
    expect(w.creatures).toHaveLength(3);
    expect(w.breeding).toHaveLength(0);
    expect(w.creatures.every((c) => c.status === 'captured')).toBe(true);
    expect(baby.lineageHistory[0]).toMatchObject({ parentA: a.id, parentB: b.id });
    expect(baby.genomeSignature.generation).toBe(Math.max(a.genomeSignature.generation, b.genomeSignature.generation) + 1);
  });
});

describe('earning coins', () => {
  it('release pays out by level and keeps at least one creature', () => {
    const { game } = setup();
    const [starter] = game.getWorld().creatures;
    expect(() => game.releaseCreature(starter.id)).toThrow(/at least one/);
    const id = catchOne(game);
    const caught = game.getWorld().creatures.find((c) => c.id === id)!;
    const coins = game.getWorld().currency;
    expect(game.releaseCreature(id)).toBe(getReleaseReward(caught));
    expect(game.getWorld().currency).toBe(coins + getReleaseReward(caught));
  });

  it('daily bonus can be claimed once per day', () => {
    const { game, clock } = setup();
    expect(game.getWorld().dailyBonusAvailable).toBe(true);
    expect(game.claimDailyBonus()).toBe(OFFLINE_RULES.dailyBonus);
    expect(() => game.claimDailyBonus()).toThrow(/already/);
    clock.add(24 * HOUR);
    expect(game.getWorld().dailyBonusAvailable).toBe(true);
  });
});
