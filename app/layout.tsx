import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { ServiceWorkerRegistrar } from '@/components/service-worker-registrar'
import { SiteHeader } from '@/components/site-header'
import './globals.scss'

export const metadata: Metadata = {
  title: 'Movimento — pausas que fazem bem',
  description:
    'Um companheiro amigável para transformar pausas do dia em movimento, cuidado e energia.',
  applicationName: 'Movimento',
  // Next's `appleWebApp.capable` only renders the standard
  // `mobile-web-app-capable` tag (see next/dist/lib/metadata/metadata.js).
  // iOS Safari honours the Apple-specific tag, which is what the original Vite
  // index.html shipped, so emit it here too — standalone display + the PWA
  // check in scripts/check-pwa.ps1 both rely on it.
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
  appleWebApp: {
    capable: true,
    title: 'Movimento',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
}

// `viewport` (not `metadata`) carries the theme colour in this Next version.
// Carbon Blue 60 matches the app icon and `theme_color` in app/manifest.ts.
export const viewport: Viewport = {
  themeColor: '#0f62fe',
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ServiceWorkerRegistrar />
        <ThemeProvider>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
