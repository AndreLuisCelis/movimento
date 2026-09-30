export type Session = {
  userId: string
  expiresAt: string
}

export interface ISessionRepository {
  /** Cria a sessão e devolve o token bruto — guardado apenas no cookie httpOnly. */
  create(userId: string): Promise<{ token: string; expiresAt: string }>
  findByToken(token: string): Promise<Session | null>
  remove(token: string): Promise<void>
}
