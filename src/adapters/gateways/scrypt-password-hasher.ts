/** Hash de senhas com scrypt (node:crypto) — formato `s2$<salt>$<hash>` em hex. */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { IPasswordHasher } from '@/src/use-cases/ports/password-hasher'

const scrypt = promisify(scryptCb)
const KEY_LEN = 64

export class ScryptPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const derived = (await scrypt(password, salt, KEY_LEN)) as Buffer
    return `s2$${salt}$${derived.toString('hex')}`
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split('$')
    if (parts.length !== 3 || parts[0] !== 's2') return false
    const [, salt, expectedHex] = parts
    const derived = (await scrypt(password, salt, KEY_LEN)) as Buffer
    const expected = Buffer.from(expectedHex, 'hex')
    if (expected.length !== derived.length) return false
    return timingSafeEqual(derived, expected)
  }
}
