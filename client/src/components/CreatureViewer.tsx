import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Creature } from '@hatchlands/shared';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { CreatureRenderer } from '../engine/renderer';

interface CreatureViewerProps {
  creature: Creature;
}

function CreatureMesh({ creature }: { creature: Creature }) {
  const sceneRef = useRef<THREE.Scene>(null);
  const rendererRef = useRef<CreatureRenderer | null>(null);

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

  return <primitive object={sceneRef.current} />;
}

export const CreatureViewer: React.FC<CreatureViewerProps> = ({ creature }) => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} />
        <OrbitControls />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        
        <gridHelper args={[10, 10]} />
        
        {/* Creature rendering would be integrated here */}
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#4488ff" />
        </mesh>
      </Canvas>
    </div>
  );
};
