import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { registerServiceWorker, setupInstallPrompt, isInstalledPWA } from './pwa';
import { CreatureList } from './components/CreatureList';
import { CreatureDetail } from './components/CreatureDetail';
import { BreedingUI } from './components/BreedingUI';
import { SpawnList } from './components/SpawnList';
import { EncounterView } from './components/EncounterView';
import { Creature, Spawn, Encounter } from '@hatchlands/shared';
import { game } from './local/game';
import { OFFLINE_RULES, WorldState, getReleaseReward } from './local/LocalGame';
import { getAnchorDisplayName } from './utils/anchors';

type Page = 'home' | 'creatures' | 'explore' | 'breeding' | 'encounter';

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const formatCountdown = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

function App() {
  const [canInstall, setCanInstall] = React.useState(false);
  const [installPrompt, setInstallPrompt] = React.useState<(() => Promise<void>) | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<Page>('home');

  const [world, setWorld] = React.useState<WorldState>(() => game.getWorld());
  const [now, setNow] = React.useState(Date.now());
  const [currentEncounter, setCurrentEncounter] = React.useState<(Encounter & { captureChance: number }) | null>(null);
  const [selectedSpawn, setSelectedSpawn] = React.useState<Spawn | null>(null);
  const [selectedCreature, setSelectedCreature] = React.useState<Creature | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const refreshWorld = React.useCallback(() => setWorld(game.getWorld()), []);

  React.useEffect(() => {
    registerServiceWorker({
      onSuccess: () => console.log('PWA ready for offline use'),
      onUpdate: () => setShowUpdateBanner(true),
    });
    setupInstallPrompt((promptFn) => {
      setCanInstall(true);
      setInstallPrompt(() => promptFn);
    });
  }, []);

  // 1s tick: drives breeding countdowns and rolls spawns over on the hour.
  React.useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setWorld((w) => (t >= w.nextSpawnRefreshAt ? game.getWorld() : w));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleStartEncounter = React.useCallback((spawn: Spawn) => {
    try {
      setSelectedSpawn(spawn);
      setCurrentEncounter(game.startEncounter(spawn.id));
      setCurrentPage('encounter');
    } catch (err) {
      setNotice(errorMessage(err, 'Failed to start encounter'));
      refreshWorld();
    }
  }, [refreshWorld]);

  const handleCaptureAttempt = React.useCallback(async () => {
    if (!currentEncounter || !selectedSpawn) throw new Error('No encounter');
    const result = game.capture({ encounterId: currentEncounter.id, spawnId: selectedSpawn.id });
    refreshWorld();
    return result;
  }, [currentEncounter, selectedSpawn, refreshWorld]);

  const endEncounter = (page: Page) => {
    setCurrentPage(page);
    setSelectedSpawn(null);
    setCurrentEncounter(null);
    refreshWorld();
  };

  const handleFled = () => {
    if (currentEncounter) game.flee(currentEncounter.id);
    endEncounter('explore');
  };

  const handleStartBreeding = React.useCallback(async (a: Creature, b: Creature) => {
    game.startBreeding({ parentAId: a.id, parentBId: b.id });
    refreshWorld();
  }, [refreshWorld]);

  const handleHatch = (breedingId: string) => {
    try {
      const baby = game.completeBreeding(breedingId);
      setNotice(`An egg hatched: a new ${getAnchorDisplayName(baby.primaryAnchor)}!`);
    } catch (err) {
      setNotice(errorMessage(err, 'Could not hatch'));
    }
    refreshWorld();
  };

  const handleCreatureAction = (action: 'breed' | 'release' | 'nickname') => {
    if (!selectedCreature) return;
    if (action === 'breed') {
      setSelectedCreature(null);
      setCurrentPage('breeding');
      return;
    }
    if (action === 'release') {
      const reward = getReleaseReward(selectedCreature);
      if (!window.confirm(`Release this creature for ${reward} coins?`)) return;
      try {
        game.releaseCreature(selectedCreature.id);
        setNotice(`Released. +${reward} coins.`);
        setSelectedCreature(null);
      } catch (err) {
        setNotice(errorMessage(err, 'Could not release'));
      }
      refreshWorld();
    }
  };

  const handleDailyBonus = () => {
    try {
      const amount = game.claimDailyBonus();
      setNotice(`Daily bonus: +${amount} coins.`);
    } catch (err) {
      setNotice(errorMessage(err, 'Bonus unavailable'));
    }
    refreshWorld();
  };

  const handleResetSave = () => {
    if (!window.confirm('Start a new game? This erases your local save.')) return;
    game.reset();
    setNotice('New game started.');
    refreshWorld();
    setCurrentPage('home');
  };

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt();
      setCanInstall(false);
    }
  };

  const navigateTo = (page: Page) => {
    refreshWorld();
    setNotice(null);
    setCurrentPage(page);
  };

  const owned = world.creatures;
  const activeBreeding = world.breeding;

  return (
    <div className="app">
      {showUpdateBanner && (
        <div className="update-banner">
          <span>New version available!</span>
          <button onClick={() => window.location.reload()} className="btn-update">Update</button>
        </div>
      )}

      <header>
        <h1>Hatchlands</h1>
        <p>Catch, collect and breed creatures. Offline single-player.</p>
        <div className="hud">
          <span className="hud-item">🪙 {world.currency} coins</span>
          <span className="hud-item">📚 {owned.length} creatures</span>
          <span className="hud-item">🌿 New spawns in {formatCountdown(world.nextSpawnRefreshAt - now)}</span>
        </div>
        {isInstalledPWA() && <div className="pwa-badge">Installed</div>}
      </header>

      <main>
        {canInstall && !isInstalledPWA() && (
          <section className="install-prompt">
            <div className="install-content">
              <h3>Install Hatchlands</h3>
              <p>Install the app for the best mobile experience and offline play.</p>
              <button onClick={handleInstall} className="btn-install">Add to Home Screen</button>
            </div>
          </section>
        )}

        <div className="main-layout">
          <aside className="sidebar-nav">
            <button className={`btn-primary touch-target nav-btn ${currentPage === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}>
              Home
            </button>
            <button className={`btn-primary touch-target nav-btn ${currentPage === 'explore' ? 'active' : ''}`} onClick={() => navigateTo('explore')}>
              Explore ({world.spawns.length})
            </button>
            <button className={`btn-primary touch-target nav-btn ${currentPage === 'creatures' ? 'active' : ''}`} onClick={() => navigateTo('creatures')}>
              My Creatures
            </button>
            <button className={`btn-primary touch-target nav-btn ${currentPage === 'breeding' ? 'active' : ''}`} onClick={() => navigateTo('breeding')}>
              Breeding{activeBreeding.length > 0 ? ` (${activeBreeding.length})` : ''}
            </button>
          </aside>

          <div className="content-area">
            {notice && (
              <div className="error-message notice-message">
                {notice}
                <button onClick={() => setNotice(null)} className="btn-small">OK</button>
              </div>
            )}

            {currentPage === 'home' && (
              <section className="home-panel">
                <h2>How to play</h2>
                <ol>
                  <li><strong>Explore</strong>: {OFFLINE_RULES.minSpawns}-{OFFLINE_RULES.maxSpawns} wild creatures appear every hour. Each capture attempt costs {OFFLINE_RULES.captureCost} coins; common, low-level creatures are easier.</li>
                  <li><strong>My Creatures</strong>: tap a creature for details. Release one for coins ({OFFLINE_RULES.releaseBase} + {OFFLINE_RULES.releasePerLevel} per level).</li>
                  <li><strong>Breeding</strong>: pair two creatures for {OFFLINE_RULES.breedingCost} coins. The egg hatches in {OFFLINE_RULES.breedingDurationMs / 60000} minutes.</li>
                </ol>
                <p>Your progress is saved on this device.</p>
                <div className="home-actions">
                  <button className="btn-primary" onClick={handleDailyBonus} disabled={!world.dailyBonusAvailable}>
                    {world.dailyBonusAvailable ? `Claim daily bonus (+${OFFLINE_RULES.dailyBonus})` : 'Daily bonus claimed'}
                  </button>
                  <button className="btn-secondary" onClick={handleResetSave}>New game</button>
                </div>
                <p className="small">Caught {world.stats.captured} · Bred {world.stats.bred} · Released {world.stats.released}</p>
              </section>
            )}

            {currentPage === 'creatures' && (
              <section className="creatures-page">
                <div className="page-header">
                  <h2>My Creatures</h2>
                  <button className="btn-secondary" onClick={() => navigateTo('breeding')}>Breed</button>
                </div>
                <CreatureList
                  creatures={owned}
                  onSelectCreature={setSelectedCreature}
                  emptyMessage="You haven't captured any creatures yet. Visit Explore to find some!"
                />
              </section>
            )}

            {selectedCreature && (
              <div className="modal-overlay">
                <CreatureDetail
                  creature={selectedCreature}
                  onClose={() => setSelectedCreature(null)}
                  onSelectAction={handleCreatureAction}
                />
              </div>
            )}

            {currentPage === 'breeding' && (
              <section className="breeding-page">
                {activeBreeding.length > 0 && (
                  <div className="breeding-queue">
                    <h3>Eggs</h3>
                    {activeBreeding.map((req) => {
                      const a = owned.find((c) => c.id === req.parentAId);
                      const b = owned.find((c) => c.id === req.parentBId);
                      const remaining = req.completesAt - now;
                      return (
                        <div key={req.id} className="breeding-egg">
                          <span>
                            🥚 {a ? getAnchorDisplayName(a.primaryAnchor) : '?'} × {b ? getAnchorDisplayName(b.primaryAnchor) : '?'}
                          </span>
                          {remaining > 0 ? (
                            <span>Hatches in {formatCountdown(remaining)}</span>
                          ) : (
                            <button className="btn-primary" onClick={() => handleHatch(req.id)}>Hatch!</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {owned.filter((c) => c.status === 'captured').length >= 2 ? (
                  <BreedingUI
                    creatures={owned}
                    cost={OFFLINE_RULES.breedingCost}
                    durationMinutes={OFFLINE_RULES.breedingDurationMs / 60000}
                    onStartBreeding={handleStartBreeding}
                    onClose={() => setCurrentPage('creatures')}
                  />
                ) : (
                  <div className="empty-breeding">
                    <h2>Breeding</h2>
                    <p>You need at least 2 free creatures to breed. Catch more in Explore.</p>
                    <button className="btn-primary" onClick={() => navigateTo('explore')}>Go Explore</button>
                  </div>
                )}
              </section>
            )}

            {currentPage === 'explore' && !currentEncounter && (
              <section className="explore-page">
                <div className="page-header">
                  <h2>Explore</h2>
                  <span className="small">New spawns in {formatCountdown(world.nextSpawnRefreshAt - now)}</span>
                </div>
                <SpawnList
                  spawns={world.spawns}
                  onSelectSpawn={handleStartEncounter}
                  emptyMessage="You found everything this hour. New creatures arrive on the hour."
                />
              </section>
            )}

            {currentPage === 'encounter' && selectedSpawn && currentEncounter && (
              <div className="modal-overlay">
                <EncounterView
                  spawn={selectedSpawn}
                  captureChance={currentEncounter.captureChance}
                  captureCost={OFFLINE_RULES.captureCost}
                  currency={world.currency}
                  onCapture={handleCaptureAttempt}
                  onCaptured={() => endEncounter('creatures')}
                  onFled={handleFled}
                  onClose={handleFled}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer>
        <p>Hatchlands v1.1.0 · Offline single-player</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
