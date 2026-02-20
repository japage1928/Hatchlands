import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Creature } from '@hatchlands/shared';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { CreatureRenderer } from '../engine/renderer';

interface CreatureViewerProps {
  creature: Creature;
}

function CreatureMesh({ creature }: { creature: Creature }) {
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const rendererRef = useRef<CreatureRenderer | null>(null);
  const [animationTime, setAnimationTime] = React.useState(0);

  // Add ambient lighting to the scene
  useEffect(() => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    
    directionalLight1.position.set(5, 5, 5);
    directionalLight2.position.set(-5, 5, -5);
    
    sceneRef.current.add(ambientLight, directionalLight1, directionalLight2);
  }, []);

  useEffect(() => {
    if (sceneRef.current && !rendererRef.current) {
      rendererRef.current = new CreatureRenderer(sceneRef.current, creature);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [creature]);

  // Animation loop
  useFrame(() => {
    setAnimationTime(prev => (prev + 0.016) % (Math.PI * 2)); // About 60 FPS
  });

  // Apply subtle animation to creature
  useEffect(() => {
    if (sceneRef.current.children.length > 3) { // Skip lights
      const creature = sceneRef.current.children[3];
      if (creature instanceof THREE.Group || creature instanceof THREE.Object3D) {
        // Gentle bobbing motion
        creature.position.y = Math.sin(animationTime) * 0.1;
        // Subtle rotation for better visibility
        creature.rotation.z = Math.cos(animationTime * 0.5) * 0.05;
      }
    }
  }, [animationTime]);

  return <primitive object={sceneRef.current} />;
}

export const CreatureViewer: React.FC<CreatureViewerProps> = ({ creature }) => {
  return (
    <div style={{ width: '100%', height: '400px', background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />
        <OrbitControls 
          enablePan={true}
          enableRotate={true}
          enableZoom={true}
          autoRotate={true}
          autoRotateSpeed={2}
          minDistance={3}
          maxDistance={10}
        />
        
        <CreatureMesh creature={creature} />
      </Canvas>
    </div>
  );
};
