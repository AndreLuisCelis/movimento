'use client'

import { useEffect } from 'react'
import { Button } from '@carbon/react'
import { useRouter } from 'next/navigation'
import { useAuthSession } from '@/src/adapters/view-models/use-auth-session'
import { PerformanceReport } from '@/src/infrastructure/components/performance-report'
import { MovimentoApp } from '@/components/movimento-app'
import '@/app/movimento.scss'

export function DashboardShell() {
  const router = useRouter()
  const { user, loading, signOut } = useAuthSession()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, router, user])

  if (loading || !user) {
    return <div style={{ padding: 24 }}>Carregando painel...</div>
  }

  return (
    <main id="main-content" className="page-main">
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, padding: '8px 5vw', borderBottom: '1px solid var(--cds-border-subtle-01)', background: 'var(--cds-background)' }}>
        <span style={{ color: 'var(--cds-text-secondary)', fontSize: 14 }}>{user.name}</span>
        <Button kind="ghost" size="sm" onClick={() => void signOut()}>Sair</Button>
      </div>

      <MovimentoApp />

      <section style={{ padding: '0 5vw 48px', background: 'var(--cds-background)' }}>
        <PerformanceReport />
      </section>
    </main>
  )
}
