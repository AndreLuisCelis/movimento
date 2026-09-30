import { User } from '@/src/domain/entities/user'
import type { ISessionRepository } from '@/src/use-cases/ports/session-repository.interface'
import type { IUserRepository } from '@/src/use-cases/ports/user-repository.interface'

export class GetCurrentUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
  ) {}

  /** Resolve o utilizador da sessão (token do cookie) ou null. Sessão expirada/inválida → null. */
  async execute(token: string | null | undefined): Promise<User | null> {
    if (!token) return null
    const session = await this.sessionRepo.findByToken(token)
    if (!session) return null
    return this.userRepo.findById(session.userId)
  }
}
