'use client'

import { useEffect } from 'react'

const SW_URL = '/sw.js'
const PURGE_FLAG = 'movimento:legacy-sw-cleared'

// Caches created by other apps previously served from this origin (the Vite
// build used vite-plugin-pwa, whose Workbox caches are named like this).
const LEGACY_CACHE_PATTERN = /^(?:workbox|vite|next-pwa|precache|runtime)/i

function isOurWorker(scriptURL: string) {
  try {
    return new URL(scriptURL).pathname === SW_URL
  } catch {
    return false
  }
}

function workerUrls(registration: ServiceWorkerRegistration) {
  return [registration.active, registration.installing, registration.waiting]
    .filter((worker): worker is ServiceWorker => Boolean(worker))
    .map((worker) => worker.scriptURL)
}

function isLegacyRegistration(registration: ServiceWorkerRegistration) {
  const urls = workerUrls(registration)
  return urls.length > 0 && urls.every((url) => !isOurWorker(url))
}

/**
 * Registers `/sw.js` in production and, in every environment, evicts service
 * workers left behind by earlier apps on the same origin.
 *
 * Background: this origin previously ran the Vite PWA build, whose service
 * worker precached its own `index.html`. Browsers that still hold it keep
 * replying with that stale shell, which then requests Vite-only URLs
 * (`/@vite/client`, `/src/main.tsx`, `/@react-refresh`) that no longer exist.
 * Purging the foreign registration/caches here makes those clients recover on
 * their own, without asking anyone to clear site data by hand (docs/PWA.md).
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const isDev = process.env.NODE_ENV !== 'production'
    let disposed = false

    const clearLegacyCaches = async () => {
      const keys = await caches.keys()
      const stale = keys.filter(
        (key) => LEGACY_CACHE_PATTERN.test(key) || !key.startsWith('movimento-'),
      )
      await Promise.all(stale.map((key) => caches.delete(key)))
      return stale.length
    }

    const run = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations()
      const legacy = registrations.filter(isLegacyRegistration)
      const wasControlled = Boolean(navigator.serviceWorker.controller)

      if (legacy.length > 0) {
        await Promise.all(legacy.map((registration) => registration.unregister()))
      }

      const alreadyPurged = sessionStorage.getItem(PURGE_FLAG) === '1'
      let purgedCaches = 0
      if (legacy.length > 0 || !alreadyPurged) {
        purgedCaches = await clearLegacyCaches()
        sessionStorage.setItem(PURGE_FLAG, '1')
      }

      if (disposed) return

      // Reloading once drops the previously controlled document so the browser
      // stops hydrating the cached Vite shell. Guarded by sessionStorage so it
      // can never loop.
      if (wasControlled && (legacy.length > 0 || purgedCaches > 0)) {
        disposed = true
        window.location.reload()
        return
      }

      if (isDev) return

      const registration = await navigator.serviceWorker.register(SW_URL, { scope: '/' })

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            installing.postMessage('SKIP_WAITING')
          }
        })
      })
    }

    run().catch((error) => {
      console.warn('[movimento] service worker setup failed', error)
    })

    return () => {
      disposed = true
    }
  }, [])

  return null
}
