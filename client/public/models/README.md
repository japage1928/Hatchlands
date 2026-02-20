# Creature GLB Models

Drop `.glb` files here to enable high-fidelity creature rendering in `CreatureViewer`.

Expected filenames:

- `ember.glb`
- `tide.glb`
- `bloom.glb`
- `gale.glb`
- `stone.glb`
- `frost.glb`
- `spark.glb`
- `venom.glb`
- `metal.glb`
- `shadow.glb`
- `lumen.glb`
- `beast.glb`
- `mind.glb`
- `spirit.glb`
- `drake.glb`

Behavior:

- If `.glb` exists for a creature, viewer renders the GLB.
- Else if `.png` exists, viewer renders the PNG as a sprite in 3D space.
- Else viewer falls back to procedural renderer.

Current anchor mapping:

1. `dragon -> ember`
2. `serpent -> tide`
3. `phoenix -> bloom`
4. `griffin -> gale`
5. `basilisk -> stone`
6. `unicorn -> frost`
7. `kraken -> spark`
8. `chimera -> venom`
9. `hydra -> metal`
10. `sphinx -> shadow`
11. `pegasus -> lumen`
12. `manticore -> beast`
13. `leviathan -> mind`
14. `roc -> spirit`
15. `behemoth -> drake`

Any extra image beyond these 15 is ignored by the current mapping.
