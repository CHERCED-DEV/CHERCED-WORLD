# Data Model: Evolutivo CHERCED-WORLD 2026

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Fecha**: 2026-11-01

Hay dos familias: **contenido** (TypeScript versionado en el repo, público) y **datos privados**
(colecciones en la base existente, solo servidor). Los tipos viven en `content/types.ts` y
`lib/data/types.ts`, y los congela la lane L0.

## 1. Contenido (repo, público)

```ts
type Locale = 'es' | 'en'
type Localized<T = string> = Record<Locale, T>
type ImageRef = { src: string; alt: Localized; width: number; height: number }
```

### SiteContent (`content/site.ts`)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `socials` | `{ id: 'linkedin' \| 'instagram' \| 'github' \| 'email' \| 'facebook'; href: string \| null; label: Localized }[]` | `href: null` = pendiente (P-02): no se renderiza |
| `home` | `{ greeting: Localized; name: string; title: Localized }` | |
| `about.description` | `Localized` | Sección 6.1 del inventario |
| `about.image` | `ImageRef` | Retrato de "Sobre mí" (`meParallax.png`); agregado por L0 antes del congelamiento |
| `about.career` | `CareerEntry[]` | Orden cronológico inverso |
| `about.skills` | `{ description: Localized; bullets: Localized[]; tech: TechSkill[] }` | 13 tecnologías |
| `about.education` | `EducationEntry[]` | |
| `about.courses` | `{ schools: { name: Localized; description: Localized }[]; platzi: { href: string; label: Localized } }` | |
| `about.languages` | `{ id: Locale; name: Localized; progress: number }[]` | 0–100 |
| `services` | `{ intro: Localized; items: { id: 'design' \| 'development' \| 'maintenance'; title: Localized; description: Localized; icon: string }[] }` | |
| `portfolio` | `{ intro: Localized[]; footer: Localized }` | |
| `contact` | `{ title: Localized; description: Localized }` | |
| `blog` | `{ title: Localized; titleStrong: string; welcome: Localized }` | |
| `privacy` | `{ updatedAt: string; sections: { heading: Localized; body: Localized }[] }` | Borrador; P-06 |

```ts
type CareerEntry = {
  id: string; company: string; role: Localized
  start: string            // 'YYYY-MM'
  end: string | null       // null = presente
  description: Localized
  pending?: true           // P-01: no se renderiza la sección de carrera mientras alguna entrada lo tenga
}
type EducationEntry = { id: string; institution: string; degree: Localized; start: string; end: string | null; pending?: true }  // 'YYYY-MM', o 'YYYY' si solo se conoce el año
type TechSkill = { id: string; name: string; icon: string; progress: number }  // progress 0–100, valores 2023 (D-04)
```

### Project (`content/projects.ts`)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | `'1'` … `'11'` | Estable; es el segmento de `/portfolio/[id]` desde 2023 |
| `title` | `string` | Corregido (C-06) |
| `summary` | `Localized` | Una oración; se usa en tarjetas y en el índice de búsqueda |
| `context` | `Localized` | Obligatorio |
| `role` | `Localized \| null` | `null` = se omite (FR-083) |
| `decisions` | `Localized \| null` | |
| `result` | `Localized \| null` | |
| `technologies` | `string[]` | Mayúsculas normalizadas (`REACT`, `NEXTJS`) |
| `image` | `ImageRef` | |
| `links` | `{ live: string \| null; github: string \| null }` | Ids 10: ambos `null` (404) |
| `order` | `number` | Orden en el carrusel |

### Post (`content/posts/<id>/<lang>.mdx`)

Cada MDX exporta `meta`:

```ts
type PostMeta = {
  id: 'post1' | 'post2' | 'post3' | string   // estable desde 2023
  lang: Locale
  originalLang: Locale
  title: string
  description: string
  date: string            // ISO 'YYYY-MM-DD'
  tags: string[]
  image: { src: string; alt: string; width: number; height: number }
  author: 'Camilo Hernandez'
}
```

El tiempo de lectura y el índice se calculan al renderizar. Un post existe en un idioma si existe su
archivo; si falta, se muestra el original con aviso (FR-064).

### CapsuleEntry (`content/capsule.ts`)

`{ date: string; message: string; note?: Localized }`, con 16 entradas (sección 11 del inventario).

### Dictionary (`content/i18n/<lang>/<namespace>.json`)

Objeto plano `{ [key: string]: string }` con interpolación `{name}`. Namespaces y dueño:

| Namespace | Lane dueña |
|-----------|------------|
| `common` | L0 |
| `site` | L1 |
| `motion` | L2 |
| `contact`, `admin`, `privacy` | L3 |
| `blog` | L4 |
| `experience` | L5 |

Regla: falta de clave en `en` → valor de `es`; falta en ambos → error en build (prueba unitaria de
paridad), nunca la clave cruda (FR-065).

## 2. Datos privados (base existente, solo servidor)

### `messages` (existente)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `_id` | ObjectId | |
| `name` | string | 1–60, trim |
| `email` | string | correo válido, ≤ 100 |
| `phone` | string \| number \| null | Nuevos: string ≤ 20 con `^\+?[0-9 ()-]{6,20}$`; históricos: number |
| `message` | string | 1–1000 |
| `status` | `'unread' \| 'read' \| 'archived'` | Ausente (histórico) → `read` |
| `consentAt` | Date \| null | Obligatorio en nuevos (SC-016); `null` en históricos |
| `createdAt`, `updatedAt` | Date | |

Transiciones: `unread ⇄ read`, `unread|read → archived`, `archived → read`. Eliminar borra el documento
(hard delete, con confirmación en UI).

### `comments` (existente)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `_id` | ObjectId | |
| `postId` | string | Debe existir en el contenido (se valida contra los ids de posts) |
| `userName` | string | 1–60 |
| `email` | string | correo válido, ≤ 100. **Nunca sale en respuestas públicas** |
| `comment` | string | 1–1000 |
| `lang` | Locale \| ausente | Idioma en que se escribió |
| `status` | `'pending' \| 'approved' \| 'rejected'` | Ausente (histórico) → `approved` |
| `consentAt` | Date \| null | Igual que en `messages` |
| `authorReply` | `{ text: string; createdAt: Date; updatedAt: Date } \| null` | 1–1000; solo si `status = approved` |
| `date` | string | Histórico 2023 (toDateString); los nuevos usan `createdAt` |
| `createdAt`, `updatedAt` | Date | |

Transiciones: `pending → approved | rejected`, `approved ⇄ rejected`. La respuesta del autor se borra si
el comentario pasa a `rejected`.

**Proyección pública** (`PublicComment`): `{ id, userName, comment, createdAt, authorReply }`, sin
`email` y sin `consentAt`.

### `admin_credentials` (nueva, singleton)

`{ _id: 'admin', hash: string, salt: string, params: { N: number; r: number; p: number; keyLen: number },
createdAt, updatedAt }`. Como máximo un documento.

### `setup_codes` (nueva)

`{ _id: 'setup', codeHash: string, expiresAt: Date (TTL), createdAt }`. Solo existe mientras no haya
credencial. Al crear la contraseña se borra.

### `admin_sessions` (nueva)

`{ _id: sha256(token), createdAt, lastActivityAt, expiresAt: Date (TTL = lastActivityAt + 12 h) }`.
Cada request válido desliza `lastActivityAt` y `expiresAt`, como mucho una vez por minuto. Cerrar sesión
borra el documento.

### `rate_limits` (nueva)

`{ _id: '<action>:<ipHash>', count: number, windowStart: Date, blockedUntil: Date | null, expiresAt: Date (TTL) }`

| Acción | Límite | Bloqueo |
|--------|--------|---------|
| `contact` | 3 / 10 min | hasta que vence la ventana |
| `comment` | 3 / 10 min | hasta que vence la ventana |
| `login` | 5 fallos / 15 min | 15 min |
| `setup` | 5 fallos / 15 min | 15 min |

`ipHash = HMAC-SHA256(SHA-256(MONGODB_INTEGRAL_DB), ip)` (research R-06).

## 3. Preferencias del visitante (solo navegador)

| Clave | Almacén | Valores |
|-------|---------|---------|
| `cw-lang` | cookie (la lee `proxy.ts`) | `es` \| `en` |
| `cw-theme` | localStorage | `dark` \| `light` |
| `cw-intro-seen` | sessionStorage | `1` |
| `cw-capsule-found` | localStorage | `1` |
