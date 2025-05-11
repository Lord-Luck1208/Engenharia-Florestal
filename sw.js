const CACHE_NAME = 'madeireira-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/registro.html',
  '/painel.html',
  '/cadastro_imovel.html',
  '/cadastro_arvore.html',
  '/selecao_imovel.html',
  '/mapa.html',
  '/filtro_download.html',
  '/usuarios.html',
  '/styles.css',
  '/script.js',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
}); 