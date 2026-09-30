/**
 * Store de documentos sobre Upstash Redis (REST) — usado onde o disco não é
 * gravável, como no Vercel. Guarda o mesmo documento `DbData` do store de
 * ficheiro, num único valor JSON (`movimento:db`).
 *
 * Sem cache local de propósito: cada instância serverless é efémera e o Redis
 * é a única fonte de verdade. `mutate` serializa as escritas desta instância;
 * entre instâncias vence o último `SET` (suficiente para um PWA pessoal).
 */
import { Redis } from '@upstash/redis'
import type { DbData, IDocumentStore } from '@/src/adapters/gateways/document-store.interface'

const DB_KEY = 'movimento:db'
const EMPTY: DbData = { users: [], sessions: {}, movements: {} }

export class RedisDocumentStore implements IDocumentStore {
  private readonly redis: Pick<Redis, 'get' | 'set'>
  private queue: Promise<unknown> = Promise.resolve()

  constructor(url: string, token: string, redis?: Pick<Redis, 'get' | 'set'>) {
    this.redis = redis ?? new Redis({ url, token })
  }

  async read(): Promise<DbData> {
    const stored = await this.redis.get<Partial<DbData>>(DB_KEY)
    return { ...EMPTY, ...(stored ?? {}) }
  }

  mutate<T>(fn: (db: DbData) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read()
      const result = await fn(db)
      await this.redis.set(DB_KEY, db)
      return result
    })
    this.queue = run.catch(() => undefined)
    return run
  }
}
