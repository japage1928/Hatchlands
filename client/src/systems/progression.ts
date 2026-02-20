/**
 * Creature Level Progression System
 * Handles XP gains, level progression, and stat increases
 */

import { Creature } from '@hatchlands/shared';

export const LEVEL_CONFIG = {
  BASE_XP_PER_LEVEL: 100,
  XP_MULTIPLIER_PER_LEVEL: 1.1, // Each level requires 10% more XP than previous
  MAX_LEVEL: 100,
  STAT_GAIN_PER_LEVEL: 1.5, // Stat increase per level
};

/**
 * Calculate XP required to reach the next level
 */
export function getXPRequired(currentLevel: number): number {
  return Math.floor(
    LEVEL_CONFIG.BASE_XP_PER_LEVEL *
    Math.pow(LEVEL_CONFIG.XP_MULTIPLIER_PER_LEVEL, currentLevel - 1)
  );
}

/**
 * Calculate total XP needed from level 1 to target level
 */
export function getTotalXPToLevel(targetLevel: number): number {
  let total = 0;
  for (let i = 1; i < targetLevel; i++) {
    total += getXPRequired(i);
  }
  return total;
}

/**
 * Get next level info for a creature
 */
export function getNextLevelInfo(creature: Creature) {
  const currentLevelXP = getXPRequired(creature.level);
  const totalXPToLevel = getTotalXPToLevel(creature.level);
  
  const xpInCurrentLevel = creature.xp - totalXPToLevel;
  const xpRemainingForLevel = currentLevelXP - xpInCurrentLevel;
  
  return {
    currentLevel: creature.level,
    nextLevel: creature.level + 1,
    currentLevelXP,
    totalXP: creature.xp,
    xpInCurrentLevel: Math.max(0, xpInCurrentLevel),
    xpRemainingForLevel: Math.max(0, xpRemainingForLevel),
    progressPercent: Math.min(100, (xpInCurrentLevel / currentLevelXP) * 100),
    isMaxLevel: creature.level >= LEVEL_CONFIG.MAX_LEVEL,
  };
}

/**
 * Calculate stat increases from level
 */
export function getCreatureStats(creature: Creature) {
  const levelBonus = (creature.level - 1) * LEVEL_CONFIG.STAT_GAIN_PER_LEVEL;
  
  return {
    health: Math.floor(50 + levelBonus * 5),
    attack: Math.floor(10 + levelBonus * 1.2),
    defense: Math.floor(8 + levelBonus * 1),
    speed: Math.floor(12 + levelBonus * 0.8),
    spAtk: Math.floor(9 + levelBonus * 1.1),
    spDef: Math.floor(8 + levelBonus * 1),
  };
}

/**
 * Process XP gain and handle level-ups
 */
export function addXP(
  creature: Creature,
  xpAmount: number
): { leveledUp: boolean; newLevel: number; newXP: number } {
  let newXP = creature.xp + xpAmount;
  let newLevel = creature.level;

  // Check for level ups
  while (newLevel < LEVEL_CONFIG.MAX_LEVEL) {
    const nextLevelXP = getTotalXPToLevel(newLevel + 1);
    if (newXP >= nextLevelXP) {
      newLevel++;
    } else {
      break;
    }
  }

  // Cap at max level
  if (newLevel >= LEVEL_CONFIG.MAX_LEVEL) {
    newLevel = LEVEL_CONFIG.MAX_LEVEL;
  }

  return {
    leveledUp: newLevel > creature.level,
    newLevel,
    newXP,
  };
}

/**
 * Get color/rarity based on creature generation and level
 */
export function getCreatureRarity(creature: Creature): string {
  if (creature.level >= 50) return '💎 Legendary';
  if (creature.level >= 35) return '🌟 Epic';
  if (creature.level >= 20) return '✨ Rare';
  if (creature.genomeSignature.generation > 2) return '🎨 Exotic';
  if (creature.secondaryAnchor) return '🌈 Hybrid';
  return '🌱 Common';
}

/**
 * List of activities that grant XP
 */
export const XP_REWARDS = {
  CAPTURE_WILD: 50,
  CAPTURE_RARE: 150,
  DEFEAT_WILD: 25,
  DEFEAT_PLAYER: 100,
  BREED_OFFSPRING: 200,
  DAILY_VISIT: 10,
  LEVEL_GAIN: 50, // Bonus XP when level up occurs
};
