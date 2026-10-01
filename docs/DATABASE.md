# Banco de dados do Movimento: do ficheiro local ao Redis no Vercel

> TL;DR — localmente, tudo mora num JSON (`data/db.json`).
> No Vercel o disco e **somente leitura**, entao em producao o mesmo
> conteudo mora no **Upstash for Redis**, ativado com 3 cliques no painel.
> O codigo escolhe sozinho qual usar.

## Por que dois lugares para guardar a mesma coisa?

O Movimento guarda tres coisas: **usuarios** (com o hash da senha),
**sessoes** (quem esta logado) e **movimentos** (as baterias concluidas).
Juntas, elas formam um documento com este formato:

```jsonc
{
  "users": [{ "id": "...", "name": "...", "email": "..." }],
  "sessions": { "<sha256-do-token>": { "userId": "...", "expiresAt": "..." } },
  "movements": { "<userId>": [{ "at": "...", "kind": "battery" }] }
}
```

| Ambiente | Onde o documento mora | Por que |
| --- | --- | --- |
| Local (`npm run dev`) | `data/db.json`, na raiz do projeto | Simples, visivel — perfeito para desenvolver |
| Vercel (producao) | **Upstash for Redis**, chave `movimento:db` | No Vercel o filesystem e **somente leitura** (`EROFS`): gravar `db.json` quebra com erro 500 |

Ou seja: o **formato e o mesmo**, so muda a "gaveta".

## Como o codigo escolhe a gaveta (sem voce fazer nada)

```text
route handler (app/api/...)
      │  chama a fachada
      ▼
composition.ts ──► repositorios (user / session / performance)
      │  falam so com o contrato IDocumentStore (read / mutate)
      ▼
db.ts ──► tem UPSTASH_REDIS_REST_URL + TOKEN? ── sim ──► Redis (Upstash)
      │                                              nao
      └────────────────────────────────────────────► ficheiro (data/db.json)
```

- **Os casos de uso nunca ficam sabendo.** Eles conversam com os ports
  (`IUserRepository`, `ISessionRepository`, `IPerformanceRepository`).
- A decisao acontece **uma vez por processo** (`selectStore()` em `db.ts`).
- O `RedisDocumentStore` guarda o documento **inteiro** num unico valor
  JSON (`SET movimento:db`). Simples e suficiente para um PWA pessoal.
- Sem cache local de proposito: cada instancia serverless do Vercel e efemera,
  entao o Redis e sempre lido de novo — a unica fonte de verdade.

### E se eu esquecer de ligar o Redis?

O app **sobe normalmente**, mas qualquer escrita (registrar, logar, concluir
movimento) falha com `500`. Nos **Runtime Logs** do Vercel voce vera:

```text
[movimento] Sem credenciais Redis: o store de ficheiros nao e gravavel no Vercel.
Ligue a integracao Upstash (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
## Passo a passo: ativando o banco no Vercel (3 minutos)

### 1. Conecte a integracao

1. Abra o projeto no [painel da Vercel](https://vercel.com/dashboard).
2. Va em **Storage** → **Marketplace** → procure **"Upstash for Redis"**.
3. Clique em **Add / Connect** e escolha o projeto `movimento`.
4. Aceite criar o banco (o plano free e suficiente para este app).

A integracao injeta sozinha estas variaveis no projeto:

| Variavel | O que e |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Endereco HTTPS do seu banco (API REST, sem porta nem TCP) |
| `UPSTASH_REDIS_REST_TOKEN` | Segredo que autoriza o app a ler e escrever |

Projetos antigos podem receber `KV_REST_API_URL` / `KV_REST_API_TOKEN`
(epoca do "Vercel KV") — o app aceita **os dois pares** (veja `db.ts`).

### 2. Faca redeploy

Variavel de ambiente nova **so vale no proximo deploy**:

1. Va em **Deployments** → clique em **...** no deploy atual → **Redeploy**.
2. Aguarde o build ficar `Ready`.

### 3. Valide que esta no Redis

1. Abra o app publicado e **registre um usuario** → esperado `201`.
2. Faca **login** → esperado `200` (antes da integracao, era aqui que dava o `500`).
3. Conclua um movimento no dashboard e recarregue a pagina — o contador
   deve **persistir** (prova de que o dado atravessou o Redis).

## Usando o Redis localmente (opcional)

Voce **nao precisa** disso para desenvolver — o ficheiro local basta. Mas se
quiser testar o caminho Redis antes de subir:

```bash
cp .env.example .env.local
```

1. Crie um banco free em [upstash.com](https://upstash.com).
2. Cole `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` no `.env.local`.
3. Rode `npm run dev` — a partir dai, tudo vai para o Redis em vez do `db.json`.

Para inspecionar o conteudo, abra o **Data Browser** no painel do Upstash,
procure a chave `movimento:db` e veja o JSON.

## Detalhes tecnicos (para quem vai mexer no codigo)

| Tema | Decisao |
| --- | --- |
| Cliente | `@upstash/redis` via REST/HTTPS — funciona no serverless sem TCP persistente |
| Chave | `movimento:db` (constante `DB_KEY` em `redis-db.ts`) |
| Leitura | `GET` com fallback para documento vazio |
| Escrita | `mutate()`: le, aplica a funcao, faz `SET` do documento inteiro; serializada por instancia |
| Sessoes | O token bruto vive so no cookie `httpOnly`; no store fica o `sha256(token)` com expiracao de 30 dias |
| Segredos | `passwordHash` (scrypt) nunca sai dos adapters: a fachada aplica `toPublicUser()` antes do HTTP |
| Teste local | `npm run smoke:redis-store` — exercita o `RedisDocumentStore` contra um fake HTTP |

## Problemas comuns

| Sintoma | Causa provavel | O que fazer |
| --- | --- | --- |
| `500` no login/register em producao | Deploy sem o gateway **ou** sem a integracao | Deployment → Source (tem `redis-db.ts`?); Runtime Logs (`Sem credenciais Redis` / `EROFS`) |
| `Sem credenciais Redis` nos logs | Integracao nao conectada ou faltou o redeploy | Conecte e faca Redeploy |
| `401` do SDK Upstash | `URL` e `TOKEN` de bancos diferentes ou revogados | Storage → Upstash → reconecte a integracao |
| Timeout / `fetch failed` | Regiao do serverless distante do banco | Crie o banco na regiao mais proxima do deploy (ex.: `iad1`) |

## Onde ler mais

- `src/adapters/gateways/db.ts` — o seletor de store
- `src/adapters/gateways/redis-db.ts` — o store Redis
- `src/adapters/gateways/document-store.interface.ts` — o contrato `IDocumentStore`
- [Documentacao do Upstash Redis](https://upstash.com/docs/redis)

```
