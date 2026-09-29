import { toPublicUser, type User } from '@/src/domain/entities/user'
import { normalizeEmail } from '@/src/domain/value-objects/credentials'
import type { IPasswordHasher } from '@/src/use-cases/ports/password-hasher'
import type { IUserRepository } from '@/src/use-cases/ports/user-repository'
import { InvalidCredentialsError } from '@/src/use-cases/auth-errors'

type Deps = {
  users: IUserRepository
  hasher: IPasswordHasher
}

/**
 * Autentica por e-mail + senha.
 * Mensagem única de erro para não revelar qual campo falhou.
 */
export async function loginUser(deps: Deps, input: unknown): Promise<User> {
  const payload = (input ?? {}) as Record<string, unknown>

  let email: string
  try {
    email = normalizeEmail(payload.email)
  } catch {
    throw new InvalidCredentialsError()
  }
  if (typeof payload.password !== 'string' || !payload.password) throw new InvalidCredentialsError()

  const record = await deps.users.findByEmail(email)
  if (!record) throw new InvalidCredentialsError()

  const ok = await deps.hasher.verify(payload.password, record.passwordHash)
  if (!ok) throw new InvalidCredentialsError()

  return toPublicUser(record)
}
