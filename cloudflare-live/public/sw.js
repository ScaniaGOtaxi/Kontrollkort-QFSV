// Only the public offline page and icons are cached. Reports, API responses,
// admin pages and login sessions always use the network.
const CACHE='qfsv-offline-v1';
const FILES=['/offline.html','/offline.css','/icon-192.png','/icon-512.png','/icon-maskable-512.png','/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('qfsv-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate')event.respondWith(fetch(request).catch(async()=>await caches.match('/offline.html')||new Response('Du är offline. Anslut till internet och försök igen.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})));
 else if(FILES.includes(url.pathname))event.respondWith(fetch(request).catch(()=>caches.match(url.pathname)));
});
