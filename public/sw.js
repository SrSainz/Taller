const cacheName = "sobre-ruedas-shell-v18";
const appShell = [
  "/",
  "/index.html",
  "/manifest.webmanifest?v=20260827",
  "/brand/sobre-ruedas-logo.png",
  "/brand/sobre-ruedas-app-icon.png",
  "/icons/sobre-ruedas-192.png?v=20260827",
  "/icons/sobre-ruedas-512.png?v=20260827",
  "/icons/sobre-ruedas-maskable-192.png?v=20260827",
  "/icons/sobre-ruedas-maskable-512.png?v=20260827",
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

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json?.() ?? {};
  } catch {
    data = { body: event.data?.text?.() ?? "Hay una novedad en la gestión de la flota." };
  }
  const title = data.title || "SOBRE RUEDAS";
  const body = data.body || "Hay una novedad en la gestión de la flota.";
  const targetUrl = data.url || "/#/informes";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: data.icon || "/icons/sobre-ruedas-192.png?v=20260827",
    badge: data.badge || "/icons/sobre-ruedas-maskable-192.png?v=20260827",
    tag: data.tag || "sobre-ruedas-app-change",
    renotify: true,
    data: { url: targetUrl },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/#/informes", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const matchingClient = clientList.find((client) => "focus" in client);
      if (matchingClient) {
        matchingClient.navigate(targetUrl);
        return matchingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
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
    caches.match(request).then((cached) => fetch(request)
      .then((response) => {
        if (response.ok) caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
        return response;
      })
      .catch(() => cached)),
  );
});
