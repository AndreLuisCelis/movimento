'use client'

import { useCallback, useEffect, useState } from 'react'

export type PerformanceStat = {
  date: string
  count: number
}

export type PerformanceStats = {
  todayCount: number
  lastMovement: string | null
  goal: number
  streakDays: number
  totalMovements: number
  week: PerformanceStat[]
}

export function usePerformanceReport() {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance', { cache: 'no-store' })
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        setError(payload.error ?? 'Não foi possível carregar o relatório.')
        setStats(null)
        setLoading(false)
        return null
      }

      const payload = (await response.json().catch(() => ({}))) as { stats?: PerformanceStats }
      setStats(payload.stats ?? null)
      setError(null)
      setLoading(false)
      return payload.stats ?? null
    } catch {
      setError('Não foi possível carregar o relatório.')
      setStats(null)
      setLoading(false)
      return null
    }
  }, [])

  const recordMovement = useCallback(async () => {
    try {
      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const payload = (await response.json().catch(() => ({}))) as { stats?: PerformanceStats; error?: string }
      if (!response.ok) {
        throw new Error(payload.error ?? 'Não foi possível registrar o movimento.')
      }

      setStats(payload.stats ?? null)
      setError(null)
      return payload.stats ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível registrar o movimento.'
      setError(message)
      return null
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { stats, loading, error, refresh, recordMovement }
}
