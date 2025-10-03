/* global self, caches, clients, registration */
const CACHE_NAME = 'cleanops-shell-v1';
const API_QUEUE = 'cleanops-api-queue';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

async function enqueueRequest(request) {
  const db = await openQueue();
  const tx = db.transaction(API_QUEUE, 'readwrite');
  const store = tx.objectStore(API_QUEUE);
  const body = await request.clone().text();
  await requestToPromise(store.add({
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now()
  }));
  await transactionDone(tx);
  if ('sync' in registration) {
    registration.sync.register('flush-queue').catch(() => {});
  }
}

async function flushQueue() {
  const db = await openQueue();
  const tx = db.transaction(API_QUEUE, 'readwrite');
  const store = tx.objectStore(API_QUEUE);
  const items = await requestToPromise(store.getAll());
  for (const item of items) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });
      await requestToPromise(store.delete(item.id));
    } catch (error) {
      console.error('Queue flush failed', error);
      break;
    }
  }
  await transactionDone(tx);
}

function openQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cleanops-queue', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(API_QUEUE, { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise(idbRequest) {
  return new Promise((resolve, reject) => {
    idbRequest.onsuccess = () => resolve(idbRequest.result);
    idbRequest.onerror = () => reject(idbRequest.error);
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if ((request.method === 'POST' || request.method === 'PUT') && url.pathname.startsWith('/api')) {
    if (!navigator.onLine) {
      event.respondWith(
        enqueueRequest(request).then(() =>
          new Response(JSON.stringify({ queued: true }), { status: 202, headers: { 'Content-Type': 'application/json' } })
        )
      );
    } else {
      event.respondWith(fetch(request));
    }
    return;
  }

  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).catch(() => caches.match('/')))
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-queue') {
    event.waitUntil(flushQueue());
  }
});

self.addEventListener('online', () => {
  flushQueue();
});
