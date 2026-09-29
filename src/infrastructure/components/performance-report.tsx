'use client'

import { Button, InlineNotification, Tile } from '@carbon/react'
import { usePerformanceReport } from '@/src/adapters/view-models/use-performance-report'

export function PerformanceReport() {
  const { stats, loading, error, recordMovement } = usePerformanceReport()

  if (loading) {
    return <div style={{ padding: 24 }}>Carregando relatório...</div>
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <InlineNotification kind="error" title="Relatório indisponível" subtitle={error} />
      </div>
    )
  }

  if (!stats) {
    return <div style={{ padding: 24 }}>Nenhum dado disponível.</div>
  }

  const maxWeek = Math.max(...stats.week.map((item) => item.count), 1)

  return (
    <div style={{ display: 'grid', gap: 20, padding: 24 }}>
      <Tile style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: '#525252', fontWeight: 600 }}>
              Desempenho
            </div>
            <h2 style={{ margin: '8px 0 0', fontSize: 32 }}>Relatório de movimento</h2>
          </div>

          <Button onClick={() => void recordMovement()}>Registrar movimento</Button>
        </div>
      </Tile>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <Tile style={{ padding: 20 }}>
          <div style={{ color: '#525252', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>Hoje</div>
          <div style={{ marginTop: 12, fontSize: 32, fontWeight: 600 }}>{stats.todayCount}</div>
          <div style={{ color: '#525252' }}>de {stats.goal} objetivos</div>
        </Tile>

        <Tile style={{ padding: 20 }}>
          <div style={{ color: '#525252', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>Sequência</div>
          <div style={{ marginTop: 12, fontSize: 32, fontWeight: 600 }}>{stats.streakDays}</div>
          <div style={{ color: '#525252' }}>dias consecutivos</div>
        </Tile>

        <Tile style={{ padding: 20 }}>
          <div style={{ color: '#525252', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>Último</div>
          <div style={{ marginTop: 12, fontSize: 24, fontWeight: 600 }}>{stats.lastMovement ?? '—'}</div>
          <div style={{ color: '#525252' }}>último movimento</div>
        </Tile>

        <Tile style={{ padding: 20 }}>
          <div style={{ color: '#525252', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>Total</div>
          <div style={{ marginTop: 12, fontSize: 32, fontWeight: 600 }}>{stats.totalMovements}</div>
          <div style={{ color: '#525252' }}>registros</div>
        </Tile>
      </div>

      <Tile style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Últimos 7 dias</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 12, alignItems: 'end', minHeight: 170 }}>
          {stats.week.map((day) => (
            <div key={day.date} style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
              <div style={{ height: 120, width: '100%', display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 38,
                    height: `${Math.max((day.count / maxWeek) * 100, day.count > 0 ? 16 : 4)}%`,
                    background: day.count > 0 ? '#0f62fe' : '#e0e0e0',
                    borderRadius: '8px 8px 0 0',
                    minHeight: day.count > 0 ? 12 : 4,
                  }}
                  aria-label={`${day.date}: ${day.count} movimentos`}
                />
              </div>
              <div style={{ fontSize: 11, color: '#525252' }}>{new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{day.count}</div>
            </div>
          ))}
        </div>
      </Tile>
    </div>
  )
}
