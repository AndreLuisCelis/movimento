import type { IPerformanceRepository } from '@/src/use-cases/ports/performance-repository.interface'
import { computeStats, type PerformanceStats } from '@/src/use-cases/get-performance.use-case'

/** Regista um movimento concluído e devolve as métricas atualizadas. */
export class RecordMovementUseCase {
  constructor(private readonly performanceRepo: IPerformanceRepository) {}

  async execute(userId: string): Promise<PerformanceStats> {
    await this.performanceRepo.append(userId, { at: new Date().toISOString() })
    const records = await this.performanceRepo.listByUser(userId)
    return computeStats(records)
  }
}
