import { toPublicUser, type User } from '@/src/domain/entities/user'
import type { ISessionRepository } from '@/src/use-cases/ports/session-repository'
import type { IUserRepository } from '@/src/use-cases/ports/user-repository'

type Deps = {
  users: IUserRepository
  sessions: ISessionRepository
}

/** Resolve o utilizador da sessão (token do cookie) ou null. Sessão expirada/inválida → null. */
export async function getCurrentUser(deps: Deps, token: string | null | undefined): Promise<User | null> {
  if (!token) return null
  const session = await deps.sessions.findByToken(token)
  if (!session) return null
  const user = await deps.users.findById(session.userId)
  return user ? toPublicUser(user) : null
}
