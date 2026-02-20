import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { registerServiceWorker, setupInstallPrompt, isInstalledPWA } from './pwa';
import { api } from './api/client';
import { CreatureList } from './components/CreatureList';
import { BreedingUI } from './components/BreedingUI';
import { SpawnList } from './components/SpawnList';
import { EncounterView } from './components/EncounterView';
import { Creature, Spawn, Encounter } from '@hatchlands/shared';

type Page = 'home' | 'creatures' | 'explore' | 'marketplace' | 'breeding' | 'encounter';

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

  React.useEffect(() => {
    // Register service worker
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

    // Setup install prompt
    setupInstallPrompt((promptFn) => {
      setCanInstall(true);
      setInstallPrompt(() => promptFn);
    });
  }, []);

  // Fetch world data when online
  const fetchWorldData = React.useCallback(async () => {
    if (!isOnline) return;
    
    setLoadingWorld(true);
    setWorldError(null);
    try {
      const data = await api.getWorld();
      if (data) {
        setCreatures((data as any).creatures || []);
        setSpawns((data as any).spawns || []);
      }
    } catch (err) {
      console.error('Failed to fetch world data:', err);
      setWorldError(err instanceof Error ? err.message : 'Failed to load world data');
    } finally {
      setLoadingWorld(false);
    }
  }, [isOnline]);

  // Fetch world data on page visits or online status change
  React.useEffect(() => {
    if (isOnline) {
      fetchWorldData();
    }
  }, [isOnline, fetchWorldData]);

  // Start an encounter with a spawn
  const handleStartEncounter = React.useCallback(async (spawn: Spawn) => {
    try {
      setSelectedSpawn(spawn);
      const response = await api.startEncounter(spawn.id);
      setCurrentEncounter(response);
      setCurrentPage('encounter');
    } catch (err) {
      setWorldError(err instanceof Error ? err.message : 'Failed to start encounter');
    }
  }, []);

  // Handle creature captured
  const handleCaptured = React.useCallback(() => {
    fetchWorldData();
    setCurrentPage('creatures');
    setSelectedSpawn(null);
    setCurrentEncounter(null);
  }, [fetchWorldData]);

  // Handle fled encounter
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

  return (
    <div className="app">
      {/* Update Banner */}
      {showUpdateBanner && (
        <div className="update-banner">
          <span>New version available!</span>
          <button onClick={handleRefresh} className="btn-update">Update</button>
        </div>
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">
          ⚠️ You are offline. Some features may be limited.
        </div>
      )}

      <header>
        <h1>🐉 Hatchlands</h1>
        <p>A persistent creature ecosystem</p>
        {isInstalledPWA() && <div className="pwa-badge">📱 Installed</div>}
      </header>
      
      <main>
        {/* Install Prompt */}
        {canInstall && !isInstalledPWA() && (
          <section className="install-prompt">
            <div className="install-content">
              <h3>📲 Install Hatchlands</h3>
              <p>Install our app for the best mobile experience and offline play!</p>
              <button onClick={handleInstall} className="btn-install">
                Add to Home Screen
              </button>
            </div>
          </section>
        )}

        {/* Home Page */}
        {currentPage === 'home' && (
          <>
            <section className="info">
              <h2>Welcome to Hatchlands</h2>
              <p>
                Hatchlands is a location-based multiplayer creature ecosystem where you discover,
                capture, breed, and trade persistent organisms in a shared world.
              </p>
              <ul>
                <li>✨ 15 Anchor Species with unique biology</li>
                <li>🧬 Deterministic genetic system</li>
                <li>🌍 Persistent shared world</li>
                <li>💎 True creature ownership</li>
                <li>🔬 Breeding & lineage system</li>
                <li>🏪 Player-driven marketplace</li>
              </ul>
            </section>

            <section className="actions">
              <button 
                className="btn-primary touch-target"
                onClick={() => {
                  fetchWorldData();
                  setCurrentPage('explore');
                }}
              >
                🗺️ Explore World
              </button>
              <button 
                className="btn-primary touch-target"
                onClick={() => {
                  fetchWorldData();
                  setCurrentPage('creatures');
                }}
              >
                🎒 My Creatures
              </button>
              <button 
                className="btn-primary touch-target"
                onClick={() => {
                  fetchWorldData();
                  setCurrentPage('marketplace');
                }}
              >
                🏪 Marketplace
              </button>
            </section>
          </>
        )}

        {/* My Creatures Page */}
        {currentPage === 'creatures' && (
          <section className="creatures-page">
            <div className="page-header">
              <h2>🎒 My Creatures</h2>
              <button 
                className="btn-secondary"
                onClick={() => setCurrentPage('breeding')}
              >
                🥚 Breed
              </button>
            </div>

            {worldError && (
              <div className="error-message">
                ⚠️ {worldError}
                <button onClick={fetchWorldData} className="btn-small">Retry</button>
              </div>
            )}
            
            <CreatureList 
              creatures={creatures}
              loading={loadingWorld}
              emptyMessage="You haven't captured any creatures yet. Visit the Explore page to find some!"
            />

            <button 
              className="btn-secondary"
              onClick={() => setCurrentPage('home')}
            >
              ← Back Home
            </button>
          </section>
        )}

        {/* Breeding Page */}
        {currentPage === 'breeding' && creatures.length > 0 && (
          <section className="breeding-page">
            <BreedingUI 
              creatures={creatures}
              onBreedingStarted={fetchWorldData}
              onClose={() => setCurrentPage('creatures')}
            />
          </section>
        )}

        {currentPage === 'breeding' && creatures.length === 0 && (
          <section className="breeding-page">
            <div className="empty-breeding">
              <h2>🥚 Breeding</h2>
              <p>You need at least 2 creatures to breed.</p>
              <button 
                className="btn-primary"
                onClick={() => setCurrentPage('creatures')}
              >
                ← Back to Creatures
              </button>
            </div>
          </section>
        )}

        {/* Explore World Page */}
        {currentPage === 'explore' && !currentEncounter && (
          <section className="explore-page">
            <div className="page-header">
              <h2>🗺️ Explore World</h2>
              <button 
                className="btn-secondary"
                onClick={fetchWorldData}
              >
                🔄 Refresh
              </button>
            </div>

            {worldError && (
              <div className="error-message">
                ⚠️ {worldError}
                <button onClick={fetchWorldData} className="btn-small">Retry</button>
              </div>
            )}

            <SpawnList 
              spawns={spawns}
              loading={loadingWorld}
              onSelectSpawn={handleStartEncounter}
            />

            <button 
              className="btn-secondary"
              onClick={() => setCurrentPage('home')}
            >
              ← Back Home
            </button>
          </section>
        )}

        {/* Encounter Modal */}
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

        {/* Marketplace Page */}
        {currentPage === 'marketplace' && (
          <section className="marketplace-page">
            <h2>🏪 Marketplace</h2>
            <p>Trade creatures with other players.</p>
            <p className="coming-soon">Trading and marketplace coming soon...</p>
            <button 
              className="btn-primary"
              onClick={() => setCurrentPage('home')}
            >
              ← Back
            </button>
          </section>
        )}
      </main>

      <footer>
        <p>Hatchlands v1.0.0 | PWA Ready 📱</p>
        <p className="small">Built with TypeScript, React, Three.js, PostgreSQL</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
