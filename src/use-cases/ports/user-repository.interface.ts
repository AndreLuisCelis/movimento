import type { User } from '@/src/domain/entities/user'

export interface IUserRepository {
  /** Persiste a entidade já montada pelo caso de uso (cria ou atualiza por id). */
  save(user: User): Promise<void>
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
}
