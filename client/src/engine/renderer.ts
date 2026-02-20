/**
 * Deterministic 3D Creature Renderer
 *
 * Reconstructs creatures from appearance parameters using Three.js.
 * Focused on readable anatomical silhouettes instead of spherical blobs.
 */

import * as THREE from 'three';
import { Creature, AppearanceParams, AnchorSpecies } from '@hatchlands/shared';
import { ANCHOR_SPECIES } from '@hatchlands/shared';

interface MaterialProfile {
  roughness: number;
  metalness: number;
  emissive: THREE.Color;
  emissiveIntensity: number;
}

export class CreatureRenderer {
  private scene: THREE.Scene;
  private creature: Creature;
  private group: THREE.Group;

  constructor(scene: THREE.Scene, creature: Creature) {
    this.scene = scene;
    this.creature = creature;
    this.group = new THREE.Group();
    this.group.name = `creature-${creature.id}`;
    this.build();
  }

  private build(): void {
    const params = this.creature.appearanceParams;
    const anchor = ANCHOR_SPECIES[this.creature.primaryAnchor];
    const palette = this.getPalette(anchor, params);
    const materialProfile = this.getMaterialProfile(anchor);

    this.buildBody(anchor, params, palette, materialProfile);
    this.buildHead(anchor, params, palette, materialProfile);
    this.buildLimbs(anchor, params, palette, materialProfile);

    if (params.parts.wings && params.parts.wings.length > 0) {
      this.buildWings(anchor, params, palette, materialProfile);
    }

    if (params.parts.tail) {
      this.buildTail(anchor, params, palette, materialProfile);
    }

    this.group.scale.set(params.scale, params.scale, params.scale);
    this.scene.add(this.group);
  }

  private getPalette(anchor: AnchorSpecies, params: AppearanceParams): THREE.Color[] {
    const palettes = anchor.colorPalettes;
    const selectedPalette = palettes[0] || ['#999999', '#777777', '#555555'];
    const indices = params.colorIndices.length > 0 ? params.colorIndices : [0, 1, 2];

    return indices.slice(0, 3).map((index) => {
      const clamped = Math.abs(index) % selectedPalette.length;
      return new THREE.Color(selectedPalette[clamped]);
    });
  }

  private getMaterialProfile(anchor: AnchorSpecies): MaterialProfile {
    const materials = anchor.materials.map((m) => m.toLowerCase());
    let roughness = 0.6;
    let metalness = 0.05;
    let emissive = new THREE.Color(0x000000);
    let emissiveIntensity = 0;

    if (materials.some((m) => m.includes('scales') || m.includes('shell') || m.includes('chitin'))) {
      roughness = 0.42;
      metalness = 0.22;
    }

    if (materials.some((m) => m.includes('feather') || m.includes('fur') || m.includes('skin') || m.includes('hide'))) {
      roughness = 0.78;
      metalness = 0.02;
    }

    if (materials.some((m) => m.includes('flame') || m.includes('glow') || m.includes('crystal'))) {
      emissive = new THREE.Color(0xff6600);
      emissiveIntensity = 0.25;
      roughness = 0.35;
    }

    return { roughness, metalness, emissive, emissiveIntensity };
  }

  private createMaterial(
    color: THREE.Color,
    profile: MaterialProfile,
    overrides?: Partial<THREE.MeshStandardMaterialParameters>,
  ): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: profile.roughness,
      metalness: profile.metalness,
      emissive: profile.emissive,
      emissiveIntensity: profile.emissiveIntensity,
      ...overrides,
    });
  }

  private markMesh(mesh: THREE.Mesh, name?: string): void {
    if (name) {
      mesh.name = name;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  private buildBody(
    anchor: AnchorSpecies,
    params: AppearanceParams,
    palette: THREE.Color[],
    profile: MaterialProfile,
  ): void {
    const hasSerpentineBody = params.parts.body.includes('serpentine') || params.parts.body.includes('coiled');
    const isAquatic = anchor.biology.locomotion.includes('aquatic');

    if (hasSerpentineBody) {
      for (let i = 0; i < 4; i++) {
        const radius = 0.42 - i * 0.04;
        const segment = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 24, 24),
          this.createMaterial(palette[0], profile),
        );
        segment.position.set(0.7 - i * 0.45, 0.02 + i * 0.02, 0);
        this.markMesh(segment, `body-segment-${i}`);
        this.group.add(segment);
      }
      return;
    }

    const torsoLength = isAquatic ? 2.2 : 1.8;
    const torsoRadius = isAquatic ? 0.45 : 0.52;
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(torsoRadius, torsoLength, 10, 20),
      this.createMaterial(palette[0], profile),
    );
    torso.rotation.z = Math.PI / 2;
    torso.position.y = 0.05;
    this.markMesh(torso, 'torso');
    this.group.add(torso);

    const chest = new THREE.Mesh(
      new THREE.SphereGeometry(torsoRadius * 0.95, 24, 24),
      this.createMaterial(palette[1] || palette[0], profile),
    );
    chest.position.set(0.65, 0.12, 0);
    this.markMesh(chest, 'chest');
    this.group.add(chest);

    const hips = new THREE.Mesh(
      new THREE.SphereGeometry(torsoRadius * 0.82, 24, 24),
      this.createMaterial(palette[0], profile),
    );
    hips.position.set(-0.7, -0.02, 0);
    this.markMesh(hips, 'hips');
    this.group.add(hips);
  }

  private buildHead(
    _anchor: AnchorSpecies,
    params: AppearanceParams,
    palette: THREE.Color[],
    profile: MaterialProfile,
  ): void {
    const hasBeak = params.parts.head.includes('beaked');
    const hasHorns = params.parts.head.includes('horned');
    const hasCrest = params.parts.head.includes('crested') || params.parts.head.includes('crowned');

    const head = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 0.65, 8, 16),
      this.createMaterial(palette[1] || palette[0], profile),
    );
    head.rotation.z = Math.PI / 2;
    head.position.set(1.35, 0.25, 0);
    this.markMesh(head, 'head');
    this.group.add(head);

    const snoutGeometry = hasBeak ? new THREE.ConeGeometry(0.12, 0.45, 16) : new THREE.CylinderGeometry(0.12, 0.16, 0.45, 16);
    const snout = new THREE.Mesh(
      snoutGeometry,
      this.createMaterial(hasBeak ? palette[2] || palette[1] : palette[1] || palette[0], profile),
    );
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(1.72, 0.22, 0);
    this.markMesh(snout, 'snout');
    this.group.add(snout);

    if (hasHorns || hasCrest) {
      const hornMaterial = this.createMaterial(palette[2] || palette[1], profile, { roughness: 0.35, metalness: 0.18 });
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 12), hornMaterial);
        horn.position.set(1.26, 0.55, side * 0.18);
        horn.rotation.x = side * 0.12;
        horn.rotation.z = 0.2;
        this.markMesh(horn);
        this.group.add(horn);
      }
    }

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0x333333,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.1,
    });
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), eyeMaterial);
      eye.position.set(1.48, 0.32, side * 0.17);
      this.markMesh(eye);
      this.group.add(eye);
    }
  }

  private buildLimbs(
    anchor: AnchorSpecies,
    params: AppearanceParams,
    palette: THREE.Color[],
    profile: MaterialProfile,
  ): void {
    const limbCount = Math.min(params.parts.limbs.length, 4);
    if (limbCount === 0 || anchor.biology.locomotion.includes('aquatic')) {
      return;
    }

    const pairCount = limbCount >= 4 ? 2 : 1;
    const xPositions = pairCount === 2 ? [0.45, -0.5] : [0.05];

    for (const x of xPositions) {
      for (const side of [-1, 1]) {
        const upper = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.12, 0.56, 12),
          this.createMaterial(palette[0], profile),
        );
        upper.position.set(x, -0.32, side * 0.4);
        upper.rotation.z = side * 0.09;
        this.markMesh(upper);
        this.group.add(upper);

        const lower = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.08, 0.48, 12),
          this.createMaterial(palette[1] || palette[0], profile, { roughness: profile.roughness + 0.08 }),
        );
        lower.position.set(x, -0.75, side * 0.42);
        lower.rotation.z = side * 0.04;
        this.markMesh(lower);
        this.group.add(lower);

        const paw = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 12, 12),
          this.createMaterial(palette[2] || palette[1] || palette[0], profile),
        );
        paw.scale.set(1.4, 0.65, 1.1);
        paw.position.set(x, -1.02, side * 0.43);
        this.markMesh(paw);
        this.group.add(paw);
      }
    }
  }

  private buildWings(
    _anchor: AnchorSpecies,
    _params: AppearanceParams,
    palette: THREE.Color[],
    profile: MaterialProfile,
  ): void {
    const wingMaterial = this.createMaterial(palette[1] || palette[0], profile, {
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      roughness: 0.65,
      metalness: 0.02,
    });

    const wingGeometry = new THREE.ConeGeometry(0.85, 1.6, 4, 1, true);

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.name = 'wing-left';
    leftWing.position.set(0.1, 0.45, -0.62);
    leftWing.rotation.set(0.08, Math.PI / 2.25, -0.22);
    this.markMesh(leftWing);
    this.group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.name = 'wing-right';
    rightWing.position.set(0.1, 0.45, 0.62);
    rightWing.rotation.set(-0.08, -Math.PI / 2.25, 0.22);
    this.markMesh(rightWing);
    this.group.add(rightWing);
  }

  private buildTail(
    _anchor: AnchorSpecies,
    _params: AppearanceParams,
    palette: THREE.Color[],
    profile: MaterialProfile,
  ): void {
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 1.15, 14),
      this.createMaterial(palette[0], profile),
    );
    tail.name = 'tail';
    tail.position.set(-1.38, -0.04, 0);
    tail.rotation.z = Math.PI / 2;
    this.markMesh(tail);
    this.group.add(tail);
  }

  dispose(): void {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  getGroup(): THREE.Group {
    return this.group;
  }
}

export function renderCreature(scene: THREE.Scene, creature: Creature): CreatureRenderer {
  return new CreatureRenderer(scene, creature);
}
