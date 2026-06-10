// v4: cache ONLY the static app shell (manifest + icon). v3 cached every
// same-origin GET — including Next.js JS chunks — so installed PWAs kept
// running code from old deployments. Stale clients then called server
// actions whose IDs no longer existed on the server, and Next.js recovered
// with a full page reload (the "tab refreshes when I search" bug).
const CACHE_NAME = "fueltrack-v4";
const APP_SHELL = ["/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // Serve only the precached shell from cache; let the browser handle
  // everything else (Next.js assets carry immutable cache headers already).
  if (url.origin === self.location.origin && APP_SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
  }
});

// ── Push notifications ─────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: "FuelTrack", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "FuelTrack", {
      body:    payload.body  ?? "",
      icon:    "/icon.svg",
      badge:   "/icon.svg",
      tag:     payload.tag  ?? "fueltrack",
      data:    { url: payload.url ?? "/app/dashboard" },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/app/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
