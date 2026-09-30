/* Smoke test do RedisDocumentStore contra um fake in-memory da API REST Upstash.
 *
 * Uso: `node scripts/smoke-redis-store.cjs` (exit 0 = OK).
 * Valida contra o código real de `src/adapters/gateways/redis-db.ts`:
 * leitura inicial vazia, persistência via mutate, e serialização de mutates
 * concorrentes — sem rede externa (o fake HTTP local simula GET/SET).
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')

const DB_KEY = 'movimento:db'

/** Fake mínimo da API REST do Upstash: GET devolve string JSON, SET guarda o body. */
function createFakeUpstash() {
  let stored = null
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      // O SDK envia pipeline: [["GET", key]] ou [["SET", key, value]].
      const pipeline = JSON.parse(body)
      const [[rawCmd, key, value]] = pipeline
      const cmd = String(rawCmd).toUpperCase()
      if (cmd === 'GET' && key === DB_KEY) {
        const payload = stored === null ? null : JSON.stringify(stored)
        res.end(JSON.stringify([{ result: payload }]))
      } else if (cmd === 'SET' && key === DB_KEY) {
        stored = typeof value === 'string' ? JSON.parse(value) : value
        res.end(JSON.stringify([{ result: 'OK' }]))
      } else {
        res.statusCode = 400
        res.end(JSON.stringify({ error: `comando inesperado: ${cmd} ${key}` }))
      }
    })
  })
  return { server, getStored: () => stored }
}

/** Transpila o redis-db.ts real para CJS — o único import com alias é type-only e some na transpilação. */
function loadRealStore() {
  const ts = require('typescript')
  const file = path.join(process.cwd(), 'src', 'adapters', 'gateways', 'redis-db.ts')
  const source = fs.readFileSync(file, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'movimento-')), 'redis-db.cjs')
  fs.writeFileSync(tmp, outputText.replace("require(\"@upstash/redis\")", `require(${JSON.stringify(require.resolve('@upstash/redis'))})`))
  return require(tmp).RedisDocumentStore
}

async function main() {
  const { server, getStored } = createFakeUpstash()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port

  const { Redis } = require('@upstash/redis')
  const RedisDocumentStore = loadRealStore()
  const store = new RedisDocumentStore('http://127.0.0.1:fake', 'smoke', new Redis({ url: `http://127.0.0.1:${port}`, token: 'smoke' }))

  // 1. Leitura inicial vazia.
  assert.deepEqual(await store.read(), { users: [], sessions: {}, movements: {} })

  // 2. Persistência: mutate grava no fake e read devolve o que foi escrito.
  await store.mutate((db) => {
    db.users.push({ id: 'u1', name: 'Smoke', email: 'smoke@x.com', passwordHash: 'h', createdAt: 't' })
  })
  const back = await store.read()
  assert.equal(back.users.length, 1)
  assert.equal(back.users[0].email, 'smoke@x.com')
  assert.equal(getStored().users.length, 1)

  // 3. Mutates concorrentes são serializados (nenhuma escrita perdida).
  await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      store.mutate((db) => {
        db.movements[`user${i}`] = [{ at: `t${i}` }]
      }),
    ),
  )
  const after = await store.read()
  assert.equal(Object.keys(after.movements).length, 5)
  assert.equal(after.users.length, 1)

  server.close()
  console.log('REDIS STORE SMOKE: OK (read vazio, persistência, 5 mutates concorrentes)')
}

main().catch((error) => {
  console.error('REDIS STORE SMOKE: FAIL', error && error.message ? error.message : error)
  process.exit(1)
})
