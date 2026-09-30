/** Registos de desempenho sobre o store JSON. */
import type { IPerformanceRepository, MovementRecord } from '@/src/use-cases/ports/performance-repository.interface'
import { mutate, read } from '@/src/adapters/gateways/db'

const MAX_RECORDS_PER_USER = 5000

export class JsonPerformanceRepository implements IPerformanceRepository {
  async listByUser(userId: string): Promise<MovementRecord[]> {
    const db = await read()
    return db.movements[userId] ?? []
  }

  async append(userId: string, record: MovementRecord): Promise<void> {
    await mutate((db) => {
      const list = (db.movements[userId] ??= [])
      list.push(record)
      if (list.length > MAX_RECORDS_PER_USER) list.splice(0, list.length - MAX_RECORDS_PER_USER)
    })
  }
}
