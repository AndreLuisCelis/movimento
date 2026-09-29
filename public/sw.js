/* Movimento service worker.
 *
 * Plain JS on purpose: it is served from /public, so it is not bundled and its
 * URL (/sw.js) must stay stable. Bump VERSION to invalidate every cache.
 *
 * Responsibilities:
 *   - take over from any earlier worker (the legacy Vite/Workbox PWA) and
 *     delete caches it left behind, so a stale cached shell is never served;
 *   - keep the app shell available offline;
 *   - never cache Next.js RSC payloads or anything non-GET/cross-origin.
 */
const VERSION = 'v1'
const CACHE_PREFIX = 'movimento-'
const STATIC_CACHE = `${CACHE_PREFIX}static-${VERSION}`
const SHELL_CACHE = `${CACHE_PREFIX}shell-${VERSION}`
const OFFLINE_URL = '/offline.html'

// A single request for the shell is enough: /_next/static/* is content-hashed
// and cached on first use, so nothing build-specific belongs here.
const SHELL_ASSETS = ['/', OFFLINE_URL, '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      await Promise.all(
        SHELL_ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => null)),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_PREFIX))
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/avatars/') ||
    /\.(?:css|js|png|jpg|jpeg|svg|webp|avif|woff2?|ico|webmanifest|json)$/.test(url.pathname)
  )
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response && response.ok) cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true })
    if (cached) return cached
    const shell = await caches.open(SHELL_CACHE)
    const offline = request.mode === 'navigate' ? await shell.match(OFFLINE_URL) : null
    if (offline) return offline
    throw error
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && response.ok) cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Next.js client-side navigation payloads must always be fresh.
  if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE))
    return
  }

  if (isCacheableAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE).catch(() => fetch(request)))
  }
})
