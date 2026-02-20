import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Creature } from '@hatchlands/shared';
import { useEffect, useRef } from 'react';
import { CreatureRenderer } from '../engine/renderer';

interface CreatureViewerProps {
  creature: Creature;
}

function CreatureMesh({ creature }: { creature: Creature }) {
  const { scene } = useThree();
  const rendererRef = useRef<CreatureRenderer | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    rendererRef.current?.dispose();
    rendererRef.current = new CreatureRenderer(scene, creature);

    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [scene, creature]);

  useFrame((_, delta) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    timeRef.current += delta;
    const t = timeRef.current;
    const group = renderer.getGroup();

    group.position.y = Math.sin(t * 1.8) * 0.06;
    group.rotation.y = Math.sin(t * 0.55) * 0.18;
    group.rotation.z = Math.sin(t * 0.9) * 0.03;

    const tail = group.getObjectByName('tail');
    if (tail) {
      tail.rotation.y = Math.sin(t * 2.1) * 0.2;
    }

    const wingLeft = group.getObjectByName('wing-left');
    const wingRight = group.getObjectByName('wing-right');
    if (wingLeft && wingRight) {
      wingLeft.rotation.x = 0.08 + Math.sin(t * 2.6) * 0.08;
      wingRight.rotation.x = -0.08 - Math.sin(t * 2.6) * 0.08;
    }
  });

  return null;
}

export const CreatureViewer: React.FC<CreatureViewerProps> = ({ creature }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '400px',
        background: 'radial-gradient(circle at 20% 20%, #1f3f6a 0%, #0f1d32 55%, #0a1224 100%)',
        borderRadius: '14px',
      }}
    >
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#0b1627']} />

        <PerspectiveCamera makeDefault position={[0, 1.25, 5.25]} fov={44} />

        <ambientLight intensity={0.28} />
        <hemisphereLight args={['#9bc8ff', '#1d2740', 0.35]} />

        <directionalLight
          castShadow
          position={[5, 7, 4]}
          intensity={1.2}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.1}
          shadow-camera-far={20}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />
        <directionalLight position={[-4, 2.5, -3]} intensity={0.45} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.26} />
        </mesh>

        <CreatureMesh creature={creature} />

        <OrbitControls
          enablePan={false}
          enableRotate
          enableZoom
          autoRotate
          autoRotateSpeed={1.25}
          minDistance={3}
          maxDistance={8}
          maxPolarAngle={Math.PI * 0.55}
          minPolarAngle={Math.PI * 0.2}
          target={[0, 0.1, 0]}
        />
      </Canvas>
    </div>
  );
};
