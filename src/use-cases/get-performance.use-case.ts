import type { IPerformanceRepository } from '@/src/use-cases/ports/performance-repository'

/** Meta diária de baterias (regra de negócio — a UI nunca a define). */
export const DAILY_GOAL = 6

export type DayStat = {
  /** YYYY-MM-DD (hora local). */
  date: string
  count: number
}

export type PerformanceStats = {
  /** Movimentos registados hoje. */
  todayCount: number
  /** Hora do último movimento (HH:MM) ou null. */
  lastMovement: string | null
  goal: number
  /** Dias consecutivos com pelo menos um movimento (hoje ou ontem conta). */
  streakDays: number
  totalMovements: number
  /** Últimos 7 dias, do mais antigo para o mais recente. */
  week: DayStat[]
}

function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Calcula as métricas de desempenho a partir dos registos brutos. */
export function computeStats(records: { at: string }[], now = new Date()): PerformanceStats {
  const byDay = new Map<string, number>()
  let lastIso: string | null = null

  for (const record of records) {
    const at = new Date(record.at)
    if (Number.isNaN(at.getTime())) continue
    const key = dayKey(at)
    byDay.set(key, (byDay.get(key) ?? 0) + 1)
    if (!lastIso || at > new Date(lastIso)) lastIso = at.toISOString()
  }

  const todayKey = dayKey(now)
  const todayCount = byDay.get(todayKey) ?? 0

  const week: DayStat[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const key = dayKey(date)
    week.push({ date: key, count: byDay.get(key) ?? 0 })
  }

  // Sequência: conta a partir de hoje; se hoje ainda não há movimento, começa ontem.
  let streakDays = 0
  const cursor = new Date(now)
  if (!byDay.has(todayKey)) cursor.setDate(cursor.getDate() - 1)
  while (byDay.has(dayKey(cursor))) {
    streakDays++
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    todayCount,
    lastMovement: lastIso
      ? new Date(lastIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : null,
    goal: DAILY_GOAL,
    streakDays,
    totalMovements: records.length,
    week,
  }
}
