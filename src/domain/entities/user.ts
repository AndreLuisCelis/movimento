/**
 * Entidade de negócio — puro TypeScript, zero dependências externas.
 * As invariantes (nome/e-mail válidos) são garantidas no construtor.
 */
import { normalizeEmail, normalizeName } from '@/src/domain/value-objects/credentials'

export class User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly passwordHash: string
  readonly createdAt: string

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    createdAt: string = new Date().toISOString(),
  ) {
    this.id = id
    this.name = normalizeName(name)
    this.email = normalizeEmail(email)
    this.passwordHash = passwordHash
    this.createdAt = createdAt
  }
}

/** Projeção segura para as camadas externas — nunca inclui o passwordHash. */
export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'createdAt'>

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
}
