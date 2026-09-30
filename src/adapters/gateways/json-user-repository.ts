/** Repositório de utilizadores sobre o store JSON. */
import { User } from '@/src/domain/entities/user'
import type { IUserRepository } from '@/src/use-cases/ports/user-repository.interface'
import { mutate, read, type UserRecord } from '@/src/adapters/gateways/json-db'

/** Converte a entidade na forma plana guardada em disco. */
function toRecord(user: User): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
  }
}

/** Hidrata a entidade a partir do registo em disco. */
function toEntity(record: UserRecord): User {
  return new User(record.id, record.name, record.email, record.passwordHash, record.createdAt)
}

export class JsonUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    const record = toRecord(user)
    await mutate((db) => {
      const index = db.users.findIndex((item) => item.id === record.id)
      if (index >= 0) db.users[index] = record
      else db.users.push(record)
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = await read()
    const record = db.users.find((user) => user.email === email)
    return record ? toEntity(record) : null
  }

  async findById(id: string): Promise<User | null> {
    const db = await read()
    const record = db.users.find((user) => user.id === id)
    return record ? toEntity(record) : null
  }
}
