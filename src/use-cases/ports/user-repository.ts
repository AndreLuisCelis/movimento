import type { User, UserRecord } from '@/src/domain/entities/user'

export interface IUserRepository {
  /** Cria o utilizador (o adaptador gera id/createdAt). Lança EmailAlreadyRegisteredError no caso de uso. */
  create(data: { name: string; email: string; passwordHash: string }): Promise<User>
  findByEmail(email: string): Promise<UserRecord | null>
  findById(id: string): Promise<User | null>
}
