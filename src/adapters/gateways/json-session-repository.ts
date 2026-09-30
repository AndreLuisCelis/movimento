/**
 * Sessões sobre o store JSON. O token bruto só vive no cookie httpOnly;
 * em disco guarda-se o sha256(token) como chave.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { ISessionRepository, Session } from '@/src/use-cases/ports/session-repository.interface'
import { mutate, read } from '@/src/adapters/gateways/db'

const TTL_DAYS = 30

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export class JsonSessionRepository implements ISessionRepository {
  async create(userId: string): Promise<{ token: string; expiresAt: string }> {
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    await mutate((db) => {
      db.sessions[hashToken(token)] = { userId, expiresAt }
    })
    return { token, expiresAt }
  }

  async findByToken(token: string): Promise<Session | null> {
    if (!token) return null
    const db = await read()
    const session = db.sessions[hashToken(token)]
    if (!session) return null
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await mutate((db2) => {
        delete db2.sessions[hashToken(token)]
      })
      return null
    }
    return session
  }

  async remove(token: string): Promise<void> {
    await mutate((db) => {
      delete db.sessions[hashToken(token)]
    })
  }
}

/** Comparação constante de tokens (defesa adicional na fronteira). */
export function safeEqualToken(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
