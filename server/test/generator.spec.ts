import { describe, expect, it } from 'vitest';
import {
  ANCHOR_SPECIES,
  hashString,
  isCompatibleForHybrid,
  SeededRandom,
  type AnchorId,
} from '@hatchlands/shared';
import { CreatureGenerator, generateWildCreature } from '../src/engines/generator';

const anchorIds = Object.keys(ANCHOR_SPECIES) as AnchorId[];

describe('SeededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new SeededRandom(1234);
    const b = new SeededRandom(1234);
    expect(Array.from({ length: 10 }, () => a.next())).toEqual(
      Array.from({ length: 10 }, () => b.next()),
    );
  });
});

describe('CreatureGenerator (deterministic)', () => {
  const config = {
    seed: hashString('test-seed-dragon-123'),
    primaryAnchorId: 'dragon' as const,
    generation: 0,
  };

  it('same seed -> identical genome and appearance', () => {
    const a = new CreatureGenerator(config).generate().creature;
    const b = new CreatureGenerator(config).generate().creature;
    expect(a.primaryAnchor).toBe(b.primaryAnchor);
    expect(a.genomeSignature).toEqual(b.genomeSignature);
    expect(a.appearanceParams).toEqual(b.appearanceParams);
  });

  it('different seeds -> different genomes', () => {
    const a = new CreatureGenerator(config).generate().creature;
    const b = new CreatureGenerator({ ...config, seed: hashString('another-seed') }).generate().creature;
    expect(a.genomeSignature.primaryGenes).not.toEqual(b.genomeSignature.primaryGenes);
  });

  it.each(anchorIds)('generates a valid %s', (anchorId) => {
    const { creature } = new CreatureGenerator({
      seed: hashString(`test-${anchorId}`),
      primaryAnchorId: anchorId,
      generation: 0,
    }).generate();
    expect(creature.id).toBeTruthy();
    expect(creature.primaryAnchor).toBe(anchorId);
    expect(creature.genomeSignature).toBeDefined();
    expect(creature.appearanceParams).toBeDefined();
    expect(creature.level).toBe(1);
  });

  it('generateWildCreature is deterministic for a given seed', () => {
    const a = generateWildCreature(42).creature;
    const b = generateWildCreature(42).creature;
    expect(a.primaryAnchor).toBe(b.primaryAnchor);
    expect(a.secondaryAnchor).toBe(b.secondaryAnchor);
    expect(a.genomeSignature).toEqual(b.genomeSignature);
  });
});

describe('hybrid compatibility', () => {
  it('is symmetric-consistent with anchor rules for known pairs', () => {
    expect(isCompatibleForHybrid('dragon', 'serpent')).toBe(true);
    expect(isCompatibleForHybrid('dragon', 'basilisk')).toBe(false);
  });
});
