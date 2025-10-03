/**
 * Registers the service worker and requests background sync.
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          if ('sync' in registration) {
            registration.sync.register('flush-queue').catch(() => {});
          }
        })
        .catch((error) => console.error('SW registration failed', error));
    });
  }
}
