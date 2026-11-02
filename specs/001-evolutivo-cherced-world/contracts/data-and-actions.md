# Contrato: datos privados, Server Actions y HTTP

**Dueños**: interfaces y fakes en L0 · implementación Mongo y acciones en L3 · **Estado**: interfaces y
firmas se congelan al cerrar L0

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
export function getRepos(): Repos   // L0: devuelve fakes en memoria; L3: Mongo cuando hay MONGODB_INTEGRAL_DB
```

- Tipos de registro, estados y proyecciones según [data-model.md](../data-model.md) §2.
- L0 entrega `lib/data/memory/*` (fakes) y `tests/contract/repos.contract.ts` (suite compartida).
- L3 entrega `lib/data/mongo/*` y corre la misma suite contra ambas implementaciones.
- `getRepos()` (L0) lee una fábrica registrada. L3 registra la de Mongo en `lib/data/mongo/register.ts`,
  que importa `lib/data/index.ts` sin que L0 tenga que editarlo.

## Resultado de acciones (`lib/actions/result.ts`, L0)

```ts
export type ActionError = 'validation' | 'rate_limited' | 'unavailable' | 'unauthorized' | 'not_found' | 'consent_required'
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError; fieldErrors?: Record<string, string>; retryAfterMs?: number }
```

## Esquemas compartidos (`lib/validation/`, L0)

`contactSchema`, `commentSchema`, `passwordSchema`, `setupSchema` y `replySchema` en zod, con los límites
de FR-030, FR-049 y FR-073. Los usan tanto los formularios (cliente) como las acciones (servidor).

## Server Actions (firmas congeladas por L0, implementación L3)

| Archivo | Acción | Notas |
|---------|--------|-------|
| `lib/actions/contact.ts` | `submitContact(prev, formData): Promise<ActionResult>` | Campo trampa `website`, `renderedAt`, `consent` |
| `lib/actions/comments.ts` | `submitComment(prev, formData): Promise<ActionResult>` | `postId` oculto; queda `pending` |
| `lib/actions/comments.ts` | `getApprovedComments(postId): Promise<PublicComment[]>` | La llama el server component del post (L4) |
| `lib/actions/auth.ts` | `login`, `logout`, `completeSetup`, `changePassword` | `requireAdmin()` exportado desde `lib/auth/` |
| `lib/actions/admin.ts` | `setMessageStatus`, `deleteMessage`, `setCommentStatus`, `setCommentReply`, `deleteComment` | Todas llaman `requireAdmin()` primero |

L0 deja cada archivo con la firma final y un cuerpo que responde `{ ok: false, error: 'unavailable' }`,
así L1 y L4 pueden integrar formularios y probar contra fakes desde el primer día.

## HTTP

| Método y ruta | Dueño | Respuesta |
|---------------|-------|-----------|
| `GET /api/admin/updates?since=<iso>` | L3 | 401 sin sesión; 200 `{ now, unread, pending, messages: MessageRecord[], comments: CommentRecord[] }` |
| `GET /api/search-index/[lang]` | L5 | 200 JSON estático (`force-static`), solo contenido público |
| `GET\|POST /api/contactMe`, `/api/blog/**`, `/api/sockets/**`, `/api/customCMS`, `/api/projects/**` | L3 | **410 Gone** (rutas 2023 retiradas tras el corte) |
