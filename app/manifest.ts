import type { MetadataRoute } from 'next'

// Served by Next at /manifest.webmanifest and linked automatically from the
// document head. `/manifest.webmanifest` is deliberately the URL used by the
// original Vite PWA build so that browsers which still hold the old cached
// shell no longer 404 on it (see docs/PWA.md).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Movimento — pausas que fazem bem',
    short_name: 'Movimento',
    description:
      'Um companheiro amigável para transformar pausas do dia em movimento, cuidado e energia.',
    lang: 'pt-BR',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#0f62fe',
    categories: ['health', 'lifestyle', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Próximo movimento',
        short_name: 'Movimento',
        description: 'Ir direto para a próxima pausa sugerida',
        url: '/#main-content',
      },
    ],
  }
}
