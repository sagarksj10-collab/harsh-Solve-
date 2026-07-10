// AI Solving Math — Service Worker v1.2
const CACHE = 'aism-v1.2';
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Azeret+Mono:wght@400;700&display=swap'
];

// Install: static assets cache karo
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(STATIC.map(url => c.add(url).catch(()=>{})));
    })
  );
  self.skipWaiting();
});

// Activate: purana cache hatao
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API calls (generativelanguage, openrouter, nvidia): network only, no cache
// - Fonts/static: cache first
// - HTML: network first, fallback to cache
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // API calls — never cache
  if(url.includes('generativelanguage.googleapis.com') ||
     url.includes('openrouter.ai') ||
     url.includes('api.nvidia.com') ||
     url.includes('jsonbin.io') ||
     url.includes('api.telegram.org')) {
    return; // default network
  }

  // Fonts — cache first
  if(url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // HTML + static — network first, cache fallback
  e.respondWith(
    fetch(e.request).then(res => {
      if(res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || new Response(
      '<h2 style="font-family:sans-serif;text-align:center;padding:40px;color:#4f46e5">📡 Offline — Internet nahi hai<br><small>Pehle solve kiye answers history mein dekhein</small></h2>',
      {headers:{'Content-Type':'text/html'}}
    )))
  );
});
