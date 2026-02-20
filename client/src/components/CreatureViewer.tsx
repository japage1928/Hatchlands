import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Creature } from '@hatchlands/shared';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CreatureRenderer } from '../engine/renderer';

interface CreatureViewerProps {
  creature: Creature;
}

type LoadStatus = 'loading' | 'ready' | 'failed';

const MODEL_NAME_BY_ANCHOR: Record<Creature['primaryAnchor'], string> = {
  dragon: 'ember',
  serpent: 'tide',
  phoenix: 'bloom',
  griffin: 'gale',
  basilisk: 'stone',
  unicorn: 'frost',
  kraken: 'spark',
  chimera: 'venom',
  hydra: 'metal',
  sphinx: 'shadow',
  pegasus: 'lumen',
  manticore: 'beast',
  leviathan: 'mind',
  roc: 'spirit',
  behemoth: 'behemoth',
};

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.dispose());
    } else {
      mesh.material?.dispose();
    }
  });
}

function normalizeModel(scene: THREE.Object3D): THREE.Object3D {
  const model = scene.clone(true);
  model.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
  const targetSize = 2.5;
  model.scale.setScalar(targetSize / maxDimension);

  const centeredBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  centeredBox.getCenter(center);
  model.position.sub(center);

  const groundedBox = new THREE.Box3().setFromObject(model);
  model.position.y += -1.0 - groundedBox.min.y;

  return model;
}

function ProceduralCreatureMesh({ creature }: { creature: Creature }) {
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
  });

  return null;
}

function ModelCreatureMesh({ model }: { model: THREE.Object3D }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    groupRef.current.position.y = Math.sin(t * 1.7) * 0.05;
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    groupRef.current.rotation.z = Math.sin(t * 0.85) * 0.02;
  });

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

function SpriteCreatureMesh({ texture }: { texture: THREE.Texture }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const image = texture.image as HTMLImageElement | undefined;
  const aspect = image && image.width > 0 && image.height > 0 ? image.width / image.height : 1;
  const width = 2.2;
  const height = width / Math.max(aspect, 0.01);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    groupRef.current.position.y = Math.sin(t * 1.6) * 0.05;
    groupRef.current.rotation.y = Math.sin(t * 0.45) * 0.08;
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
          roughness={0.55}
          metalness={0.03}
        />
      </mesh>
    </group>
  );
}

export const CreatureViewer: React.FC<CreatureViewerProps> = ({ creature }) => {
  const modelName = MODEL_NAME_BY_ANCHOR[creature.primaryAnchor];
  const assetBase = import.meta.env.BASE_URL || '/';
  const modelPath = `${assetBase}models/${modelName}.glb`;
  const imagePath = `${assetBase}models/${modelName}.png`;

  const [modelStatus, setModelStatus] = React.useState<LoadStatus>('loading');
  const [imageStatus, setImageStatus] = React.useState<LoadStatus>('loading');
  const [modelScene, setModelScene] = React.useState<THREE.Object3D | null>(null);
  const [spriteTexture, setSpriteTexture] = React.useState<THREE.Texture | null>(null);
  const loadedModelRef = useRef<THREE.Object3D | null>(null);
  const loadedTextureRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    setModelStatus('loading');

    loader.load(
      modelPath,
      (gltf) => {
        if (cancelled) return;
        const preparedModel = normalizeModel(gltf.scene);
        if (loadedModelRef.current) {
          disposeObject3D(loadedModelRef.current);
        }
        loadedModelRef.current = preparedModel;
        setModelScene(preparedModel);
        setModelStatus('ready');
      },
      undefined,
      () => {
        if (cancelled) return;
        setModelScene(null);
        setModelStatus('failed');
      },
    );

    return () => {
      cancelled = true;
    };
  }, [modelPath]);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    setImageStatus('loading');

    loader.load(
      imagePath,
      (texture) => {
        if (cancelled) return;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 4;
        if (loadedTextureRef.current) {
          loadedTextureRef.current.dispose();
        }
        loadedTextureRef.current = texture;
        setSpriteTexture(texture);
        setImageStatus('ready');
      },
      undefined,
      () => {
        if (cancelled) return;
        setSpriteTexture(null);
        setImageStatus('failed');
      },
    );

    return () => {
      cancelled = true;
    };
  }, [imagePath]);

  useEffect(() => {
    return () => {
      if (loadedModelRef.current) {
        disposeObject3D(loadedModelRef.current);
        loadedModelRef.current = null;
      }
      if (loadedTextureRef.current) {
        loadedTextureRef.current.dispose();
        loadedTextureRef.current = null;
      }
    };
  }, []);

  const renderMode = modelStatus === 'ready'
    ? 'model'
    : imageStatus === 'ready'
      ? 'sprite'
      : 'procedural';

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

        {renderMode === 'model' && modelScene && <ModelCreatureMesh model={modelScene} />}
        {renderMode === 'sprite' && spriteTexture && <SpriteCreatureMesh texture={spriteTexture} />}
        {renderMode === 'procedural' && <ProceduralCreatureMesh creature={creature} />}

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
