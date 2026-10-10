/**
 * The deterministic creature generator now lives in @hatchlands/shared so the
 * offline client can use it too. Re-exported here for existing server imports.
 */
export { CreatureGenerator, generateCreature, generateWildCreature } from '@hatchlands/shared';
