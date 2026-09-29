import { ValidationError } from '../errors'

export const MIN_PASSWORD_LENGTH = 8

/** Password strength rules. Hashing never happens here — the domain only
 * decides whether a password is acceptable. */
export function assertAcceptablePassword(password: string): void {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`A senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  }
  if (password.length > 128) {
    throw new ValidationError('A senha não pode ter mais de 128 caracteres.')
  }
}
