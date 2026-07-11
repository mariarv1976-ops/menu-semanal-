var CACHE = 'menu-v2';
var FILES = ['./index.html', './manifest.json'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(FILES); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  // El HTML: primero la red, la caché solo si no hay conexión.
  // Así siempre veis la última versión, pero la app sigue funcionando sin datos.
  if (e.request.mode === 'navigate' || e.request.url.indexOf('index.html') !== -1) {
    e.respondWith(
      fetch(e.request).then(function(r) {
        var copia = r.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, copia); });
        return r;
      }).catch(function() {
        return caches.match(e.request, {cacheName: CACHE});
      })
    );
    return;
  }
  // El resto (iconos, manifest): primero la caché.
  e.respondWith(
    caches.match(e.request, {cacheName: CACHE}).then(function(r) {
      return r || fetch(e.request);
    })
  );
});
