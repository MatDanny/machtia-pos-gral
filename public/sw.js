// Trabajador para usar la app sin internet.
//
// OJO: este archivo NO llama a skipWaiting() al instalarse, a proposito.
// Una version nueva se descarga y se queda esperando hasta que el vendedor
// toca "Actualizar" en la app. Asi no se cambia la pagina a media venta.
const CACHE = "mi-negocio-v11";
const BASE = ["/", "/index.html", "/manifest.webmanifest", "/icono.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)));
  // sin skipWaiting: se queda en espera
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// La app pide el cambio cuando el vendedor lo decide.
self.addEventListener("message", (e) => {
  if (e.data && e.data.tipo === "tomar-el-control") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copia = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("/index.html")))
  );
});
