/** Erros de caso de uso (aplicação) — capturados pela infraestrutura. */

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Já existe uma conta com este e-mail.')
    this.name = 'EmailAlreadyRegisteredError'
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('E-mail ou senha incorretos.')
    this.name = 'InvalidCredentialsError'
  }
}
