import { toPublicUser, type User } from '@/src/domain/entities/user'
import { assertValidPassword, normalizeEmail, normalizeName } from '@/src/domain/value-objects/credentials'
import type { IPasswordHasher } from '@/src/use-cases/ports/password-hasher'
import type { IUserRepository } from '@/src/use-cases/ports/user-repository'
import { EmailAlreadyRegisteredError } from '@/src/use-cases/auth-errors'

type Deps = {
  users: IUserRepository
  hasher: IPasswordHasher
}

/** Regista um utilizador e devolve a projeção pública (sem hash). */
export async function registerUser(deps: Deps, input: unknown): Promise<User> {
  const payload = (input ?? {}) as Record<string, unknown>
  const name = normalizeName(payload.name)
  const email = normalizeEmail(payload.email)
  assertValidPassword(payload.password)

  if (await deps.users.findByEmail(email)) throw new EmailAlreadyRegisteredError()

  const passwordHash = await deps.hasher.hash(String(payload.password))
  const user = await deps.users.create({ name, email, passwordHash })
  return toPublicUser(user)
}
