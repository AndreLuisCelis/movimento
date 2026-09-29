import { ValidationError } from '../errors'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Validates and normalises an e-mail into its canonical form (trimmed,
 * lowercased) so lookups and uniqueness checks are deterministic. */
export function normalizeEmail(raw: string): string {
  const email = (raw ?? '').trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new ValidationError('Informe um e-mail válido.')
  }
  return email
}
