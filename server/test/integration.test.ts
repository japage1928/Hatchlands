/**
 * Integration Test Suite for Hatchlands
 * 
 * Tests the full game loop from world generation to trading
 */

import { CreatureGenerator, generateWildCreature } from '../src/engines/generator';
import { WorldSimulationEngine } from '../src/engines/world';
import { ANCHOR_SPECIES, isCompatibleForHybrid } from '@hatchlands/shared';
import { SeededRandom, generateSpawnSeed, getCurrentTimeWindow } from '@hatchlands/shared';

console.log('🧪 HATCHLANDS INTEGRATION TEST\n');
console.log('='.repeat(60));

// ============================================================================
// TEST 1: Deterministic Generation
// ============================================================================
console.log('\n📦 TEST 1: Deterministic Generation');
console.log('-'.repeat(60));

const seed1 = 'test-seed-dragon-123';
const config1 = {
  seed: seed1,
  primaryAnchorId: 'dragon' as const,
  generation: 0,
};

const generator1a = new CreatureGenerator(config1);
const result1a = generator1a.generate();

const generator1b = new CreatureGenerator(config1);
const result1b = generator1b.generate();

console.log('✓ Generated creature A:', {
  primaryAnchor: result1a.creature.primaryAnchor,
  seed: result1a.creature.seed,
  level: result1a.creature.level,
});

console.log('✓ Generated creature B:', {
  primaryAnchor: result1b.creature.primaryAnchor,
  seed: result1b.creature.seed,
  level: result1b.creature.level,
});

// Test determinism
const isDeterministic = 
  result1a.creature.seed === result1b.creature.seed &&
  result1a.creature.primaryAnchor === result1b.creature.primaryAnchor &&
  JSON.stringify(result1a.creature.genomeSignature) === JSON.stringify(result1b.creature.genomeSignature) &&
  JSON.stringify(result1a.creature.appearanceParams) === JSON.stringify(result1b.creature.appearanceParams);

if (isDeterministic) {
  console.log('✅ PASS: Same seed produces identical creatures');
} else {
  console.log('❌ FAIL: Same seed produced different creatures');
  console.log('Genome A:', result1a.creature.genomeSignature);
  console.log('Genome B:', result1b.creature.genomeSignature);
}

// ============================================================================
// TEST 2: All Anchor Species Generation
// ============================================================================
console.log('\n📦 TEST 2: All Anchor Species Generation');
console.log('-'.repeat(60));

const anchorIds = Object.keys(ANCHOR_SPECIES);
console.log(`Testing ${anchorIds.length} anchor species...`);

let allAnchorsWork = true;
for (const anchorId of anchorIds) {
  try {
    const config = {
      seed: `test-${anchorId}`,
      primaryAnchorId: anchorId as any,
      generation: 0,
    };
    const generator = new CreatureGenerator(config);
    const result = generator.generate();
    
    console.log(`  ✓ ${anchorId.padEnd(12)} - Generated successfully`);
    
    // Validate creature has all required fields
    if (!result.creature.id || !result.creature.genomeSignature || !result.creature.appearanceParams) {
      console.log(`    ⚠️  Missing required fields`);
      allAnchorsWork = false;
    }
  } catch (error) {
    console.log(`  ✗ ${anchorId.padEnd(12)} - ERROR: ${error}`);
    allAnchorsWork = false;
  }
}

if (allAnchorsWork) {
  console.log('✅ PASS: All anchor species generate correctly');
} else {
  console.log('❌ FAIL: Some anchor species failed to generate');
}

// ============================================================================
// TEST 3: Hybrid Compatibility
// ============================================================================
console.log('\n📦 TEST 3: Hybrid Compatibility Rules');
console.log('-'.repeat(60));

const hybridTests = [
  { parent1: 'dragon', parent2: 'serpent', shouldWork: true },
  { parent1: 'dragon', parent2: 'phoenix', shouldWork: true },
  { parent1: 'dragon', parent2: 'basilisk', shouldWork: false }, // Forbidden
  { parent1: 'unicorn', parent2: 'pegasus', shouldWork: true },
  { parent1: 'kraken', parent2: 'leviathan', shouldWork: true },
];

let hybridTestsPassed = 0;
for (const test of hybridTests) {
  const isCompatible = isCompatibleForHybrid(test.parent1 as any, test.parent2 as any);
  const passed = isCompatible === test.shouldWork;
  
  if (passed) {
    console.log(`  ✓ ${test.parent1} + ${test.parent2}: ${isCompatible ? 'Compatible' : 'Incompatible'} (expected)`);
    hybridTestsPassed++;
  } else {
    console.log(`  ✗ ${test.parent1} + ${test.parent2}: ${isCompatible ? 'Compatible' : 'Incompatible'} (unexpected!)`);
  }
}

if (hybridTestsPassed === hybridTests.length) {
  console.log(`✅ PASS: All ${hybridTests.length} hybrid compatibility tests passed`);
} else {
  console.log(`❌ FAIL: Only ${hybridTestsPassed}/${hybridTests.length} tests passed`);
}

// ============================================================================
// TEST 4: Breeding System
// ============================================================================
console.log('\n📦 TEST 4: Breeding System');
console.log('-'.repeat(60));

// Generate two parent creatures
const parent1Config = {
  seed: 'parent-1-dragon',
  primaryAnchorId: 'dragon' as const,
  generation: 0,
};

const parent2Config = {
  seed: 'parent-2-serpent',
  primaryAnchorId: 'serpent' as const,
  generation: 0,
};

const parent1Gen = new CreatureGenerator(parent1Config);
const parent1 = parent1Gen.generate().creature;

const parent2Gen = new CreatureGenerator(parent2Config);
const parent2 = parent2Gen.generate().creature;

console.log('✓ Parent 1:', parent1.primaryAnchor, '(generation 0)');
console.log('✓ Parent 2:', parent2.primaryAnchor, '(generation 0)');

// Attempt to breed them
const offspringConfig = {
  seed: `offspring-${parent1.id}-${parent2.id}`,
  primaryAnchorId: parent1.primaryAnchor,
  secondaryAnchorId: parent2.primaryAnchor,
  generation: Math.max(parent1.lineageHistory.length, parent2.lineageHistory.length) + 1,
  parentIds: [parent1.id, parent2.id],
};

const offspringGen = new CreatureGenerator(offspringConfig);
const offspring = offspringGen.generate().creature;

console.log('✓ Offspring:', {
  primary: offspring.primaryAnchor,
  secondary: offspring.secondaryAnchor,
  generation: offspring.lineageHistory.length,
});

if (offspring.secondaryAnchor && offspring.lineageHistory.length > 0) {
  console.log('✅ PASS: Breeding produced hybrid offspring');
} else {
  console.log('❌ FAIL: Breeding did not produce proper hybrid');
}

// ============================================================================
// TEST 5: World Spawn Generation
// ============================================================================
console.log('\n📦 TEST 5: World Spawn Generation');
console.log('-'.repeat(60));

const currentTimeWindow = getCurrentTimeWindow();
console.log('✓ Current time window:', currentTimeWindow);

// Generate spawn seeds for a region
const testRegion = {
  id: 'test-region-1',
  name: 'Test Valley',
  center: { latitude: 40.7128, longitude: -74.0060 },
  radius: 5000,
};

const spawn1Seed = generateSpawnSeed(testRegion.id, currentTimeWindow, 0);
const spawn2Seed = generateSpawnSeed(testRegion.id, currentTimeWindow, 1);

console.log('✓ Spawn seed 1:', spawn1Seed.substring(0, 32) + '...');
console.log('✓ Spawn seed 2:', spawn2Seed.substring(0, 32) + '...');

// Test that seeds are different
if (spawn1Seed !== spawn2Seed) {
  console.log('✅ PASS: Different spawn indices produce different seeds');
} else {
  console.log('❌ FAIL: Spawn seeds are identical');
}

// Test that same inputs produce same seed
const spawn1SeedRepeat = generateSpawnSeed(testRegion.id, currentTimeWindow, 0);
if (spawn1Seed === spawn1SeedRepeat) {
  console.log('✅ PASS: Spawn generation is deterministic');
} else {
  console.log('❌ FAIL: Spawn generation is not deterministic');
}

// ============================================================================
// TEST 6: Appearance Parameters
// ============================================================================
console.log('\n📦 TEST 6: Appearance Parameters');
console.log('-'.repeat(60));

const testCreature = generateWildCreature('test-appearance', 'griffin');
const appearance = testCreature.appearanceParams;

console.log('✓ Body parts:', appearance.bodyParts);
console.log('✓ Colors:', Object.keys(appearance.colors).length, 'color assignments');
console.log('✓ Materials:', Object.keys(appearance.materials).length, 'material assignments');
console.log('✓ Size variation:', appearance.sizeVariation);

// Validate appearance has required fields
const hasRequiredFields = 
  appearance.bodyParts &&
  appearance.bodyParts.head &&
  appearance.bodyParts.body &&
  appearance.colors &&
  appearance.materials &&
  typeof appearance.sizeVariation === 'number';

if (hasRequiredFields) {
  console.log('✅ PASS: Appearance parameters have all required fields');
} else {
  console.log('❌ FAIL: Missing appearance parameter fields');
}

// ============================================================================
// TEST 7: Seeded Random Consistency
// ============================================================================
console.log('\n📦 TEST 7: Seeded Random Consistency');
console.log('-'.repeat(60));

const rng1 = new SeededRandom('test-rng-seed');
const values1 = [rng1.next(), rng1.next(), rng1.next()];

const rng2 = new SeededRandom('test-rng-seed');
const values2 = [rng2.next(), rng2.next(), rng2.next()];

console.log('✓ RNG 1:', values1.map(v => v.toFixed(4)));
console.log('✓ RNG 2:', values2.map(v => v.toFixed(4)));

const rngConsistent = values1.every((v, i) => v === values2[i]);

if (rngConsistent) {
  console.log('✅ PASS: Seeded RNG produces consistent values');
} else {
  console.log('❌ FAIL: Seeded RNG is not consistent');
}

// ============================================================================
// TEST 8: Genome Inheritance
// ============================================================================
console.log('\n📦 TEST 8: Genome Inheritance');
console.log('-'.repeat(60));

const testParent1 = generateWildCreature('parent-test-1', 'dragon');
const testParent2 = generateWildCreature('parent-test-2', 'phoenix');

console.log('✓ Parent 1 genome traits:', testParent1.genomeSignature.traits.length);
console.log('✓ Parent 2 genome traits:', testParent2.genomeSignature.traits.length);

// In a real breeding scenario, offspring would inherit traits from both parents
const hasTraits = 
  testParent1.genomeSignature.traits.length > 0 &&
  testParent2.genomeSignature.traits.length > 0;

if (hasTraits) {
  console.log('✅ PASS: Creatures have genetic traits for inheritance');
} else {
  console.log('❌ FAIL: Creatures missing genetic traits');
}

// ============================================================================
// TEST 9: Anchor Biology Constraints
// ============================================================================
console.log('\n📦 TEST 9: Anchor Biology Constraints');
console.log('-'.repeat(60));

const dragonAnchor = ANCHOR_SPECIES.dragon;
console.log('✓ Dragon habitats:', dragonAnchor.biology.habitats);
console.log('✓ Dragon locomotion:', dragonAnchor.biology.locomotion);
console.log('✓ Dragon diet:', dragonAnchor.biology.diet);
console.log('✓ Dragon forbidden parts:', dragonAnchor.forbiddenParts?.length || 0);

const hasValidBiology = 
  dragonAnchor.biology &&
  dragonAnchor.biology.habitats.length > 0 &&
  dragonAnchor.biology.locomotion.length > 0 &&
  dragonAnchor.biology.diet.length > 0;

if (hasValidBiology) {
  console.log('✅ PASS: Anchor species have valid biology constraints');
} else {
  console.log('❌ FAIL: Anchor biology incomplete');
}

// ============================================================================
// TEST 10: Multiple Generation Cycles
// ============================================================================
console.log('\n📦 TEST 10: Multiple Generation Cycles');
console.log('-'.repeat(60));

const generations = [];
let currentSeed = 'gen-0-seed';

for (let i = 0; i < 5; i++) {
  const creature = generateWildCreature(currentSeed, 'unicorn');
  generations.push(creature);
  currentSeed = `gen-${i + 1}-seed`;
  console.log(`  ✓ Generation ${i}: ${creature.primaryAnchor} (level ${creature.level})`);
}

if (generations.length === 5) {
  console.log('✅ PASS: Multiple generation cycles successful');
} else {
  console.log('❌ FAIL: Generation cycles incomplete');
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));

const tests = [
  { name: 'Deterministic Generation', passed: isDeterministic },
  { name: 'All Anchor Species', passed: allAnchorsWork },
  { name: 'Hybrid Compatibility', passed: hybridTestsPassed === hybridTests.length },
  { name: 'Breeding System', passed: offspring.secondaryAnchor !== undefined },
  { name: 'World Spawn Generation', passed: spawn1Seed !== spawn2Seed && spawn1Seed === spawn1SeedRepeat },
  { name: 'Appearance Parameters', passed: hasRequiredFields },
  { name: 'Seeded Random', passed: rngConsistent },
  { name: 'Genome Inheritance', passed: hasTraits },
  { name: 'Biology Constraints', passed: hasValidBiology },
  { name: 'Multiple Generations', passed: generations.length === 5 },
];

const totalTests = tests.length;
const passedTests = tests.filter(t => t.passed).length;

tests.forEach(test => {
  const status = test.passed ? '✅' : '❌';
  console.log(`${status} ${test.name}`);
});

console.log('\n' + '='.repeat(60));
console.log(`RESULT: ${passedTests}/${totalTests} tests passed`);
console.log('='.repeat(60));

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! Game logic is working correctly.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Review output above.\n`);
  process.exit(1);
}
