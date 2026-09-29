import type { IPerformanceRepository } from '@/src/use-cases/ports/performance-repository'
import { computeStats, type PerformanceStats } from '@/src/use-cases/get-performance.use-case'

type Deps = { performance: IPerformanceRepository }

/** Métricas de desempenho do utilizador autenticado. */
export async function getPerformance(deps: Deps, userId: string): Promise<PerformanceStats> {
  const records = await deps.performance.listByUser(userId)
  return computeStats(records)
}

/** Regista um movimento concluído e devolve as métricas atualizadas. */
export async function recordMovement(deps: Deps, userId: string): Promise<PerformanceStats> {
  await deps.performance.append(userId, { at: new Date().toISOString() })
  return getPerformance(deps, userId)
}
