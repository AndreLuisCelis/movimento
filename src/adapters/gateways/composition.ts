/**
 * Raiz de composição server-side: instancia os gateways reais e injeta nos
 * casos de uso. Importada apenas por route handlers (camada infrastructure).
 */
import type { User } from '@/src/domain/entities/user'
import type { Session } from '@/src/use-cases/ports/session-repository'
import type { PerformanceStats } from '@/src/use-cases/get-performance.use-case'
import { registerUser } from '@/src/use-cases/register-user.use-case'
import { loginUser } from '@/src/use-cases/login-user.use-case'
import { getCurrentUser } from '@/src/use-cases/get-current-user.use-case'
import { getPerformance, recordMovement } from '@/src/use-cases/performance.use-case'
import { JsonUserRepository } from '@/src/adapters/gateways/json-user-repository'
import { JsonSessionRepository } from '@/src/adapters/gateways/json-session-repository'
import { JsonPerformanceRepository } from '@/src/adapters/gateways/json-performance-repository'
import { ScryptPasswordHasher } from '@/src/adapters/gateways/scrypt-password-hasher'

const users = new JsonUserRepository()
const sessions = new JsonSessionRepository()
const performance = new JsonPerformanceRepository()
const hasher = new ScryptPasswordHasher()

export const auth = {
  register: (input: unknown): Promise<User> => registerUser({ users, hasher }, input),
  login: (input: unknown): Promise<User> => loginUser({ users, hasher }, input),
  currentUser: (token: string | null | undefined): Promise<User | null> =>
    getCurrentUser({ users, sessions }, token),
  createSession: (userId: string): Promise<{ token: string; expiresAt: string }> =>
    sessions.create(userId),
  destroySession: (token: string): Promise<void> => sessions.remove(token),
}

export const performanceApi = {
  get: (userId: string): Promise<PerformanceStats> => getPerformance({ performance }, userId),
  record: (userId: string): Promise<PerformanceStats> => recordMovement({ performance }, userId),
}

export type { Session }
