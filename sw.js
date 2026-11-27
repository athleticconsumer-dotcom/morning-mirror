/* Morning Mirror service worker: offline app shell + push notifications */
const CACHE = 'mm-v19';
const SHELL = ['./', './index.html', './firebase-config.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/badge-96.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Same-origin only: network first (so updates arrive), cache as offline fallback.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    for (const c of list) { if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});

// Firebase Cloud Messaging (data-only messages, we draw the notification ourselves)
try {
  importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: "AIzaSyB4_-YEmQ2gn4hvbWsKtYEJn9ePdCaONUE",
    authDomain: "morning-mirror.firebaseapp.com",
    projectId: "morning-mirror",
    storageBucket: "morning-mirror.firebasestorage.app",
    messagingSenderId: "217229890641",
    appId: "1:217229890641:web:a4fa6687e57d17b8155470"
  });
  firebase.messaging().onBackgroundMessage(p => {
    const d = p.data || {};
    return self.registration.showNotification(d.title || 'Morning Mirror', {
      body: d.body || '', icon: './icons/icon-192.png', badge: './icons/badge-96.png',
      tag: d.tag || 'mm', renotify: true, data: {url: d.url || './'}
    });
  });
} catch (e) { /* offline or blocked: app still works, just no push in this session */ }
