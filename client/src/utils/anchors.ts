import { AnchorId } from '@hatchlands/shared';

export const ANCHOR_DISPLAY_NAME: Record<AnchorId, string> = {
  dragon: 'Ember',
  serpent: 'Tide',
  phoenix: 'Bloom',
  griffin: 'Gale',
  basilisk: 'Stone',
  unicorn: 'Frost',
  kraken: 'Spark',
  chimera: 'Venom',
  hydra: 'Metal',
  sphinx: 'Shadow',
  pegasus: 'Lumen',
  manticore: 'Beast',
  leviathan: 'Mind',
  roc: 'Spirit',
  behemoth: 'Behemoth',
};

export function getAnchorDisplayName(anchor: AnchorId): string {
  return ANCHOR_DISPLAY_NAME[anchor] || anchor;
}
