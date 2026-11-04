const CACHE_NAME = "qipi-static-v8";
const MEDIA_CACHE_NAME = "qipi-public-media-v1";
const APP_SHELL = [
  "/offline.html", "/offline.css", "/offline.js", "/manifest.webmanifest", "/favicon.svg", "/icons.svg",
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
    let completed = 0;
    const total = APP_SHELL.length;
    const reportProgress = async () => {
      const clients = await self.clients?.matchAll({ type: "window", includeUncontrolled: true }) || [];
      for (const client of clients) client.postMessage({ type: "QIPI_UPDATE_PROGRESS", cacheName: CACHE_NAME, completed, total, percent: Math.round(completed / total * 100) });
    };
    await reportProgress().catch(() => {});
    await Promise.all(APP_SHELL.map(async (path) => {
      await cache.add(path);
      completed += 1;
      await reportProgress().catch(() => {});
    }));
    // Activate automatically once every app-shell file is cached.
    await self.skipWaiting();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "QIPI_ACTIVATE_UPDATE") event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("qipi-") && ![CACHE_NAME, MEDIA_CACHE_NAME].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/media/")) {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      const cacheControl = response.headers.get("cache-control") || "";
      if (response.ok && response.headers.get("content-type")?.startsWith("image/") && /\bpublic\b/i.test(cacheControl)) {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        await Promise.all(keys.slice(0, Math.max(0, keys.length - 120)).map((key) => cache.delete(key)));
      }
      return response;
    })());
    return;
  }

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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requested = event.notification.data?.url || "/feed";
  let target;
  try {
    target = new URL(requested, self.location.origin);
    if (target.origin !== self.location.origin) target = new URL("/feed", self.location.origin);
  } catch {
    target = new URL("/feed", self.location.origin);
  }
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin !== self.location.origin) continue;
      try { await client.navigate(target.href); } catch { /* Focus the app even when navigation is unavailable. */ }
      return client.focus();
    }
    return self.clients.openWindow(target.href);
  })());
});
