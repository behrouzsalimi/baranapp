const CACHE_NAME = "baran-v7";

const STATIC_PAGES = {
  "/baranapp/": "/baranapp/index.html",
  "/baranapp": "/baranapp/index.html",

  "/baranapp/practice": "/baranapp/practice/index.html",
  "/baranapp/practice/": "/baranapp/practice/index.html",

  "/baranapp/history": "/baranapp/history/index.html",
  "/baranapp/history/": "/baranapp/history/index.html",

  "/baranapp/settings": "/baranapp/settings/index.html",
  "/baranapp/settings/": "/baranapp/settings/index.html",

  "/baranapp/wallet": "/baranapp/wallet/index.html",
  "/baranapp/wallet/": "/baranapp/wallet/index.html",
};

const PRECACHE_URLS = [
  "/baranapp/",
  "/baranapp/index.html",

  "/baranapp/practice/index.html",
  "/baranapp/history/index.html",
  "/baranapp/settings/index.html",
  "/baranapp/wallet/index.html",

  "/baranapp/manifest.webmanifest",

  "/baranapp/icon-192.png",
  "/baranapp/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  /*
   * ---------------------------------------------------------
   * 1. Navigation requests
   * ---------------------------------------------------------
   */

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  /*
   * ---------------------------------------------------------
   * 2. Next.js RSC / internal requests
   * ---------------------------------------------------------
   *
   * These requests should always go directly to the network.
   */

  if (
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Router-State-Tree") ||
    request.headers.has("Next-Router-Prefetch")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  /*
   * ---------------------------------------------------------
   * 3. Static assets
   * ---------------------------------------------------------
   */

  event.respondWith(handleAsset(request));
});

async function handleNavigation(request) {
  const url = new URL(request.url);
  const cache = await caches.open(CACHE_NAME);

  const pagePath = STATIC_PAGES[url.pathname];

  if (pagePath) {
    const cachedPage = await cache.match(pagePath);

    if (cachedPage) {
      return cachedPage;
    }
  }

  const exactCachedPage = await cache.match(request);

  if (exactCachedPage) {
    return exactCachedPage;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();

      eventSafeCachePut(
        cache,
        pagePath || request,
        responseToCache
      );
    }

    return networkResponse;
  } catch (error) {
    return Response.error();
  }
}

async function handleAsset(request) {
  const cache = await caches.open(CACHE_NAME);

  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();

      eventSafeCachePut(
        cache,
        request,
        responseToCache
      );
    }

    return networkResponse;
  } catch (error) {
    return Response.error();
  }
}

function eventSafeCachePut(cache, request, response) {
  cache.put(request, response).catch(() => {
    // Ignore cache failures.
  });
}