const cacheName = "sobre-ruedas-shell-v14";
const appShell = [
  "/",
  "/index.html",
  "/manifest.webmanifest?v=20260805",
  "/brand/sobre-ruedas-logo.png",
  "/brand/sobre-ruedas-app-icon.png",
  "/icons/sobre-ruedas-192.png?v=20260805",
  "/icons/sobre-ruedas-512.png?v=20260805",
  "/icons/sobre-ruedas-maskable-192.png?v=20260805",
  "/icons/sobre-ruedas-maskable-512.png?v=20260805",
];

const cacheAppShell = async () => {
  const cache = await caches.open(cacheName);
  const response = await fetch("/index.html", { cache: "reload" });
  const html = await response.text();
  const buildAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
  await cache.put("/", new Response(html, response));
  await cache.put("/index.html", new Response(html, response));
  await cache.addAll([...appShell.slice(2), ...buildAssets]);
};

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(cacheName).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
        return response;
      });
      return cached ?? network;
    }),
  );
});
