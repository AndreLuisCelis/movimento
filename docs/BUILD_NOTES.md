# Build notes

## Why `npm run dev` / `npm run build` use `--webpack`

This project styles itself with Sass (`app/globals.scss`, `app/movimento.scss`)
and pulls in Carbon Design System's packaged Sass (`@carbon/react` →
`@carbon/styles` → `@carbon/{colors,themes,type,grid,layout,motion,...}`).

**Turbopack (the Next.js 16 default bundler) cannot resolve those Sass imports
on Windows.** Carbon's published Sass resolves its own files with
node_modules-relative URLs such as:

```scss
// node_modules/@carbon/styles/index.scss
@forward 'scss/config';
@use 'scss/generated/tokens';
```

Turbopack loses the importer's filesystem context for files inside
`node_modules`, so the relative lookup is done against the project root and the
compile fails with:

```
Error: Can't find stylesheet to import.
  ╷
8 │ @forward 'scss/config';
  ╵
  node_modules\@carbon\styles\index.scss 8:1  @forward
  node_modules\@carbon\react\index.scss 9:1   @use
  app\globals.scss 5:1                        root stylesheet
```

The same project compiles cleanly with webpack (`next build --webpack`,
`next dev --webpack`) and on Linux/macOS with Turbopack — it is a Windows-only
Turbopack path-resolution bug:

- https://github.com/vercel/next.js/issues/87243 (Turbopack on Windows: Sass `@use`/`@forward` imports fail to resolve paths correctly)
- https://github.com/vercel/next.js/issues/86431 (Turbopack failing to resolve bootstrap imports on Windows)

So `dev` and `build` default to webpack. `dev:turbo` / `build:turbo` are kept
so the Turbopack path can be re-tested (e.g. after a Next.js upgrade):

```bash
npm run dev          # next dev --webpack
npm run build        # next build --webpack
npm run dev:turbo    # next dev      (currently fails on Windows)
npm run build:turbo  # next build    (currently fails on Windows)
```

Delete the two `*:turbo` scripts and switch the defaults back once the upstream
issues are closed.

## Config that must stay in webpack mode

`next.config.mjs` sets `sassOptions.includePaths: ['node_modules']`, which is
how the node_modules-relative Carbon imports above get resolved by
`sass-loader`. Turbopack ignores `sassOptions.includePaths` entirely.

Adding `sassOptions.loadPaths` (which Turbopack *does* honour) was evaluated and
rejected: Carbon's many `_config.scss` / `_breakpoint.scss` partials differ per
package (`@carbon/grid` vs `@carbon/grid/scss/_inlined` vs `@carbon/styles` vs
`@carbon/themes`), so a flat load-path list makes 10+ imports resolve to the
wrong file *silently* instead of failing loudly.

## Verified locally (Next.js 16.3.7, Windows, `sass` 1.100)

| Command | Result |
| --- | --- |
| `npm run build` (`next build --webpack`) | ✅ compiles, generates `/` and `/_not-found` |
| `npm run dev` + `GET /` (`next dev --webpack`) | ✅ HTTP 200 |
| `npm run build:turbo` (`next build`) | ❌ `Can't find stylesheet to import` — stops at `node_modules\@carbon\layout\scss\_spacing.scss 8:1 @forward './generated/fluid-spacing'` |
| `npm start` + `npm run check:pwa` (prod, `scripts/check-pwa.ps1`) | ✅ all checks passed — PWA surface, head metas, manifest, legacy Vite URLs still 404 |

Two facts worth keeping in mind when re-testing Turbopack later:

1. Turbopack *does* honour `sassOptions.loadPaths` (adding it moved the failure
   deeper, into `@carbon/motion` and `@carbon/feature-flags`, instead of failing
   at the first import). It ignores `sassOptions.includePaths`.
2. Nested relative imports between *project* Sass files work fine under
   Turbopack on Windows (`@use './inner'` from a project partial resolves). The
   bug only hits Sass files located inside `node_modules`.

Together with the ambiguous-partials problem above, that is why the fix is
"build with webpack" rather than "add load paths": Carbon's Sass graph contains
several distinct `_config.scss` / `_breakpoint.scss` / `generated/*` files whose
bare URLs collide, and Turbopack's Windows resolver is the only thing that can
pick them correctly — and it does not.

## PWA surface

The app is installable. `app/manifest.ts` serves `/manifest.webmanifest`,
`app/icon.svg` / `app/favicon.ico` / `app/apple-icon.png` supply the icons, and
`public/sw.js` is the service worker (registered in production only by
`components/service-worker-registrar.tsx`).

Two details belong to these build notes:

- `public/sw.js` is served as-is, so it is **not** bundled, transpiled or
  content-hashed — its URL is fixed and any syntax it uses must run in the
  oldest browser target we support. Keep it plain ES2020.
- The manifest is generated at build time, so a stale `/manifest.webmanifest`
  only appears if the build was skipped. The service worker is the one artefact
  that *is* cached aggressively; bump `VERSION` inside `public/sw.js` to
  invalidate it.

`npm run icons` regenerates the PNG/ICO icons from `app/icon.svg`. See
[PWA.md](./PWA.md) for the full contract, the legacy-worker cleanup and the
manual recovery procedure.

