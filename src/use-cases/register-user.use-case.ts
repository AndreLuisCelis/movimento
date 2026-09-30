import { User } from '@/src/domain/entities/user'
import { assertValidPassword, normalizeEmail, normalizeName } from '@/src/domain/value-objects/credentials'
import type { IPasswordHasher } from '@/src/use-cases/ports/password-hasher.interface'
import type { IUserRepository } from '@/src/use-cases/ports/user-repository.interface'
import { EmailAlreadyRegisteredError } from '@/src/use-cases/auth-errors'

export class RegisterUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  /** Regista um utilizador e devolve a entidade criada. */
  async execute(input: unknown): Promise<User> {
    const payload = (input ?? {}) as Record<string, unknown>
    const name = normalizeName(payload.name)
    const email = normalizeEmail(payload.email)
    assertValidPassword(payload.password)

    if (await this.userRepo.findByEmail(email)) throw new EmailAlreadyRegisteredError()

    const passwordHash = await this.hasher.hash(String(payload.password))
    // Regra de aplicação: criar o ID e o createdAt de forma automatizada.
    const newUser = new User(crypto.randomUUID(), name, email, passwordHash)

    await this.userRepo.save(newUser)
    return newUser
  }
}
