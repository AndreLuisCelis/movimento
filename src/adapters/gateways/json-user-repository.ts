/** Repositório de utilizadores sobre o store JSON. */
import { randomUUID } from 'node:crypto'
import type { User, UserRecord } from '@/src/domain/entities/user'
import type { IUserRepository } from '@/src/use-cases/ports/user-repository'
import { mutate, read } from '@/src/adapters/gateways/json-db'

export class JsonUserRepository implements IUserRepository {
  async create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const record: UserRecord = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      createdAt: new Date().toISOString(),
    }
    await mutate((db) => {
      db.users.push(record)
    })
    return record
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const db = await read()
    return db.users.find((user) => user.email === email) ?? null
  }

  async findById(id: string): Promise<User | null> {
    const db = await read()
    return db.users.find((user) => user.id === id) ?? null
  }
}
