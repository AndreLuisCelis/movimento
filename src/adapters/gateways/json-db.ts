/**
 * Store de documentos em ficheiro (`data/db.json`) — o store do desenvolvimento
 * local, onde o disco é gravável. Escritas atómicas (tmp + rename) e
 * serializadas numa fila por instância.
 *
 * No Vercel o filesystem é só de leitura: em produção quem serve é o
 * `RedisDocumentStore`, escolhido em `db.ts`.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { DbData, IDocumentStore } from '@/src/adapters/gateways/document-store.interface'

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

const EMPTY: DbData = { users: [], sessions: {}, movements: {} }

async function persist(data: DbData): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  const tmp = `${DB_PATH}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, DB_PATH)
}

export class JsonDocumentStore implements IDocumentStore {
  private cache: DbData | null = null
  private queue: Promise<unknown> = Promise.resolve()

  async read(): Promise<DbData> {
    if (this.cache) return this.cache
    try {
      const raw = await fs.readFile(DB_PATH, 'utf8')
      this.cache = { ...EMPTY, ...(JSON.parse(raw) as Partial<DbData>) }
    } catch {
      this.cache = { ...EMPTY }
    }
    return this.cache
  }

  /** Lê-modifica-escreve com escrita atómica, serializada entre chamadas. */
  mutate<T>(fn: (db: DbData) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read()
      const result = await fn(db)
      await persist(db)
      return result
    })
    this.queue = run.catch(() => undefined)
    return run
  }
}

