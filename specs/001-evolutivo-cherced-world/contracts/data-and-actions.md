# Contrato: datos privados, Server Actions y HTTP

**Dueños**: interfaces y fakes en L0 · implementación Mongo y acciones en L3 · **Estado**: interfaces y
firmas congeladas en el tag `l0-frozen`

## Repositorios (`lib/data/types.ts`, L0)

```ts
export interface MessageRepo {
  create(input: NewMessage): Promise<MessageRecord>
  list(q: { status?: MessageStatus | 'all'; sort: 'newest' | 'oldest' | 'name' }): Promise<MessageRecord[]>
  setStatus(id: string, status: MessageStatus): Promise<boolean>
  remove(id: string): Promise<boolean>
  countUnread(): Promise<number>
  changedSince(since: Date): Promise<MessageRecord[]>
}
export interface CommentRepo {
  create(input: NewComment): Promise<CommentRecord>
  listPublic(postId: string): Promise<PublicComment[]>      // solo approved, sin email
  listForModeration(q: { status?: CommentStatus | 'all' }): Promise<CommentRecord[]>
  setStatus(id: string, status: CommentStatus): Promise<boolean>
  setReply(id: string, text: string | null): Promise<boolean>
  remove(id: string): Promise<boolean>
  countPending(): Promise<number>
  changedSince(since: Date): Promise<CommentRecord[]>
}
export interface AdminRepo {
  getCredential(): Promise<AdminCredential | null>
  createCredential(c: AdminCredential): Promise<boolean>    // false si ya existe
  updateCredential(c: AdminCredential): Promise<void>
  getSetupCode(): Promise<SetupCode | null>
  saveSetupCode(c: SetupCode): Promise<void>
  deleteSetupCode(): Promise<void>
  createSession(s: AdminSession): Promise<void>
  getSession(tokenHash: string): Promise<AdminSession | null>
  touchSession(tokenHash: string, now: Date): Promise<void>
  deleteSession(tokenHash: string): Promise<void>
}
export interface RateLimitRepo {
  hit(key: string, rule: { limit: number; windowMs: number; blockMs?: number }, now: Date): Promise<{ allowed: boolean; retryAfterMs: number }>
  reset(key: string): Promise<void>
}
export interface Repos { messages: MessageRepo; comments: CommentRepo; admin: AdminRepo; rateLimits: RateLimitRepo }
```

Tipos de registro (`NewMessage`, `MessageRecord`, `NewComment`, `CommentRecord`, `PublicComment`,
`AuthorReply`, `AdminCredential`, `SetupCode`, `AdminSession`, `ScryptParams`) según
[data-model.md](../data-model.md) §2, con `id: string` en vez de `_id`. `NewMessage.phone` es
`string | null`; `MessageRecord.phone` admite `number` por los históricos.

### Comportamiento que ambas implementaciones cumplen (lo prueba la suite de contrato)

- **Mensajes**: se crean `unread`. `list` sin `status` o con `'all'` trae todos, archivados incluidos;
  `newest`/`oldest` ordenan por `createdAt`, `name` alfabético. `setStatus` aplica las transiciones de
  data-model (`MESSAGE_TRANSITIONS`: `unread ⇄ read`, `unread|read → archived`, `archived → read`;
  repetir el estado actual es válido) y devuelve `false` si el id no existe o la transición no vale.
- **Comentarios**: se crean `pending` con `authorReply: null`. `listPublic` trae solo `approved` del
  post, del más viejo al más nuevo, como `PublicComment` (sin `email` ni `consentAt`).
  `listForModeration` va del más nuevo al más viejo. Transiciones `COMMENT_TRANSITIONS`
  (`pending → approved | rejected`, `approved ⇄ rejected`). Pasar a `rejected` borra la respuesta del
  autor. `setReply` solo funciona en `approved` (si no, `false`); editarla conserva su `createdAt` y
  `null` la elimina.
- **Cambios**: `changedSince(since)` devuelve los registros con `updatedAt` estrictamente posterior,
  ordenados por `updatedAt` ascendente. Toda escritura actualiza `updatedAt`.
- **Admin**: `createCredential` devuelve `false` si ya hay credencial. `getSession` devuelve lo guardado
  aunque haya vencido (en Mongo el TTL no es instantáneo): quien llama valida `expiresAt`.
  `touchSession(hash, now)` fija `lastActivityAt = now` y `expiresAt = now + SESSION_IDLE_MS` (12 h).
- **Rate limit**: `hit` cuenta un evento. Mientras haya bloqueo vigente responde
  `{ allowed: false, retryAfterMs: <lo que falta> }`. Si la ventana venció (o venció el bloqueo),
  reinicia la cuenta. Dentro de la ventana, `allowed` es `count <= limit`; al superarlo, con `blockMs`
  bloquea durante `blockMs`, y sin `blockMs` responde con lo que falta de la ventana. Uso esperado para
  el login: `hit` antes de verificar la contraseña en cada intento y `reset` al acertar; así el sexto
  intento dentro de 15 min queda bloqueado.
- Los registros devueltos son copias: modificarlos no cambia lo guardado.

### Fábrica (`lib/data/index.ts`, L0)

```ts
export function getRepos(): Repos                               // fakes en memoria si nadie registró otra fábrica
export function registerRepoFactory(factory: () => Repos): void
```

- La instancia y la fábrica viven en `globalThis` (clave `Symbol.for('cherced-world.repos')`), así las
  páginas, las Server Actions y los Route Handlers comparten la misma instancia aunque Next los empaquete
  por separado.
- L3 registra Mongo en `lib/data/mongo/register.ts` (importa `registerRepoFactory` de
  `@/lib/data`) y debe importar ese archivo desde sus puntos de entrada (acciones, layout de `inbox` y
  `app/api/admin/updates`) antes de llamar a `getRepos()`. L0 no tiene que editar nada.
- `lib/data/index.ts` y `lib/data/memory/*` importan `server-only`. `lib/data/types.ts` no, para que un
  Client Component pueda importar tipos como `PublicComment` con `import type`.

### Suite de contrato (`tests/contract/repos.contract.ts`, L0)

```ts
export function runRepoContract(name: string, options: { setup: () => Repos | Promise<Repos>; teardown?: () => void | Promise<void> }): void
```

`setup` corre antes de cada caso y debe entregar repositorios vacíos; `teardown` limpia después. Los ids
inexistentes que usa son `'000000000000000000000000'` (un ObjectId válido). L0 la corre contra memoria
en `tests/unit/l0/memory-repos.test.ts`; L3 la corre contra Mongo.

## Resultado de acciones (`lib/actions/result.ts`, L0)

```ts
export type ActionError = 'validation' | 'rate_limited' | 'unavailable' | 'unauthorized' | 'not_found' | 'consent_required'
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError; fieldErrors?: Record<string, string>; retryAfterMs?: number }
export function ok(): ActionResult<void>
export function ok<T>(data: T): ActionResult<T>
export function fail(error: ActionError, extra?: { fieldErrors?: Record<string, string>; retryAfterMs?: number })
```

## Esquemas compartidos (`lib/validation`, L0)

Zod 4, iguales en el formulario (cliente) y en la acción (servidor):

| Esquema | Campos |
|---------|--------|
| `contactSchema` | `name` 1–60, `email` válido ≤ 100, `phone` opcional (`''` o ausente → `null`; si viene, `^\+?[0-9 ()-]{6,20}$`, se conserva tal cual), `message` 1–1000, `consent` (`'on'`/`'true'`/`true`) |
| `commentSchema` | `postId`, `userName` 1–60, `email` ≤ 100, `comment` 1–1000, `consent` |
| `passwordSchema` | string de 12 a 256 caracteres |
| `setupSchema` | `code` (se normaliza a mayúsculas sin guiones; 8 caracteres de `SETUP_CODE_ALPHABET`), `password`, `confirm` (debe coincidir) |
| `replySchema` | `text` 1–1000 |

- Todos recortan espacios y descartan campos extra (el campo trampa `website` y `renderedAt` los lee la
  acción por su cuenta).
- Los mensajes de error son **claves de i18n** del namespace `common` (`ERROR_KEYS`): `form.required`,
  `form.email.invalid`, `form.tooLong` (interpolar `{max}` con `LIMITS`), `form.phone.invalid`,
  `privacy.required`, `form.password.tooShort` (`{min}`), `form.password.mismatch`,
  `form.code.invalid`.
- Ayudas: `parseForm(schema, formData)` y `parseInput(schema, value)` devuelven
  `{ success: true, data } | { success: false, fieldErrors }` con la primera clave de error por campo;
  también `formDataToObject`, `fieldErrorsFrom`, `normalizeSetupCode`, `LIMITS`, `PHONE_PATTERN`,
  `SETUP_CODE_ALPHABET` (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, sin 0/O, 1/I/L) y `SETUP_CODE_LENGTH`.
  L3 genera el código de configuración con ese alfabeto.

## Server Actions (firmas congeladas por L0, implementación L3)

| Archivo | Acción | Notas |
|---------|--------|-------|
| `lib/actions/contact.ts` | `submitContact(prev: ActionResult \| null, formData: FormData): Promise<ActionResult>` | Campo trampa `website`, `renderedAt`, `consent` |
| `lib/actions/comments.ts` | `submitComment(prev: ActionResult \| null, formData: FormData): Promise<ActionResult>` | `postId` oculto; queda `pending` |
| `lib/actions/comments.ts` | `getApprovedComments(postId: string): Promise<PublicComment[]>` | La llama el server component del post (L4) |
| `lib/actions/auth.ts` | `login`, `logout`, `completeSetup`, `changePassword`, todas `(prev: ActionResult \| null, formData: FormData) => Promise<ActionResult>` | Sirven con `useActionState` y como `action` de un `<form>` sin JS. `requireAdmin()` lo exporta `lib/auth/` (L3) |
| `lib/actions/admin.ts` | `setMessageStatus(id, status: MessageStatus)`, `deleteMessage(id)`, `setCommentStatus(id, status: CommentStatus)`, `setCommentReply(id, text: string \| null)`, `deleteComment(id)`, todas `Promise<ActionResult>` | Todas llaman `requireAdmin()` primero; `text: null` borra la respuesta |

L0 deja cada archivo con la firma final y un cuerpo que responde `{ ok: false, error: 'unavailable' }`
(y `[]` en `getApprovedComments`), así L1 y L4 pueden integrar formularios y probar contra fakes desde
el primer día. `tests/contract/signatures.ts` falla en `npm run typecheck` si una firma cambia.

## HTTP

| Método y ruta | Dueño | Respuesta |
|---------------|-------|-----------|
| `GET /api/admin/updates?since=<iso>` | L3 | 401 sin sesión; 200 `{ now, unread, pending, messages: MessageRecord[], comments: CommentRecord[] }` |
| `GET /api/search-index/[lang]` | L5 | 200 JSON estático (`force-static`), solo contenido público |
| `GET\|POST /api/contactMe`, `/api/blog/**`, `/api/sockets/**`, `/api/customCMS`, `/api/projects/**` | L3 | **410 Gone** (rutas 2023 retiradas tras el corte) |

`proxy.ts` deja pasar todo `/api/**` sin tocarlo.
