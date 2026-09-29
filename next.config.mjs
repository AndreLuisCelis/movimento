/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    // `includePaths` is what makes the deep `@carbon/styles` Sass imports
    // resolve in webpack mode (see `package.json` scripts): Carbon's packaged
    // Sass uses node_modules-relative imports such as `scss/config`.
    includePaths: ['node_modules'],
    // Carbon's published Sass still uses patterns the latest dart-sass flags
    // as deprecated. Silence those warnings; they are upstream noise.
    silenceDeprecations: ['global-builtin', 'import', 'if-function'],
    quietDeps: true,
  },

  // The legacy Vite build shipped `/favicon.svg`. Keeping that URL alive means
  // browsers still holding the old cached shell do not log a 404 for it while
  // the service worker takes over (see docs/PWA.md).
  async redirects() {
    return [{ source: '/favicon.svg', destination: '/icon.svg', permanent: true }]
  },
}

export default nextConfig
