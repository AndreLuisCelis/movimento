import { User } from '@/src/domain/entities/user'
import { normalizeEmail } from '@/src/domain/value-objects/credentials'
import type { IPasswordHasher } from '@/src/use-cases/ports/password-hasher.interface'
import type { IUserRepository } from '@/src/use-cases/ports/user-repository.interface'
import { InvalidCredentialsError } from '@/src/use-cases/auth-errors'

export class LoginUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  /**
   * Autentica por e-mail + senha e devolve a entidade.
   * Mensagem única de erro para não revelar qual campo falhou.
   */
  async execute(input: unknown): Promise<User> {
    const payload = (input ?? {}) as Record<string, unknown>

    let email: string
    try {
      email = normalizeEmail(payload.email)
    } catch {
      throw new InvalidCredentialsError()
    }
    if (typeof payload.password !== 'string' || !payload.password) throw new InvalidCredentialsError()

    const user = await this.userRepo.findByEmail(email)
    if (!user) throw new InvalidCredentialsError()

    const ok = await this.hasher.verify(payload.password, user.passwordHash)
    if (!ok) throw new InvalidCredentialsError()

    return user
  }
}
