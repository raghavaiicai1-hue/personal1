/* Offline shell for Rahul's To-do Tracker. Keeps the page itself so it opens with no internet.
   Your data is NOT stored here: it lives in the browser storage of this device and in your Google Sheet. */
const V = 'rtt-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;                                   // the sync calls (POST) always go straight to Google
  const u = new URL(r.url);
  if (u.hostname.endsWith('script.google.com') || u.hostname.endsWith('googleusercontent.com')) return;
  if (r.mode === 'navigate') {                                       // page: newest when online, saved copy when not
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put('index.html', c)); return res; })
      .catch(() => caches.match('index.html').then(m => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => {                         // fonts, icon, manifest: saved copy first, refreshed in the background
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; }).catch(() => m);
    return m || net;
  }));
});
