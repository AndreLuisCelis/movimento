/**
 * Contrato interno dos adapters para o store de documentos.
 * `UserRecord`/`DbData` são a forma persistida; a entidade `User` é hidratada
 * pelo repositório (`new User(...)`) e nunca é guardada como classe.
 */
import type { MovementRecord } from '@/src/use-cases/ports/performance-repository.interface'
import type { Session } from '@/src/use-cases/ports/session-repository.interface'

/** Forma plana do utilizador no store (inclui o segredo, nunca exposto à UI). */
export type UserRecord = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export type DbData = {
  users: UserRecord[]
  /** chave = sha256(token) — o token bruto nunca fica guardado. */
  sessions: Record<string, Session>
  movements: Record<string, MovementRecord[]>
}

/** Store de documentos usado pelos repositórios: leitura + mutação serializada. */
export interface IDocumentStore {
  read(): Promise<DbData>
  mutate<T>(fn: (db: DbData) => T | Promise<T>): Promise<T>
}
