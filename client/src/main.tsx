import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { isAxiosError } from 'axios';
import './index.css';
import { registerServiceWorker, setupInstallPrompt, isInstalledPWA } from './pwa';
import { api } from './api/client';
import { CreatureList } from './components/CreatureList';
import { BreedingUI } from './components/BreedingUI';
import { SpawnList } from './components/SpawnList';
import { EncounterView } from './components/EncounterView';
import { Creature, Spawn, Encounter, AnchorId, ANCHOR_SPECIES } from '@hatchlands/shared';
import { getAnchorDisplayName } from './utils/anchors';

type Page = 'home' | 'creatures' | 'explore' | 'marketplace' | 'breeding' | 'encounter';

const getRequestErrorMessage = (err: unknown, fallback: string) => {
  if (!isAxiosError(err)) {
    return err instanceof Error ? err.message : fallback;
  }

  if (err.code === 'ERR_NETWORK') {
    return 'Cannot reach server. Start the backend on port 3000 or set VITE_API_URL.';
  }

  const apiError = (err.response?.data as any)?.error;
  if (typeof apiError === 'string' && apiError.trim()) {
    return apiError;
  }

  return err.message || fallback;
};

const createDemoCreature = (
  id: string,
  anchor: AnchorId,
  status: Creature['status'],
  level: number,
  seed: number,
): Creature => {
  const species = ANCHOR_SPECIES[anchor];

  return {
    id,
    seed,
    primaryAnchor: anchor,
    genomeSignature: {
      primaryGenes: [seed % 97, (seed * 3) % 89, (seed * 7) % 83],
      mutations: [],
      generation: 0,
    },
    appearanceParams: {
      parts: {
        body: species.anatomy.bodyParts[0] || 'scaled_body',
        head: species.anatomy.headTypes[0] || 'horned_head',
        limbs: species.anatomy.limbTypes.length > 0 ? species.anatomy.limbTypes.slice(0, 2) : ['clawed_legs', 'clawed_legs'],
        tail: species.anatomy.tailTypes[0],
        wings: species.anatomy.wingTypes?.slice(0, 2),
      },
      colorIndices: [0, 1, 2],
      materials: species.materials.slice(0, 2),
      scale: 1,
      procedural: {
        roughness: 0.5,
        metalness: 0.1,
      },
    },
    ownerId: status === 'captured' ? 'demo-player' : undefined,
    status,
    lineageHistory: [],
    capturedAt: status === 'captured' ? Date.now() - 3600_000 : undefined,
    birthTimestamp: Date.now() - 86_400_000,
    xp: level * 120,
    level,
    nickname: status === 'captured' ? `${getAnchorDisplayName(anchor)} #${id.slice(-2)}` : undefined,
  };
};

const buildDemoWorld = () => {
  const now = Date.now();
  const creatureA = createDemoCreature('demo-c-001', 'dragon', 'captured', 12, 1001);
  const creatureB = createDemoCreature('demo-c-002', 'griffin', 'captured', 8, 1002);
  const spawnA = createDemoCreature('demo-s-001', 'serpent', 'wild', 5, 2001);
  const spawnB = createDemoCreature('demo-s-002', 'phoenix', 'wild', 9, 2002);
  const spawnC = createDemoCreature('demo-s-003', 'unicorn', 'wild', 4, 2003);

  const spawns: Spawn[] = [spawnA, spawnB, spawnC].map((creature, index) => ({
    id: `demo-spawn-${index + 1}`,
    seed: creature.seed + 500,
    regionId: 'demo-region',
    timeWindow: {
      start: now - 15 * 60_000,
      end: now + 45 * 60_000,
    },
    creature,
    spawnedAt: now - (index + 1) * 120_000,
    expiresAt: now + (index + 1) * 900_000,
    locked: false,
  }));

  return {
    creatures: [creatureA, creatureB],
    spawns,
  };
};

const createDemoOffspring = (parentA: Creature, parentB: Creature): Creature => {
  const now = Date.now();
  const seed = (parentA.seed * 31 + parentB.seed * 17 + now) % 1_000_000_007;
  const primaryAnchor = Math.random() > 0.5 ? parentA.primaryAnchor : parentB.primaryAnchor;
  const secondaryAnchor = parentA.primaryAnchor === parentB.primaryAnchor
    ? undefined
    : (Math.random() > 0.5 ? parentA.primaryAnchor : parentB.primaryAnchor);

  return {
    id: `demo-offspring-${now}`,
    seed,
    primaryAnchor,
    secondaryAnchor,
    genomeSignature: {
      primaryGenes: [...parentA.genomeSignature.primaryGenes.slice(0, 3)],
      secondaryGenes: [...(parentB.genomeSignature.primaryGenes || []).slice(0, 3)],
      mutations: [seed % 13],
      generation: Math.max(parentA.genomeSignature.generation, parentB.genomeSignature.generation) + 1,
    },
    appearanceParams: {
      parts: {
        body: parentA.appearanceParams.parts.body,
        head: parentB.appearanceParams.parts.head,
        limbs: parentA.appearanceParams.parts.limbs.slice(0, 2),
        tail: parentA.appearanceParams.parts.tail || parentB.appearanceParams.parts.tail,
        wings: parentA.appearanceParams.parts.wings || parentB.appearanceParams.parts.wings,
      },
      colorIndices: [0, 1, 2],
      materials: [...new Set([...(parentA.appearanceParams.materials || []), ...(parentB.appearanceParams.materials || [])])].slice(0, 3),
      scale: Math.max(0.85, Math.min(1.2, (parentA.appearanceParams.scale + parentB.appearanceParams.scale) / 2)),
      procedural: {
        roughness: ((parentA.appearanceParams.procedural.roughness || 0.5) + (parentB.appearanceParams.procedural.roughness || 0.5)) / 2,
        metalness: ((parentA.appearanceParams.procedural.metalness || 0.1) + (parentB.appearanceParams.procedural.metalness || 0.1)) / 2,
      },
    },
    ownerId: 'demo-player',
    status: 'captured',
    lineageHistory: [
      {
        creatureId: `demo-offspring-${now}`,
        generation: Math.max(parentA.genomeSignature.generation, parentB.genomeSignature.generation) + 1,
        timestamp: now,
        parentA: parentA.id,
        parentB: parentB.id,
      },
    ],
    capturedAt: now,
    birthTimestamp: now,
    xp: 0,
    level: 1,
    nickname: `${getAnchorDisplayName(primaryAnchor)} Cub`,
  };
};

function App() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [canInstall, setCanInstall] = React.useState(false);
  const [installPrompt, setInstallPrompt] = React.useState<(() => Promise<void>) | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<Page>('home');

  // World state
  const [creatures, setCreatures] = React.useState<Creature[]>([]);
  const [spawns, setSpawns] = React.useState<Spawn[]>([]);
  const [currentEncounter, setCurrentEncounter] = React.useState<Encounter | null>(null);
  const [selectedSpawn, setSelectedSpawn] = React.useState<Spawn | null>(null);
  const [loadingWorld, setLoadingWorld] = React.useState(false);
  const [worldError, setWorldError] = React.useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = React.useState(false);

  React.useEffect(() => {
    registerServiceWorker({
      onSuccess: () => {
        console.log('PWA ready for offline use');
      },
      onUpdate: () => {
        setShowUpdateBanner(true);
      },
      onOffline: () => {
        setIsOnline(false);
      },
      onOnline: () => {
        setIsOnline(true);
      },
    });

    setupInstallPrompt((promptFn) => {
      setCanInstall(true);
      setInstallPrompt(() => promptFn);
    });
  }, []);

  const fetchWorldData = React.useCallback(async () => {
    if (!isOnline) return;
    if (isDemoMode) return;

    setLoadingWorld(true);
    setWorldError(null);
    try {
      const data = await api.getWorld();
      if (data) {
        const ownedCreatures = (data as any).ownedCreatures || (data as any).creatures || [];
        const nearbyCreatures = (data as any).nearbyCreatures || (data as any).spawns || [];
        setCreatures(ownedCreatures);
        setSpawns(nearbyCreatures);
        setIsDemoMode(false);
      }
    } catch (err) {
      console.error('Failed to fetch world data:', err);
      const demoWorld = buildDemoWorld();
      setCreatures(demoWorld.creatures);
      setSpawns(demoWorld.spawns);
      setIsDemoMode(true);
      setWorldError('Demo mode enabled (no backend server).');
    } finally {
      setLoadingWorld(false);
    }
  }, [isOnline, isDemoMode]);

  React.useEffect(() => {
    if (isOnline) {
      fetchWorldData();
    }
  }, [isOnline, fetchWorldData]);

  const handleStartEncounter = React.useCallback(async (spawn: Spawn) => {
    if (isDemoMode) {
      const now = Date.now();
      setSelectedSpawn(spawn);
      setCurrentEncounter({
        id: `demo-enc-${spawn.id}`,
        playerId: 'demo-player',
        spawnId: spawn.id,
        creatureId: spawn.creature.id,
        startedAt: now,
        expiresAt: now + 5 * 60_000,
        resolved: false,
      });
      setCurrentPage('encounter');
      return;
    }

    try {
      setSelectedSpawn(spawn);
      const response = await api.startEncounter(spawn.id);
      setCurrentEncounter(response);
      setCurrentPage('encounter');
    } catch (err) {
      setWorldError(getRequestErrorMessage(err, 'Failed to start encounter'));
    }
  }, [isDemoMode]);

  const handleCaptured = React.useCallback(() => {
    if (isDemoMode && selectedSpawn) {
      const capturedCreature: Creature = {
        ...selectedSpawn.creature,
        status: 'captured',
        ownerId: 'demo-player',
        capturedAt: Date.now(),
      };
      setCreatures((prev) => prev.some((c) => c.id === capturedCreature.id) ? prev : [capturedCreature, ...prev]);
      setSpawns((prev) => prev.filter((s) => s.id !== selectedSpawn.id));
    } else {
      fetchWorldData();
    }

    setCurrentPage('creatures');
    setSelectedSpawn(null);
    setCurrentEncounter(null);
  }, [fetchWorldData, isDemoMode, selectedSpawn]);

  const handleFled = React.useCallback(() => {
    setCurrentPage('explore');
    setSelectedSpawn(null);
    setCurrentEncounter(null);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt();
      setCanInstall(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDemoBreeding = React.useCallback(async (parentA: Creature, parentB: Creature) => {
    const offspring = createDemoOffspring(parentA, parentB);
    setCreatures((prev) => [offspring, ...prev]);
  }, []);

  const navigateTo = (page: Page) => {
    if (page === 'explore' || page === 'creatures' || page === 'marketplace') {
      fetchWorldData();
    }
    setCurrentPage(page);
  };

  return (
    <div className="app">
      {showUpdateBanner && (
        <div className="update-banner">
          <span>New version available!</span>
          <button onClick={handleRefresh} className="btn-update">Update</button>
        </div>
      )}

      {!isOnline && (
        <div className="offline-banner">
          You are offline. Some features may be limited.
        </div>
      )}

      <header>
        <h1>Hatchlands</h1>
        <p>A persistent creature ecosystem</p>
        {isInstalledPWA() && <div className="pwa-badge">Installed</div>}
      </header>

      <main>
        {canInstall && !isInstalledPWA() && (
          <section className="install-prompt">
            <div className="install-content">
              <h3>Install Hatchlands</h3>
              <p>Install our app for the best mobile experience and offline play.</p>
              <button onClick={handleInstall} className="btn-install">
                Add to Home Screen
              </button>
            </div>
          </section>
        )}

        <div className="main-layout">
          <aside className="sidebar-nav">
            <button
              className={`btn-primary touch-target nav-btn ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => navigateTo('home')}
            >
              Home
            </button>
            <button
              className={`btn-primary touch-target nav-btn ${currentPage === 'explore' ? 'active' : ''}`}
              onClick={() => navigateTo('explore')}
            >
              Explore World
            </button>
            <button
              className={`btn-primary touch-target nav-btn ${currentPage === 'creatures' ? 'active' : ''}`}
              onClick={() => navigateTo('creatures')}
            >
              My Creatures
            </button>
            <button
              className={`btn-primary touch-target nav-btn ${currentPage === 'marketplace' ? 'active' : ''}`}
              onClick={() => navigateTo('marketplace')}
            >
              Marketplace
            </button>
          </aside>

          <div className="content-area">
            {currentPage === 'home' && (
              <section className="home-panel">
                <h2>Select a mode</h2>
                <p>Use the sidebar to explore, manage creatures, or open the marketplace.</p>
              </section>
            )}

            {currentPage === 'creatures' && (
              <section className="creatures-page">
                <div className="page-header">
                  <h2>My Creatures</h2>
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentPage('breeding')}
                  >
                    Breed
                  </button>
                </div>

                {worldError && (
                  <div className="error-message">
                    {worldError}
                    <button onClick={fetchWorldData} className="btn-small">Retry</button>
                  </div>
                )}

                <CreatureList
                  creatures={creatures}
                  loading={loadingWorld}
                  emptyMessage="You haven't captured any creatures yet. Visit the Explore page to find some!"
                />
              </section>
            )}

            {currentPage === 'breeding' && creatures.length > 0 && (
              <section className="breeding-page">
                <BreedingUI
                  creatures={creatures}
                  onBreedingStarted={fetchWorldData}
                  onStartBreeding={isDemoMode ? handleDemoBreeding : undefined}
                  onClose={() => setCurrentPage('creatures')}
                />
              </section>
            )}

            {currentPage === 'breeding' && creatures.length === 0 && (
              <section className="breeding-page">
                <div className="empty-breeding">
                  <h2>Breeding</h2>
                  <p>You need at least 2 creatures to breed.</p>
                  <button
                    className="btn-primary"
                    onClick={() => setCurrentPage('creatures')}
                  >
                    Back to Creatures
                  </button>
                </div>
              </section>
            )}

            {currentPage === 'explore' && !currentEncounter && (
              <section className="explore-page">
                <div className="page-header">
                  <h2>Explore World</h2>
                  <button
                    className="btn-secondary"
                    onClick={fetchWorldData}
                  >
                    Refresh
                  </button>
                </div>

                {worldError && (
                  <div className="error-message">
                    {worldError}
                    <button onClick={fetchWorldData} className="btn-small">Retry</button>
                  </div>
                )}

                <SpawnList
                  spawns={spawns}
                  loading={loadingWorld}
                  onSelectSpawn={handleStartEncounter}
                />
              </section>
            )}

            {currentPage === 'encounter' && selectedSpawn && currentEncounter && (
              <div className="modal-overlay">
                <EncounterView
                  spawn={selectedSpawn}
                  encounter={currentEncounter}
                  onCaptured={handleCaptured}
                  onFled={handleFled}
                  onClose={handleFled}
                />
              </div>
            )}

            {currentPage === 'marketplace' && (
              <section className="marketplace-page">
                <h2>Marketplace</h2>
                <p>Trade creatures with other players.</p>
                <p className="coming-soon">Trading and marketplace coming soon...</p>
              </section>
            )}
          </div>
        </div>
      </main>

      <footer>
        <p>Hatchlands v1.0.0 | PWA Ready</p>
        <p className="small">Built with TypeScript, React, Three.js, PostgreSQL</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
