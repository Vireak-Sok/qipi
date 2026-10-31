const CACHE_NAME = "qipi-static-v1";
const APP_SHELL = [
  "/offline.html", "/offline.css", "/manifest.webmanifest", "/favicon.svg", "/icons.svg",
  "/icons/pwa-180.png", "/icons/pwa-192.png", "/icons/pwa-512.png", "/icons/pwa-maskable-512.png",
  "/styles.css", "/app.js", "/startup.js", "/i18n.js", "/auth.js",
  "/js/api.js", "/js/core.js", "/js/feed.js", "/js/loading.js", "/js/media.js",
  "/js/profile-card.js", "/js/profile-tabs.js", "/js/profile.js", "/js/pwa.js",
  "/js/route-config.js", "/js/routing.js", "/js/safety.js", "/js/search.js",
  "/js/selects.js", "/js/shared.js", "/js/state.js", "/js/trip-card.js",
  "/locales/en.js", "/locales/km.js", "/locales/zh.js",
  "/css/base.css", "/css/community.css", "/css/controls.css", "/css/pages.css",
  "/css/profile-card.css", "/css/responsive.css", "/css/safety.css", "/css/social-polish.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("qipi-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/offline.html")) || Response.error()));
    return;
  }

  const isAppAsset = url.pathname.startsWith("/_next/static/") || /\.(?:js|css|svg|png|webp|woff2)$/.test(url.pathname);
  if (!isAppAsset) return;

  const cacheKey = new Request(url.origin + url.pathname, { method: "GET" });
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(cacheKey, response.clone());
      }
      return response;
    } catch {
      return (await caches.match(cacheKey)) || Response.error();
    }
  })());
});
