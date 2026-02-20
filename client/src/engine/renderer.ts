/**
 * Deterministic 3D Creature Renderer
 * 
 * Reconstructs creatures from appearance parameters using Three.js
 */

import * as THREE from 'three';
import { Creature, AppearanceParams, AnchorId } from '@hatchlands/shared';
import { ANCHOR_SPECIES } from '@hatchlands/shared';
import { SeededRandom } from '@hatchlands/shared';

export class CreatureRenderer {
  private scene: THREE.Scene;
  private creature: Creature;
  private group: THREE.Group;

  constructor(scene: THREE.Scene, creature: Creature) {
    this.scene = scene;
    this.creature = creature;
    this.group = new THREE.Group();
    this.build();
  }

  /**
   * Build the creature mesh from parameters
   */
  private build(): void {
    const params = this.creature.appearanceParams;
    const anchor = ANCHOR_SPECIES[this.creature.primaryAnchor];
    
    // Get color palette
    const palette = this.getPalette(anchor, params);

    // Build body
    this.buildBody(params, palette);

    // Build head
    this.buildHead(params, palette);

    // Build limbs
    this.buildLimbs(params, palette);

    // Optional wings
    if (params.parts.wings) {
      this.buildWings(params, palette);
    }

    // Optional tail
    if (params.parts.tail) {
      this.buildTail(params, palette);
    }

    // Apply scale
    this.group.scale.set(params.scale, params.scale, params.scale);

    // Add to scene
    this.scene.add(this.group);
  }

  /**
   * Get color palette
   */
  private getPalette(anchor: any, params: AppearanceParams): THREE.Color[] {
    const paletteData = anchor.colorPalettes[0]; // Simplified - would use params.colorIndices
    return paletteData.map((hex: string) => new THREE.Color(hex));
  }

  /**
   * Build body mesh
   */
  private buildBody(params: AppearanceParams, palette: THREE.Color[]): void {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: palette[0],
      roughness: params.procedural.roughness || 0.5,
      metalness: params.procedural.metalness || 0.1,
    });

    const body = new THREE.Mesh(geometry, material);
    body.position.y = 0;
    this.group.add(body);
  }

  /**
   * Build head mesh
   */
  private buildHead(params: AppearanceParams, palette: THREE.Color[]): void {
    const geometry = new THREE.SphereGeometry(0.6, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: palette[1] || palette[0],
      roughness: params.procedural.roughness || 0.5,
    });

    const head = new THREE.Mesh(geometry, material);
    head.position.set(0, 1.2, 0);
    this.group.add(head);

    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 1.3, 0.5);
    this.group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 1.3, 0.5);
    this.group.add(rightEye);
  }

  /**
   * Build limbs
   */
  private buildLimbs(params: AppearanceParams, palette: THREE.Color[]): void {
    const limbCount = Math.min(params.parts.limbs.length, 4);
    
    for (let i = 0; i < limbCount; i++) {
      const geometry = new THREE.CylinderGeometry(0.15, 0.1, 1, 16);
      const material = new THREE.MeshStandardMaterial({
        color: palette[0],
      });

      const limb = new THREE.Mesh(geometry, material);
      
      // Position limbs around body
      const angle = (i / limbCount) * Math.PI * 2;
      limb.position.x = Math.cos(angle) * 0.8;
      limb.position.y = -0.5;
      limb.position.z = Math.sin(angle) * 0.8;
      limb.rotation.z = 0.3;

      this.group.add(limb);
    }
  }

  /**
   * Build wings
   */
  private buildWings(params: AppearanceParams, palette: THREE.Color[]): void {
    const wingGeometry = new THREE.PlaneGeometry(1.5, 2);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: palette[1] || palette[0],
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.8, 0.5, 0);
    leftWing.rotation.y = Math.PI / 4;
    this.group.add(leftWing);

    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.8, 0.5, 0);
    rightWing.rotation.y = -Math.PI / 4;
    this.group.add(rightWing);
  }

  /**
   * Build tail
   */
  private buildTail(params: AppearanceParams, palette: THREE.Color[]): void {
    const geometry = new THREE.ConeGeometry(0.2, 1.5, 16);
    const material = new THREE.MeshStandardMaterial({
      color: palette[0],
    });

    const tail = new THREE.Mesh(geometry, material);
    tail.position.set(0, -0.5, -1);
    tail.rotation.x = Math.PI / 2;
    this.group.add(tail);
  }

  /**
   * Remove from scene
   */
  dispose(): void {
    this.scene.remove(this.group);
    
    // Dispose geometries and materials
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  /**
   * Get the group for animation/manipulation
   */
  getGroup(): THREE.Group {
    return this.group;
  }
}

/**
 * Convenience function to render a creature
 */
export function renderCreature(scene: THREE.Scene, creature: Creature): CreatureRenderer {
  return new CreatureRenderer(scene, creature);
}
