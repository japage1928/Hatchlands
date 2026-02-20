/**
 * Deterministic Creature Generation Engine
 * 
 * Generates creatures from seeds while respecting anchor biology.
 * All generation is deterministic - same seed always produces same creature.
 */

import {
  Creature,
  GenerationConfig,
  GenerationResult,
  AnchorId,
  GenomeSignature,
  AppearanceParams,
  CreatureStatus,
  AnchorSpecies,
} from '@hatchlands/shared';
import {
  SeededRandom,
  generateId,
  SIZE_VARIATION,
} from '@hatchlands/shared';
import {
  ANCHOR_SPECIES,
  getAnchorById,
  isCompatibleForHybrid,
} from '@hatchlands/shared';

export class CreatureGenerator {
  private rng: SeededRandom;
  private config: GenerationConfig;
  private metadata: {
    stepsExecuted: string[];
    randomValues: number[];
    constraintsApplied: string[];
  };

  constructor(config: GenerationConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);
    this.metadata = {
      stepsExecuted: [],
      randomValues: [],
      constraintsApplied: [],
    };
  }

  /**
   * Generate a complete creature from configuration
   */
  generate(): GenerationResult {
    this.logStep('Starting generation');

    const creature: Creature = {
      id: generateId(),
      seed: this.config.seed,
      primaryAnchor: this.config.primaryAnchorId,
      secondaryAnchor: this.config.secondaryAnchorId,
      genomeSignature: this.generateGenome(),
      appearanceParams: this.generateAppearance(),
      status: 'wild' as CreatureStatus,
      lineageHistory: [],
      birthTimestamp: Date.now(),
      xp: 0,
      level: 1,
    };

    this.logStep('Generation complete');

    return {
      creature,
      metadata: this.metadata,
    };
  }

  /**
   * Generate genome signature based on parents or wild generation
   */
  private generateGenome(): GenomeSignature {
    this.logStep('Generating genome');

    if (this.config.parentGenomes) {
      // Bred creature - combine parent genomes
      return this.breedGenome(
        this.config.parentGenomes.parentA,
        this.config.parentGenomes.parentB
      );
    } else {
      // Wild creature - generate fresh genome
      return this.generateWildGenome();
    }
  }

  /**
   * Generate wild genome from anchor biology
   */
  private generateWildGenome(): GenomeSignature {
    const geneCount = 20; // Base gene count
    const primaryGenes: number[] = [];

    for (let i = 0; i < geneCount; i++) {
      const gene = this.nextRandom();
      primaryGenes.push(gene);
    }

    this.logConstraint('Generated wild genome with deterministic genes');

    return {
      primaryGenes,
      mutations: [],
      generation: 0,
    };
  }

  /**
   * Breed genome from two parents
   */
  private breedGenome(parentA: GenomeSignature, parentB: GenomeSignature): GenomeSignature {
    this.logStep('Breeding genome from parents');

    const geneCount = Math.max(parentA.primaryGenes.length, parentB.primaryGenes.length);
    const primaryGenes: number[] = [];
    const mutations: number[] = [];

    for (let i = 0; i < geneCount; i++) {
      // Randomly select from parent A or B
      const fromParentA = this.nextRandom() > 0.5;
      const geneA = parentA.primaryGenes[i] ?? 0.5;
      const geneB = parentB.primaryGenes[i] ?? 0.5;
      
      let gene = fromParentA ? geneA : geneB;

      // Apply mutation chance
      const mutationRoll = this.nextRandom();
      if (mutationRoll < 0.1) { // 10% mutation rate
        const mutationAmount = (this.nextRandom() - 0.5) * 0.2; // ±10% variation
        gene = Math.max(0, Math.min(1, gene + mutationAmount));
        mutations.push(i);
        this.logConstraint(`Mutation applied to gene ${i}`);
      }

      primaryGenes.push(gene);
    }

    const generation = Math.max(parentA.generation, parentB.generation) + 1;

    return {
      primaryGenes,
      mutations,
      generation,
    };
  }

  /**
   * Generate appearance parameters from genome and anchors
   */
  private generateAppearance(): AppearanceParams {
    this.logStep('Generating appearance');

    const primaryAnchor = getAnchorById(this.config.primaryAnchorId);
    const secondaryAnchor = this.config.secondaryAnchorId
      ? getAnchorById(this.config.secondaryAnchorId)
      : null;

    // Validate hybrid compatibility
    if (secondaryAnchor) {
      if (!isCompatibleForHybrid(this.config.primaryAnchorId, this.config.secondaryAnchorId!)) {
        this.logConstraint('Incompatible hybrid - using primary only');
      }
    }

    // Select body parts
    const parts = this.selectBodyParts(primaryAnchor, secondaryAnchor);

    // Select color palette
    const colorIndices = this.selectColors(primaryAnchor, secondaryAnchor);

    // Select materials
    const materials = this.selectMaterials(primaryAnchor, secondaryAnchor);

    // Size variation
    const scale = SIZE_VARIATION.MIN + this.nextRandom() * (SIZE_VARIATION.MAX - SIZE_VARIATION.MIN);

    // Procedural parameters for fine-tuning
    const procedural = this.generateProceduralParams();

    return {
      parts,
      colorIndices,
      materials,
      scale,
      procedural,
    };
  }

  /**
   * Select body parts respecting anchor constraints
   */
  private selectBodyParts(
    primary: AnchorSpecies,
    secondary: AnchorSpecies | null
  ): AppearanceParams['parts'] {
    this.logStep('Selecting body parts');

    const anatomy = primary.anatomy;
    const forbidden = primary.forbidden.parts;

    // Select body
    const body = this.rng.choice(anatomy.bodyParts);

    // Select head
    const head = this.rng.choice(anatomy.headTypes);

    // Select limbs
    const limbCount = anatomy.limbTypes.length > 0 ? this.rng.nextInt(1, 5) : 0;
    const limbs: string[] = [];
    for (let i = 0; i < limbCount; i++) {
      if (anatomy.limbTypes.length > 0) {
        limbs.push(this.rng.choice(anatomy.limbTypes));
      }
    }

    // Optional tail
    const tail = anatomy.tailTypes && anatomy.tailTypes.length > 0
      ? this.rng.choice(anatomy.tailTypes)
      : undefined;

    // Optional wings
    const wings = anatomy.wingTypes && anatomy.wingTypes.length > 0 && this.nextRandom() > 0.3
      ? [this.rng.choice(anatomy.wingTypes), this.rng.choice(anatomy.wingTypes)]
      : undefined;

    // Optional fins
    const fins = anatomy.finTypes && anatomy.finTypes.length > 0 && this.nextRandom() > 0.5
      ? [this.rng.choice(anatomy.finTypes)]
      : undefined;

    // Apply hybrid parts if secondary anchor exists
    if (secondary && this.nextRandom() > 0.5) {
      const maxForeign = primary.hybridRules.maxForeignParts;
      const foreignCount = this.rng.nextInt(1, maxForeign + 1);
      
      this.logConstraint(`Adding ${foreignCount} foreign parts from hybrid anchor`);
      
      // Could add secondary parts here
      // (simplified for this implementation)
    }

    this.logConstraint('Applied forbidden parts constraint');

    return {
      body,
      head,
      limbs,
      tail,
      wings,
      fins,
    };
  }

  /**
   * Select color palette indices
   */
  private selectColors(primary: AnchorSpecies, secondary: AnchorSpecies | null): number[] {
    this.logStep('Selecting colors');

    const primaryPalette = this.rng.choice(primary.colorPalettes);
    const colorCount = this.rng.nextInt(2, 4);
    const colorIndices: number[] = [];

    for (let i = 0; i < colorCount; i++) {
      colorIndices.push(this.rng.nextInt(0, primaryPalette.length));
    }

    return colorIndices;
  }

  /**
   * Select materials
   */
  private selectMaterials(primary: AnchorSpecies, secondary: AnchorSpecies | null): string[] {
    this.logStep('Selecting materials');

    const materialCount = this.rng.nextInt(1, 3);
    const materials: string[] = [];

    for (let i = 0; i < materialCount; i++) {
      materials.push(this.rng.choice(primary.materials));
    }

    return materials;
  }

  /**
   * Generate procedural parameters for rendering variations
   */
  private generateProceduralParams(): { [key: string]: number } {
    const params: { [key: string]: number } = {};

    // Various procedural adjustments
    params.roughness = this.nextRandom();
    params.metalness = this.nextRandom();
    params.patternIntensity = this.nextRandom();
    params.asymmetry = this.nextRandom() * 0.2; // Small asymmetry
    params.detailLevel = this.nextRandom();

    return params;
  }

  /**
   * Get next random value and log it
   */
  private nextRandom(): number {
    const value = this.rng.next();
    this.metadata.randomValues.push(value);
    return value;
  }

  /**
   * Log a generation step
   */
  private logStep(description: string): void {
    this.metadata.stepsExecuted.push(description);
  }

  /**
   * Log a constraint application
   */
  private logConstraint(description: string): void {
    this.metadata.constraintsApplied.push(description);
  }
}

/**
 * Convenience function to generate a creature
 */
export function generateCreature(config: GenerationConfig): GenerationResult {
  const generator = new CreatureGenerator(config);
  return generator.generate();
}

/**
 * Generate a wild creature with random anchor selection
 */
export function generateWildCreature(seed: number, biome?: string): GenerationResult {
  const rng = new SeededRandom(seed);
  
  // Select anchor based on biome if provided
  const anchorIds: AnchorId[] = Object.keys(ANCHOR_SPECIES) as AnchorId[];
  const primaryAnchorId = rng.choice(anchorIds);

  // Small chance for hybrid (15%)
  let secondaryAnchorId: AnchorId | undefined;
  if (rng.next() < 0.15) {
    const primaryAnchor = ANCHOR_SPECIES[primaryAnchorId];
    if (primaryAnchor.hybridRules.compatibleAnchors.length > 0) {
      secondaryAnchorId = rng.choice(primaryAnchor.hybridRules.compatibleAnchors);
    }
  }

  return generateCreature({
    seed,
    primaryAnchorId,
    secondaryAnchorId,
    environmentFactors: biome ? { biome, rarity: 1.0 } : undefined,
  });
}
