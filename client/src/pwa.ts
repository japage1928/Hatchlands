/**
 * PWA Registration and Service Worker Management
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✓ Service Worker registered:', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('⚠ New content available, please refresh');
                  config?.onUpdate?.(registration);
                }
              });
            }
          });

          config?.onSuccess?.(registration);
        })
        .catch((error) => {
          console.error('✗ Service Worker registration failed:', error);
        });
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('✓ Back online');
      config?.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('✗ Gone offline');
      config?.onOffline?.();
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Check if app can be installed
 */
export function setupInstallPrompt(
  onPromptAvailable: (promptFn: () => Promise<void>) => void
) {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    deferredPrompt = e;
    
    // Provide install function to caller
    onPromptAvailable(async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Install prompt outcome: ${outcome}`);
        deferredPrompt = null;
      }
    });
  });

  window.addEventListener('appinstalled', () => {
    console.log('✓ PWA installed successfully');
    deferredPrompt = null;
  });
}

/**
 * Check if running as installed PWA
 */
export function isInstalledPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Share API - for sharing creatures
 */
export async function shareContent(data: {
  title: string;
  text: string;
  url?: string;
}): Promise<boolean> {
  if ('share' in navigator) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.log('Share cancelled or failed:', error);
      return false;
    }
  }
  return false;
}

/**
 * Check device capabilities
 */
export function getDeviceCapabilities() {
  return {
    isOnline: navigator.onLine,
    hasServiceWorker: 'serviceWorker' in navigator,
    hasNotifications: 'Notification' in window,
    hasShare: 'share' in navigator,
    hasGeolocation: 'geolocation' in navigator,
    hasVibration: 'vibrate' in navigator,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isStandalone: isInstalledPWA(),
  };
}
