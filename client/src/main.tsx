import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { registerServiceWorker, setupInstallPrompt, isInstalledPWA, getDeviceCapabilities } from './pwa';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<(() => Promise<void>) | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(getDeviceCapabilities());

  useEffect(() => {
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

    // Update device info
    setDeviceInfo(getDeviceCapabilities());
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

        <section className="status">
          <h2>System Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <strong>Server:</strong> {isOnline ? 'Ready' : 'Offline'}
            </div>
            <div className="status-item">
              <strong>Database:</strong> PostgreSQL
            </div>
            <div className="status-item">
              <strong>Anchors:</strong> 15 Species
            </div>
            <div className="status-item">
              <strong>Engine:</strong> Deterministic
            </div>
          </div>
        </section>

        <section className="device-info">
          <h2>Device Capabilities</h2>
          <div className="status-grid">
            <div className="status-item">
              <strong>Touch:</strong> {deviceInfo.isTouchDevice ? '✓' : '✗'}
            </div>
            <div className="status-item">
              <strong>Offline:</strong> {deviceInfo.hasServiceWorker ? '✓' : '✗'}
            </div>
            <div className="status-item">
              <strong>Location:</strong> {deviceInfo.hasGeolocation ? '✓' : '✗'}
            </div>
            <div className="status-item">
              <strong>Share:</strong> {deviceInfo.hasShare ? '✓' : '✗'}
            </div>
          </div>
        </section>

        <section className="next-steps">
          <h2>Next Steps</h2>
          <ol>
            <li>Set up the database using <code>database/schema.sql</code></li>
            <li>Configure environment variables in <code>server/.env</code></li>
            <li>Install dependencies: <code>npm install</code></li>
            <li>Start the server: <code>npm run dev:server</code></li>
            <li>
              {deviceInfo.isTouchDevice 
                ? 'Open on your device and tap "Add to Home Screen"'
                : 'Test mobile features using browser dev tools'}
            </li>
          </ol>
        </section>

        {/* Touch-friendly action buttons */}
        <section className="actions">
          <button className="btn-primary touch-target">
            🗺️ Explore World
          </button>
          <button className="btn-primary touch-target">
            🎒 My Creatures
          </button>
          <button className="btn-primary touch-target">
            🏪 Marketplace
          </button>
        </section>
      </main>

      <footer>
        <p>Hatchlands v1.0.0 | PWA Ready 📱</p>
        <p className="small">Built with TypeScript, React, Three.js, PostgreSQL</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
