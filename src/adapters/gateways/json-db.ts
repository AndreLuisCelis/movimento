/**
 * Store JSON em disco (data/db.json) — implementa as ports sem dependências
 * externas. Escritas atómicas (tmp + rename) e serializadas numa fila.
 * Limite conhecido: instância única do servidor (correcto para este PWA local).
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { UserRecord } from '@/src/domain/entities/user'
import type { Session } from '@/src/use-cases/ports/session-repository'
import type { MovementRecord } from '@/src/use-cases/ports/performance-repository'

export type DbData = {
  users: UserRecord[]
  /** chave = sha256(token) — o token bruto nunca fica em disco. */
  sessions: Record<string, Session>
  movements: Record<string, MovementRecord[]>
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

const EMPTY: DbData = { users: [], sessions: {}, movements: {} }

let cache: DbData | null = null
let queue: Promise<unknown> = Promise.resolve()

async function readDb(): Promise<DbData> {
  if (cache) return cache
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8')
    cache = { ...EMPTY, ...(JSON.parse(raw) as Partial<DbData>) }
  } catch {
    cache = { ...EMPTY }
  }
  return cache
}

async function persist(data: DbData): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  const tmp = `${DB_PATH}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, DB_PATH)
}

/** Lê o store; as mutações devem usar `mutate` para garantir serialização. */
export function read(): Promise<DbData> {
  return readDb()
}

/** Lê-modifica-escreve com escrita atómica, serializada entre chamadas. */
export function mutate<T>(fn: (db: DbData) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb()
    const result = await fn(db)
    await persist(db)
    return result
  })
  queue = run.catch(() => undefined)
  return run
}
