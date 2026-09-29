export type MovementRecord = {
  /** ISO 8601 (hora local do servidor). */
  at: string
}

export interface IPerformanceRepository {
  listByUser(userId: string): Promise<MovementRecord[]>
  append(userId: string, record: MovementRecord): Promise<void>
}
