/**
 * Anchor Species Definitions
 * 
 * The 15 anchor species that define biological laws in Hatchlands.
 * All creatures are constrained by these biological rules.
 */

import { AnchorSpecies, AnchorId } from '@hatchlands/shared';

export const ANCHOR_SPECIES: Record<AnchorId, AnchorSpecies> = {
  dragon: {
    id: 'dragon',
    name: 'Dragon',
    description: 'Ancient apex predator with scales, wings, and fierce majesty',
    rarity: 0.05,
    biology: {
      sizeCategory: 'huge',
      habitats: ['mountain', 'cave', 'volcanic'],
      locomotion: ['terrestrial', 'aerial'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['scaled_body', 'armored_body', 'serpentine_body'],
      headTypes: ['horned_head', 'crested_head', 'spiked_head'],
      limbTypes: ['clawed_legs', 'taloned_legs'],
      tailTypes: ['spiked_tail', 'whip_tail', 'club_tail'],
      wingTypes: ['bat_wings', 'membrane_wings', 'scaled_wings'],
    },
    colorPalettes: [
      ['#8B0000', '#FF4500', '#FFD700'], // Red-gold
      ['#000080', '#4169E1', '#87CEEB'], // Blue
      ['#2F4F2F', '#228B22', '#32CD32'], // Green
      ['#4B0082', '#8B008B', '#DA70D6'], // Purple
      ['#1C1C1C', '#4A4A4A', '#C0C0C0'], // Black-silver
    ],
    materials: ['scales', 'horn', 'leather'],
    forbidden: {
      parts: ['feathers', 'tentacles', 'gills'],
    },
    hybridRules: {
      compatibleAnchors: ['serpent', 'phoenix', 'griffin', 'hydra'],
      maxForeignParts: 2,
      dominantTraits: ['scales', 'wings', 'fire'],
    },
  },

  serpent: {
    id: 'serpent',
    name: 'Serpent',
    description: 'Sinuous predator embodying fluid grace and venomous power',
    rarity: 0.15,
    biology: {
      sizeCategory: 'large',
      habitats: ['swamp', 'jungle', 'cave'],
      locomotion: ['terrestrial'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['serpentine_body', 'scaled_body', 'coiled_body'],
      headTypes: ['fanged_head', 'hooded_head', 'viper_head'],
      limbTypes: [],
      tailTypes: ['pointed_tail', 'rattle_tail'],
    },
    colorPalettes: [
      ['#006400', '#228B22', '#ADFF2F'], // Green
      ['#8B4513', '#D2691E', '#DEB887'], // Brown
      ['#000000', '#696969', '#FFFFFF'], // Black-white
      ['#8B0000', '#DC143C', '#FFD700'], // Red-gold
    ],
    materials: ['scales', 'skin'],
    forbidden: {
      parts: ['wings', 'feathers', 'fur'],
    },
    hybridRules: {
      compatibleAnchors: ['dragon', 'basilisk', 'hydra', 'leviathan'],
      maxForeignParts: 1,
      dominantTraits: ['serpentine', 'scales', 'venom'],
    },
  },

  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    description: 'Immortal firebird representing rebirth and eternal flame',
    rarity: 0.03,
    biology: {
      sizeCategory: 'large',
      habitats: ['volcanic', 'desert', 'sky'],
      locomotion: ['aerial'],
      diet: 'omnivore',
    },
    anatomy: {
      bodyParts: ['feathered_body', 'streamlined_body'],
      headTypes: ['crested_head', 'beaked_head', 'crowned_head'],
      limbTypes: ['taloned_legs', 'bird_legs'],
      tailTypes: ['plume_tail', 'fanned_tail', 'streaming_tail'],
      wingTypes: ['feathered_wings', 'flame_wings', 'radiant_wings'],
    },
    colorPalettes: [
      ['#FF0000', '#FF4500', '#FFD700'], // Flame
      ['#FF1493', '#FF69B4', '#FFD700'], // Pink-gold
      ['#FFA500', '#FF8C00', '#FFFF00'], // Orange-yellow
    ],
    materials: ['feathers', 'flame'],
    forbidden: {
      parts: ['scales', 'tentacles', 'gills'],
    },
    hybridRules: {
      compatibleAnchors: ['dragon', 'griffin', 'roc', 'pegasus'],
      maxForeignParts: 2,
      dominantTraits: ['feathers', 'fire', 'flight'],
    },
  },

  griffin: {
    id: 'griffin',
    name: 'Griffin',
    description: 'Noble hybrid of eagle and lion, guardian of treasures',
    rarity: 0.08,
    biology: {
      sizeCategory: 'large',
      habitats: ['mountain', 'temperate_forest', 'plains'],
      locomotion: ['terrestrial', 'aerial'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['furred_body', 'feathered_torso', 'leonine_body'],
      headTypes: ['beaked_head', 'eagle_head'],
      limbTypes: ['clawed_legs', 'leonine_legs', 'taloned_forelegs'],
      tailTypes: ['tufted_tail', 'leonine_tail'],
      wingTypes: ['feathered_wings', 'eagle_wings'],
    },
    colorPalettes: [
      ['#8B4513', '#DEB887', '#FFFFFF'], // Brown-white
      ['#DAA520', '#FFD700', '#FFF8DC'], // Golden
      ['#2F4F4F', '#8B7355', '#F5DEB3'], // Dark-tan
    ],
    materials: ['feathers', 'fur', 'beak'],
    forbidden: {
      parts: ['scales', 'tentacles', 'gills', 'fins'],
    },
    hybridRules: {
      compatibleAnchors: ['dragon', 'phoenix', 'pegasus', 'sphinx'],
      maxForeignParts: 2,
      dominantTraits: ['feathers', 'fur', 'flight'],
    },
  },

  basilisk: {
    id: 'basilisk',
    name: 'Basilisk',
    description: 'Serpent king with a deadly gaze and venomous breath',
    rarity: 0.06,
    biology: {
      sizeCategory: 'medium',
      habitats: ['cave', 'swamp', 'ruins'],
      locomotion: ['terrestrial'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['serpentine_body', 'armored_body', 'crested_body'],
      headTypes: ['crowned_head', 'crested_head', 'fanged_head'],
      limbTypes: ['small_legs', 'vestigial_arms'],
      tailTypes: ['spiked_tail', 'pointed_tail'],
    },
    colorPalettes: [
      ['#006400', '#32CD32', '#FFD700'], // Green-gold
      ['#4B0082', '#8B008B', '#00FA9A'], // Purple-green
      ['#8B0000', '#000000', '#FFD700'], // Red-black-gold
    ],
    materials: ['scales', 'crown', 'venom'],
    forbidden: {
      parts: ['feathers', 'wings', 'tentacles'],
    },
    hybridRules: {
      compatibleAnchors: ['serpent', 'dragon', 'chimera'],
      maxForeignParts: 1,
      dominantTraits: ['serpentine', 'venom', 'gaze'],
    },
  },

  unicorn: {
    id: 'unicorn',
    name: 'Unicorn',
    description: 'Pure and majestic horse with a spiraling horn of power',
    rarity: 0.07,
    biology: {
      sizeCategory: 'medium',
      habitats: ['temperate_forest', 'plains', 'enchanted_grove'],
      locomotion: ['terrestrial'],
      diet: 'herbivore',
    },
    anatomy: {
      bodyParts: ['equine_body', 'graceful_body'],
      headTypes: ['horned_head', 'gentle_head'],
      limbTypes: ['hooved_legs'],
      tailTypes: ['flowing_tail', 'horse_tail'],
    },
    colorPalettes: [
      ['#FFFFFF', '#F0F8FF', '#FFD700'], // White-gold
      ['#E6E6FA', '#DDA0DD', '#FFD700'], // Lavender-gold
      ['#F0FFFF', '#B0E0E6', '#FFD700'], // Azure-gold
    ],
    materials: ['fur', 'horn', 'magic'],
    forbidden: {
      parts: ['scales', 'claws', 'fangs', 'tentacles'],
    },
    hybridRules: {
      compatibleAnchors: ['pegasus', 'sphinx'],
      maxForeignParts: 1,
      dominantTraits: ['equine', 'horn', 'purity'],
    },
  },

  kraken: {
    id: 'kraken',
    name: 'Kraken',
    description: 'Colossal deep-sea terror with crushing tentacles',
    rarity: 0.04,
    biology: {
      sizeCategory: 'colossal',
      habitats: ['ocean', 'deep_sea', 'abyss'],
      locomotion: ['aquatic'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['tentacled_body', 'bulbous_body', 'armored_body'],
      headTypes: ['beaked_head', 'crowned_head'],
      limbTypes: ['tentacle', 'sucker_arm', 'crushing_tentacle'],
      tailTypes: [],
    },
    colorPalettes: [
      ['#000080', '#1E90FF', '#00CED1'], // Deep blue
      ['#2F4F4F', '#708090', '#B0C4DE'], // Gray-blue
      ['#4B0082', '#8B008B', '#9370DB'], // Purple
      ['#8B0000', '#A52A2A', '#DC143C'], // Crimson
    ],
    materials: ['tentacles', 'beak', 'ink'],
    forbidden: {
      parts: ['wings', 'legs', 'fur', 'feathers'],
    },
    hybridRules: {
      compatibleAnchors: ['leviathan', 'hydra'],
      maxForeignParts: 1,
      dominantTraits: ['tentacles', 'aquatic', 'giant'],
    },
  },

  chimera: {
    id: 'chimera',
    name: 'Chimera',
    description: 'Multi-headed monstrosity combining multiple beasts',
    rarity: 0.09,
    biology: {
      sizeCategory: 'large',
      habitats: ['mountain', 'ruins', 'volcanic'],
      locomotion: ['terrestrial'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['leonine_body', 'composite_body', 'scaled_body'],
      headTypes: ['dragon_head', 'goat_head', 'lion_head', 'serpent_head'],
      limbTypes: ['clawed_legs', 'leonine_legs'],
      tailTypes: ['serpent_tail', 'spiked_tail'],
    },
    colorPalettes: [
      ['#8B4513', '#CD853F', '#FF4500'], // Brown-orange
      ['#8B0000', '#000000', '#FFD700'], // Red-black-gold
      ['#2F4F2F', '#8B4513', '#DC143C'], // Multi-beast
    ],
    materials: ['fur', 'scales', 'horn'],
    forbidden: {
      parts: ['wings', 'tentacles'],
    },
    hybridRules: {
      compatibleAnchors: ['dragon', 'griffin', 'basilisk', 'manticore'],
      maxForeignParts: 3,
      dominantTraits: ['multi_headed', 'composite', 'fire'],
    },
  },

  hydra: {
    id: 'hydra',
    name: 'Hydra',
    description: 'Multi-headed serpent with regenerating heads',
    rarity: 0.05,
    biology: {
      sizeCategory: 'huge',
      habitats: ['swamp', 'lake', 'cave'],
      locomotion: ['terrestrial', 'aquatic'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['serpentine_body', 'massive_body', 'scaled_body'],
      headTypes: ['serpent_head', 'dragon_head', 'fanged_head'],
      limbTypes: ['clawed_legs', 'webbed_legs'],
      tailTypes: ['thick_tail', 'club_tail'],
    },
    colorPalettes: [
      ['#006400', '#2E8B57', '#3CB371'], // Green
      ['#000080', '#4682B4', '#5F9EA0'], // Blue-green
      ['#8B4513', '#A0522D', '#CD853F'], // Brown
    ],
    materials: ['scales', 'venom', 'regeneration'],
    forbidden: {
      parts: ['wings', 'feathers', 'tentacles'],
    },
    hybridRules: {
      compatibleAnchors: ['dragon', 'serpent', 'kraken', 'leviathan'],
      maxForeignParts: 2,
      dominantTraits: ['multi_headed', 'regeneration', 'aquatic'],
    },
  },

  sphinx: {
    id: 'sphinx',
    name: 'Sphinx',
    description: 'Enigmatic guardian with a human face and leonine body',
    rarity: 0.06,
    biology: {
      sizeCategory: 'large',
      habitats: ['desert', 'ruins', 'temple'],
      locomotion: ['terrestrial'],
      diet: 'omnivore',
    },
    anatomy: {
      bodyParts: ['leonine_body', 'regal_body'],
      headTypes: ['human_face', 'crowned_head'],
      limbTypes: ['leonine_legs', 'powerful_legs'],
      tailTypes: ['leonine_tail', 'tufted_tail'],
      wingTypes: ['feathered_wings', 'eagle_wings'],
    },
    colorPalettes: [
      ['#DAA520', '#FFD700', '#F0E68C'], // Golden
      ['#8B4513', '#D2691E', '#DEB887'], // Sandy brown
      ['#FFFFFF', '#FFD700', '#4169E1'], // White-gold-blue
    ],
    materials: ['fur', 'stone', 'wisdom'],
    forbidden: {
      parts: ['tentacles', 'scales', 'gills'],
    },
    hybridRules: {
      compatibleAnchors: ['griffin', 'manticore', 'unicorn'],
      maxForeignParts: 2,
      dominantTraits: ['leonine', 'wisdom', 'riddles'],
    },
  },

  pegasus: {
    id: 'pegasus',
    name: 'Pegasus',
    description: 'Divine winged horse soaring through the heavens',
    rarity: 0.07,
    biology: {
      sizeCategory: 'medium',
      habitats: ['sky', 'mountain', 'clouds'],
      locomotion: ['terrestrial', 'aerial'],
      diet: 'herbivore',
    },
    anatomy: {
      bodyParts: ['equine_body', 'graceful_body'],
      headTypes: ['gentle_head', 'noble_head'],
      limbTypes: ['hooved_legs'],
      tailTypes: ['flowing_tail', 'horse_tail'],
      wingTypes: ['feathered_wings', 'angelic_wings'],
    },
    colorPalettes: [
      ['#FFFFFF', '#F0F8FF', '#E6E6FA'], // White
      ['#F5DEB3', '#FFE4B5', '#FAFAD2'], // Cream
      ['#B0C4DE', '#ADD8E6', '#87CEEB'], // Sky blue
    ],
    materials: ['fur', 'feathers', 'cloud'],
    forbidden: {
      parts: ['scales', 'claws', 'tentacles'],
    },
    hybridRules: {
      compatibleAnchors: ['unicorn', 'griffin', 'phoenix'],
      maxForeignParts: 2,
      dominantTraits: ['equine', 'flight', 'divine'],
    },
  },

  manticore: {
    id: 'manticore',
    name: 'Manticore',
    description: 'Fearsome predator with human face, lion body, and scorpion tail',
    rarity: 0.08,
    biology: {
      sizeCategory: 'large',
      habitats: ['desert', 'mountain', 'ruins'],
      locomotion: ['terrestrial', 'aerial'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['leonine_body', 'muscular_body'],
      headTypes: ['human_face', 'fanged_face'],
      limbTypes: ['clawed_legs', 'leonine_legs'],
      tailTypes: ['scorpion_tail', 'spiked_tail', 'barbed_tail'],
      wingTypes: ['bat_wings', 'dragon_wings'],
    },
    colorPalettes: [
      ['#8B0000', '#DC143C', '#FFD700'], // Red-gold
      ['#8B4513', '#A0522D', '#D2691E'], // Brown
      ['#2F4F4F', '#696969', '#A9A9A9'], // Gray
    ],
    materials: ['fur', 'scales', 'venom'],
    forbidden: {
      parts: ['tentacles', 'gills', 'feathers'],
    },
    hybridRules: {
      compatibleAnchors: ['chimera', 'sphinx', 'griffin', 'dragon'],
      maxForeignParts: 2,
      dominantTraits: ['leonine', 'venom', 'flight'],
    },
  },

  leviathan: {
    id: 'leviathan',
    name: 'Leviathan',
    description: 'Primordial sea serpent of catastrophic proportions',
    rarity: 0.02,
    biology: {
      sizeCategory: 'colossal',
      habitats: ['ocean', 'deep_sea', 'storm'],
      locomotion: ['aquatic'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['serpentine_body', 'armored_body', 'colossal_body'],
      headTypes: ['dragon_head', 'sea_dragon_head', 'crowned_head'],
      limbTypes: ['flippers', 'fin_legs'],
      tailTypes: ['massive_tail', 'fin_tail'],
      finTypes: ['dorsal_fin', 'sail_fin'],
    },
    colorPalettes: [
      ['#000080', '#000000', '#4169E1'], // Deep ocean
      ['#2F4F4F', '#556B2F', '#6B8E23'], // Dark green-blue
      ['#191970', '#4B0082', '#8B008B'], // Midnight purple
    ],
    materials: ['scales', 'armor', 'storm'],
    forbidden: {
      parts: ['wings', 'legs', 'feathers', 'fur'],
    },
    hybridRules: {
      compatibleAnchors: ['kraken', 'hydra', 'serpent'],
      maxForeignParts: 1,
      dominantTraits: ['serpentine', 'colossal', 'aquatic'],
    },
  },

  roc: {
    id: 'roc',
    name: 'Roc',
    description: 'Legendary bird of prey large enough to carry elephants',
    rarity: 0.04,
    biology: {
      sizeCategory: 'colossal',
      habitats: ['mountain', 'sky', 'island'],
      locomotion: ['aerial'],
      diet: 'carnivore',
    },
    anatomy: {
      bodyParts: ['feathered_body', 'massive_body', 'streamlined_body'],
      headTypes: ['beaked_head', 'eagle_head', 'predator_head'],
      limbTypes: ['taloned_legs', 'massive_talons'],
      tailTypes: ['fanned_tail', 'rudder_tail'],
      wingTypes: ['massive_wings', 'feathered_wings', 'storm_wings'],
    },
    colorPalettes: [
      ['#8B4513', '#D2691E', '#FFFFFF'], // Brown-white
      ['#2F4F4F', '#708090', '#F5F5DC'], // Storm gray
      ['#DAA520', '#B8860B', '#8B4513'], // Golden brown
    ],
    materials: ['feathers', 'talons', 'storm'],
    forbidden: {
      parts: ['scales', 'tentacles', 'gills', 'fur'],
    },
    hybridRules: {
      compatibleAnchors: ['phoenix', 'griffin', 'dragon'],
      maxForeignParts: 1,
      dominantTraits: ['feathers', 'colossal', 'flight'],
    },
  },

  behemoth: {
    id: 'behemoth',
    name: 'Behemoth',
    description: 'Titanic land beast of unmatched strength and endurance',
    rarity: 0.03,
    biology: {
      sizeCategory: 'colossal',
      habitats: ['plains', 'jungle', 'mountain'],
      locomotion: ['terrestrial'],
      diet: 'herbivore',
    },
    anatomy: {
      bodyParts: ['massive_body', 'armored_body', 'titan_body'],
      headTypes: ['horned_head', 'crowned_head', 'bull_head'],
      limbTypes: ['pillar_legs', 'massive_legs', 'hooved_legs'],
      tailTypes: ['club_tail', 'thick_tail', 'armored_tail'],
    },
    colorPalettes: [
      ['#8B4513', '#A0522D', '#D2691E'], // Earth brown
      ['#2F4F2F', '#556B2F', '#8B8682'], // Stone gray-green
      ['#696969', '#808080', '#A9A9A9'], // Gray
    ],
    materials: ['hide', 'horn', 'earth'],
    forbidden: {
      parts: ['wings', 'tentacles', 'gills', 'fins'],
    },
    hybridRules: {
      compatibleAnchors: ['dragon', 'sphinx'],
      maxForeignParts: 1,
      dominantTraits: ['colossal', 'strength', 'endurance'],
    },
  },
};

// Export as array for iteration
export const ANCHOR_SPECIES_ARRAY = Object.values(ANCHOR_SPECIES);

// Lookup helpers
export function getAnchorById(id: AnchorId): AnchorSpecies {
  return ANCHOR_SPECIES[id];
}

export function isCompatibleForHybrid(anchor1: AnchorId, anchor2: AnchorId): boolean {
  const species1 = ANCHOR_SPECIES[anchor1];
  return species1.hybridRules.compatibleAnchors.includes(anchor2);
}

export function getAnchorsByRarity(minRarity: number = 0, maxRarity: number = 1): AnchorSpecies[] {
  return ANCHOR_SPECIES_ARRAY.filter(
    (anchor) => anchor.rarity >= minRarity && anchor.rarity <= maxRarity
  );
}

export function getAnchorsByHabitat(habitat: string): AnchorSpecies[] {
  return ANCHOR_SPECIES_ARRAY.filter((anchor) =>
    anchor.biology.habitats.includes(habitat)
  );
}
