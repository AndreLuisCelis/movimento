/** Entidade de negócio — puro TypeScript, zero dependências. */

export type User = {
  id: string
  name: string
  email: string
  createdAt: string
}

/** Registro guardado pelo repositório (inclui o segredo, nunca exposto à UI). */
export type UserRecord = User & { passwordHash: string }

/** Projeção segura para a camada externa — nunca inclui passwordHash. */
export function toPublicUser(user: User): User {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
}
