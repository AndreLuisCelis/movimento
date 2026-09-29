/**
 * Regras de credenciais — puro TypeScript, zero dependências.
 * Erros de negócio disparados aqui (camada mais interna).
 */

export class InvalidNameError extends Error {
  constructor(detail: string) {
    super(`Nome inválido: ${detail}`)
    this.name = 'InvalidNameError'
  }
}

export class InvalidEmailError extends Error {
  constructor() {
    super('E-mail inválido.')
    this.name = 'InvalidEmailError'
  }
}

export class InvalidPasswordError extends Error {
  constructor(detail: string) {
    super(`Senha inválida: ${detail}`)
    this.name = 'InvalidPasswordError'
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Trim + minúsculas (chave única de identidade do utilizador). Lança InvalidEmailError. */
export function normalizeEmail(raw: unknown): string {
  if (typeof raw !== 'string') throw new InvalidEmailError()
  const email = raw.trim().toLowerCase()
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) throw new InvalidEmailError()
  return email
}

/** Devolve o nome normalizado (trim, 2–60 chars). Lança InvalidNameError. */
export function normalizeName(raw: unknown): string {
  if (typeof raw !== 'string') throw new InvalidNameError('é obrigatório.')
  const name = raw.trim().replace(/\s+/g, ' ')
  if (name.length < 2) throw new InvalidNameError('mínimo de 2 caracteres.')
  if (name.length > 60) throw new InvalidNameError('máximo de 60 caracteres.')
  return name
}

/** Exige 8+ caracteres com pelo menos uma letra e um dígito. Lança InvalidPasswordError. */
export function assertValidPassword(raw: unknown): void {
  if (typeof raw !== 'string') throw new InvalidPasswordError('é obrigatória.')
  if (raw.length < 8) throw new InvalidPasswordError('mínimo de 8 caracteres.')
  if (raw.length > 128) throw new InvalidPasswordError('máximo de 128 caracteres.')
  if (!/[a-zA-ZÀ-ÿ]/.test(raw)) throw new InvalidPasswordError('precisa de pelo menos uma letra.')
  if (!/\d/.test(raw)) throw new InvalidPasswordError('precisa de pelo menos um número.')
}
