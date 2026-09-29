/** Business errors thrown by the domain / use-case layers.
 *
 * They carry no HTTP knowledge: adapters map them to status codes
 * (see adapters/controllers). */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class EmailInUseError extends Error {
  constructor() {
    super('Já existe uma conta com este e-mail.')
    this.name = 'EmailInUseError'
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('E-mail ou senha incorretos.')
    this.name = 'InvalidCredentialsError'
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Sessão inválida ou expirada.')
    this.name = 'UnauthorizedError'
  }
}
