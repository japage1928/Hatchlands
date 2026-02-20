import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { registerServiceWorker, setupInstallPrompt, isInstalledPWA } from './pwa';

type Page = 'home' | 'creatures' | 'explore' | 'marketplace';

function App() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [canInstall, setCanInstall] = React.useState(false);
  const [installPrompt, setInstallPrompt] = React.useState<(() => Promise<void>) | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<Page>('home');

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
                onClick={() => setCurrentPage('explore')}
              >
                🗺️ Explore World
              </button>
              <button 
                className="btn-primary touch-target"
                onClick={() => setCurrentPage('creatures')}
              >
                🎒 My Creatures
              </button>
              <button 
                className="btn-primary touch-target"
                onClick={() => setCurrentPage('marketplace')}
              >
                🏪 Marketplace
              </button>
            </section>
          </>
        )}

        {/* My Creatures Page */}
        {currentPage === 'creatures' && (
          <section className="creatures-page">
            <h2>🎒 My Creatures</h2>
            <p>Your creature collection will appear here.</p>
            <p className="coming-soon">Coming soon...</p>
            <button 
              className="btn-primary"
              onClick={() => setCurrentPage('home')}
            >
              ← Back
            </button>
          </section>
        )}

        {/* Explore World Page */}
        {currentPage === 'explore' && (
          <section className="explore-page">
            <h2>🗺️ Explore World</h2>
            <p>Discover creatures in the world around you.</p>
            <p className="coming-soon">Map and creature discovery coming soon...</p>
            <button 
              className="btn-primary"
              onClick={() => setCurrentPage('home')}
            >
              ← Back
            </button>
          </section>
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
