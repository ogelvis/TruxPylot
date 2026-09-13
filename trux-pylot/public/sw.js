// TruxPylot PWA Service Worker
// Intentionally kept lightweight: no page/API caching.
// This prevents stale app data while still enabling PWA installation.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Network-first / no custom cache handling.
});
