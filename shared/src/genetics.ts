/**
 * Deterministic breeding genetics engine.
 *
 * Produces offspring blueprints from parent creatures using:
 * - Gene recombination
 * - Controlled mutation
 * - Trait blending for appearance
 * - Continuous genetic stat factors
 */

import { ANCHOR_SPECIES } from './anchors';
import { SeededRandom, hashString } from './utils';
import { Creature, AnchorId, AppearanceParams, GenomeSignature } from './types';

export interface GeneticStatProfile {
  vitality: number;
  power: number;
  defense: number;
  agility: number;
  intellect: number;
  spirit: number;
}

export interface OffspringBlueprint {
  seed: number;
  primaryAnchor: AnchorId;
  secondaryAnchor?: AnchorId;
  genomeSignature: GenomeSignature;
  appearanceParams: AppearanceParams;
  geneticStats: GeneticStatProfile;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function makeGenePool(creature: Creature): number[] {
  const primary = creature.genomeSignature.primaryGenes || [];
  const secondary = creature.genomeSignature.secondaryGenes || [];
  const mutations = creature.genomeSignature.mutations || [];
  const base = [...primary, ...secondary, ...mutations];
  if (base.length > 0) return base;
  return [creature.seed % 97, creature.level * 3, Math.floor(creature.appearanceParams.scale * 100)];
}

function recombineGenes(parentA: Creature, parentB: Creature, rng: SeededRandom, length = 24): number[] {
  const poolA = makeGenePool(parentA);
  const poolB = makeGenePool(parentB);
  const result: number[] = [];

  for (let i = 0; i < length; i++) {
    const a = poolA[i % poolA.length];
    const b = poolB[(i * 3 + 1) % poolB.length];
    const blend = Math.round((a * (0.35 + rng.next() * 0.3)) + (b * (0.35 + rng.next() * 0.3)));
    const drift = Math.round((rng.next() - 0.5) * 14);
    result.push(Math.max(0, blend + drift));
  }

  return result;
}

function extractStatsFromGenes(genes: number[]): GeneticStatProfile {
  const safe = genes.length > 0 ? genes : [1];
  const sample = (index: number) => safe[index % safe.length];
  const normalize = (value: number) => clamp(value / 100, 0, 1.25);

  return {
    vitality: normalize((sample(0) + sample(6) + sample(12)) / 3),
    power: normalize((sample(1) + sample(7) + sample(13)) / 3),
    defense: normalize((sample(2) + sample(8) + sample(14)) / 3),
    agility: normalize((sample(3) + sample(9) + sample(15)) / 3),
    intellect: normalize((sample(4) + sample(10) + sample(16)) / 3),
    spirit: normalize((sample(5) + sample(11) + sample(17)) / 3),
  };
}

function blendAnchor(
  parentA: Creature,
  parentB: Creature,
  rng: SeededRandom,
): { primaryAnchor: AnchorId; secondaryAnchor?: AnchorId } {
  const primaryAnchor = rng.next() > 0.5 ? parentA.primaryAnchor : parentB.primaryAnchor;
  const otherAnchor = primaryAnchor === parentA.primaryAnchor ? parentB.primaryAnchor : parentA.primaryAnchor;
  const secondaryAnchor = primaryAnchor === otherAnchor ? undefined : otherAnchor;
  return { primaryAnchor, secondaryAnchor };
}

function blendParts(
  partA: AppearanceParams['parts'],
  partB: AppearanceParams['parts'],
  anchor: AnchorId,
  rng: SeededRandom,
): AppearanceParams['parts'] {
  const anchorAnatomy = ANCHOR_SPECIES[anchor].anatomy;
  const pick = <T>(a: T | undefined, b: T | undefined, fallback: T): T => {
    if (a !== undefined && b !== undefined) return rng.next() > 0.5 ? a : b;
    return a !== undefined ? a : b !== undefined ? b : fallback;
  };

  const limbs = [...(partA.limbs || []).slice(0, 2), ...(partB.limbs || []).slice(0, 2)]
    .filter(Boolean)
    .slice(0, 4);

  return {
    body: pick(partA.body, partB.body, anchorAnatomy.bodyParts[0] || 'scaled_body'),
    head: pick(partA.head, partB.head, anchorAnatomy.headTypes[0] || 'horned_head'),
    limbs: limbs.length > 0 ? limbs : ['clawed_legs', 'clawed_legs'],
    tail: pick(partA.tail, partB.tail, anchorAnatomy.tailTypes[0]),
    wings: (() => {
      const combined = [...(partA.wings || []).slice(0, 1), ...(partB.wings || []).slice(0, 1)];
      return combined.length > 0 ? combined : undefined;
    })(),
    fins: (() => {
      const combined = [...(partA.fins || []).slice(0, 1), ...(partB.fins || []).slice(0, 1)];
      return combined.length > 0 ? combined : undefined;
    })(),
  };
}

function buildMutationVector(genes: number[], rng: SeededRandom): number[] {
  const mutationCount = 1 + Math.floor(rng.next() * 3);
  const mutations: number[] = [];
  for (let i = 0; i < mutationCount; i++) {
    const base = genes[(i * 5 + 2) % genes.length] || 0;
    mutations.push(Math.max(0, base + Math.round((rng.next() - 0.5) * 24)));
  }
  return mutations;
}

export function deriveOffspringSeed(parentA: Creature, parentB: Creature, nonce: number = 0): number {
  const raw = `${parentA.id}:${parentA.seed}|${parentB.id}:${parentB.seed}|${nonce}`;
  return hashString(raw);
}

export function predictOffspringBlueprint(
  parentA: Creature,
  parentB: Creature,
  seed: number,
): OffspringBlueprint {
  const rng = new SeededRandom(seed);
  const genes = recombineGenes(parentA, parentB, rng);
  const anchorBlend = blendAnchor(parentA, parentB, rng);
  const mutations = buildMutationVector(genes, rng);
  const genome: GenomeSignature = {
    primaryGenes: genes.slice(0, 12),
    secondaryGenes: genes.slice(12, 24),
    mutations,
    generation: Math.max(parentA.genomeSignature.generation, parentB.genomeSignature.generation) + 1,
  };

  const baseStats = extractStatsFromGenes(genes);

  const colorA = parentA.appearanceParams.colorIndices || [0, 1, 2];
  const colorB = parentB.appearanceParams.colorIndices || [0, 1, 2];

  const appearanceParams: AppearanceParams = {
    parts: blendParts(parentA.appearanceParams.parts, parentB.appearanceParams.parts, anchorBlend.primaryAnchor, rng),
    colorIndices: [
      colorA[0] ?? 0,
      colorB[1] ?? colorA[1] ?? 1,
      ((colorA[2] ?? 2) + (colorB[2] ?? 2) + Math.floor(baseStats.spirit * 3)) % 3,
    ],
    materials: [...new Set([...(parentA.appearanceParams.materials || []), ...(parentB.appearanceParams.materials || [])])].slice(0, 4),
    scale: clamp(
      ((parentA.appearanceParams.scale + parentB.appearanceParams.scale) / 2) + (baseStats.vitality - 0.5) * 0.16,
      0.78,
      1.26,
    ),
    procedural: {
      roughness: clamp(((parentA.appearanceParams.procedural.roughness || 0.5) + (parentB.appearanceParams.procedural.roughness || 0.5)) / 2, 0.12, 0.92),
      metalness: clamp(((parentA.appearanceParams.procedural.metalness || 0.1) + (parentB.appearanceParams.procedural.metalness || 0.1)) / 2, 0, 0.85),
      geneVitality: baseStats.vitality,
      genePower: baseStats.power,
      geneDefense: baseStats.defense,
      geneAgility: baseStats.agility,
      geneIntellect: baseStats.intellect,
      geneSpirit: baseStats.spirit,
    },
  };

  return {
    seed,
    primaryAnchor: anchorBlend.primaryAnchor,
    secondaryAnchor: anchorBlend.secondaryAnchor,
    genomeSignature: genome,
    appearanceParams,
    geneticStats: baseStats,
  };
}
