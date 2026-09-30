/**
 * Raiz de composição server-side: instancia os gateways reais, injeta-os nos
 * casos de uso (camada adapters) e expõe a fachada consumida pelos route
 * handlers. Importada apenas pela camada infrastructure.
 */
import { toPublicUser, type PublicUser } from '@/src/domain/entities/user'
import type { PerformanceStats } from '@/src/use-cases/get-performance.use-case'
import type { Session } from '@/src/use-cases/ports/session-repository.interface'
import { RegisterUserUseCase } from '@/src/use-cases/register-user.use-case'
import { LoginUserUseCase } from '@/src/use-cases/login-user.use-case'
import { GetCurrentUserUseCase } from '@/src/use-cases/get-current-user.use-case'
import { GetPerformanceUseCase } from '@/src/use-cases/get-performance.use-case'
import { RecordMovementUseCase } from '@/src/use-cases/record-movement.use-case'
import { JsonUserRepository } from '@/src/adapters/gateways/json-user-repository'
import { JsonSessionRepository } from '@/src/adapters/gateways/json-session-repository'
import { JsonPerformanceRepository } from '@/src/adapters/gateways/json-performance-repository'
import { ScryptPasswordHasher } from '@/src/adapters/gateways/scrypt-password-hasher'

const users = new JsonUserRepository()
const sessions = new JsonSessionRepository()
const performance = new JsonPerformanceRepository()
const hasher = new ScryptPasswordHasher()

const registerUser = new RegisterUserUseCase(users, hasher)
const loginUser = new LoginUserUseCase(users, hasher)
const getCurrentUser = new GetCurrentUserUseCase(users, sessions)
const getPerformance = new GetPerformanceUseCase(performance)
const recordMovement = new RecordMovementUseCase(performance)

/** Fachada de autenticação: os casos de uso devolvem entidades, aqui projetadas para fora sem o hash. */
export const auth = {
  register: async (input: unknown): Promise<PublicUser> => toPublicUser(await registerUser.execute(input)),
  login: async (input: unknown): Promise<PublicUser> => toPublicUser(await loginUser.execute(input)),
  currentUser: async (token: string | null | undefined): Promise<PublicUser | null> => {
    const user = await getCurrentUser.execute(token)
    return user ? toPublicUser(user) : null
  },
  createSession: (userId: string): Promise<{ token: string; expiresAt: string }> => sessions.create(userId),
  destroySession: (token: string): Promise<void> => sessions.remove(token),
}

export const performanceApi = {
  get: (userId: string): Promise<PerformanceStats> => getPerformance.execute(userId),
  record: (userId: string): Promise<PerformanceStats> => recordMovement.execute(userId),
}

export type { Session }

