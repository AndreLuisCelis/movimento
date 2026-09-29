# PWA notes

Movimento is installable: `app/manifest.ts` publishes the web app manifest,
`app/icon.svg` + `app/favicon.ico` + `app/apple-icon.png` provide the icons,
and `public/sw.js` is the service worker (registered by
`components/service-worker-registrar.tsx`).

| URL | Served by |
| --- | --- |
| `/manifest.webmanifest` | `app/manifest.ts` (`MetadataRoute.Manifest`) |
| `/icon.svg`, `/favicon.ico`, `/apple-icon.png` | Next metadata file conventions in `app/` |
| `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/maskable-512.png` | `public/icons`, referenced by the manifest |
| `/sw.js` | `public/sw.js` (plain JS, not bundled, URL must stay stable) |
| `/offline.html` | `public/offline.html`, the offline navigation fallback |

Regenerate the PNG/ICO art with `node scripts/generate-pwa-icons.cjs` after
editing `app/icon.svg` (the SVG is the source of truth for the shape).

## Why the service worker also evicts other workers

This origin previously served the Vite PWA build. Its service worker precached
that build's `index.html`, so browsers that still hold it keep replying with the
stale Vite shell. The shell references assets that no longer exist
(`/@vite/client`, `/src/main.tsx`, `/@react-refresh`) which show up as 404s and
make the app look broken even though `next dev` is serving correctly.

`ServiceWorkerRegistrar` therefore runs in **both** environments:

- it unregisters every registration on this origin whose worker script is not
  `/sw.js`, deletes caches that are not prefixed `movimento-`, and reloads the
  page once so the document is no longer served by the old worker;
- in production it then registers `public/sw.js`, which calls `skipWaiting()`
  and `clients.claim()` and purges non-`movimento-` caches on activation;
- in development it stops there — no service worker is registered against the
  dev server, so hot reload is never shadowed by a cache.

A registration that already lives at `/sw.js` cannot be distinguished from ours
by URL, so it is not unregistered: registering our `/sw.js` updates it in place
and the new worker evicts the legacy caches on activate. `sessionStorage`
(`movimento:legacy-sw-cleared`) plus a `disposed` guard keep the reload from
looping.

## Manual recovery (only needed if a browser is still stuck)

1. Close every tab for the origin (a controlling worker cannot be replaced while
   a client is open).
2. Open the app and run in DevTools → Console:

   ```js
   await Promise.all((await navigator.serviceWorker.getRegistrations()).map((r) => r.unregister()))
   await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
   location.reload()
   ```

3. Or DevTools → Application → Service Workers → *Unregister*, then
   Application → Storage → *Clear site data*.

A private window never has service workers, so it is the fastest way to confirm
that a stale worker — rather than the app — is the cause.

## Verifying a change

```bash
npm run build      # next build --webpack
npm start          # production server on :3000
npm run check:pwa  # scripts/check-pwa.ps1 against :3000 (exit 0 = all good)
```

`scripts/check-pwa.ps1` asserts the whole contract: every URL in the table
above returns 200 with the right content type, `/favicon.svg` still answers
308 → `/icon.svg`, the legacy Vite URLs (`/@vite/client`, `/src/main.tsx`) stay
404, the document head carries the installability metas (`rel="manifest"`,
both `*-web-app-capable` tags, `theme-color`, `apple-touch-icon`), and the
manifest advertises the three PNG icons with `display: standalone`. Pass
`-BaseUrl` to check another origin (e.g. the LAN address on a phone).

Bump `VERSION` in `public/sw.js` whenever the caching strategy changes; that
invalidates `movimento-static-*` / `movimento-shell-*` for every client.
