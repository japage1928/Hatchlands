import { LocalGame, StorageLike } from './LocalGame';

const memoryStorage = (): StorageLike => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

const pickStorage = (): StorageLike => {
  try {
    const probe = '__hatchlands_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return memoryStorage(); // private mode etc.: playable, but not saved
  }
};

/** The single offline game instance used by the UI. */
export const game = new LocalGame(pickStorage());
