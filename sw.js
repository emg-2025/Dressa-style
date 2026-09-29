/* Dressa — Service Worker
   Coque de l'app en cache (ouverture hors-ligne) ; les données Supabase ne sont JAMAIS mises en cache. */
const VERSION = 'dressa-v1';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const PRECACHE = [
  './index.html', './client.html', './espace.html', './offline.html', './pwa.js',
  './manifest-atelier.webmanifest', './manifest-client.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
// Ressources tierces utiles pour l'affichage : mises en cache à la volée
const CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Supabase (API, auth, storage) et tout autre domaine inconnu : réseau direct, jamais de cache
  if (url.origin !== location.origin && !CDN_HOSTS.includes(url.hostname)) return;

  // Pages : réseau d'abord (contenu à jour), repli sur le cache, puis page hors-ligne
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { caches.open(SHELL).then(c => c.put(req, res.clone())); return res; })
        .catch(async () =>
          (await caches.match(req, { ignoreSearch: true })) || (await caches.match('./offline.html')))
    );
    return;
  }

  // Le reste (JS, CSS, polices, icônes) : cache d'abord + mise à jour en arrière-plan
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque'))
          caches.open(RUNTIME).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
