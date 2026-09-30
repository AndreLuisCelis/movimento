/**
 * Escolha do store de documentos — detalhe interno dos adapters, decidido uma
 * vez por processo.
 *
 * Com credenciais Redis (integração Upstash no Vercel) usa o
 * `RedisDocumentStore`; sem elas, o `JsonDocumentStore` local (`data/db.json`).
 * `UPSTASH_REDIS_REST_*` é o par injetado pela integração; `KV_REST_API_*`
 * cobre projetos criados antes da migração para o Marketplace.
 */
import type { DbData, IDocumentStore } from '@/src/adapters/gateways/document-store.interface'
import { JsonDocumentStore } from '@/src/adapters/gateways/json-db'
import { RedisDocumentStore } from '@/src/adapters/gateways/redis-db'

let store: IDocumentStore | null = null

function redisCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  return url && token ? { url, token } : null
}

function selectStore(): IDocumentStore {
  const credentials = redisCredentials()
  if (credentials) return new RedisDocumentStore(credentials.url, credentials.token)

  if (process.env.VERCEL) {
    console.warn(
      '[movimento] Sem credenciais Redis: o store de ficheiros não é gravável no Vercel. ' +
        'Ligue a integração Upstash (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).',
    )
  }

  return new JsonDocumentStore()
}

/** Store do processo (criado na primeira utilização). */
function getStore(): IDocumentStore {
  store ??= selectStore()
  return store
}

export function read(): Promise<DbData> {
  return getStore().read()
}

export function mutate<T>(fn: (db: DbData) => T | Promise<T>): Promise<T> {
  return getStore().mutate(fn)
}
