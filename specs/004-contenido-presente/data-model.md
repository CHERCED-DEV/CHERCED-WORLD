# Data model 004

Cambios a `content/types.ts`, archivos de contenido nuevos, cambios a la capa de datos y contratos de API y de
capacidades. Los valores están en [contenido.md](./contenido.md). Los números de enmienda son los del
[plan](./plan.md): E-xx para tipos de contenido y A-4xx para contratos congelados.

**Regla de compatibilidad**: P0 congela los tipos con campos nuevos **opcionales**. Las excepciones son los campos que
P0 llena en el mismo cambio: `Project.era`, `ServiceItem.forWho` y `deliverables`, y los bloques de `ServicesContent`.
Así ningún consumidor deja de compilar en `p0-frozen`. El único cambio que rompe consumidores es `ServiceId`, que se
resuelve con los pictogramas provisionales de A-405.

## 1. `content/types.ts`

### E-04 `Project`

```ts
export type ProjectEra = '2024-2026' | '2022-2023'

export type AdrCard = { decision: Localized; why: Localized; tradeoff: Localized }

export type DiagramLayer = { id: string; label: Localized; role: Localized }

export type RepoLink = { label: string; href: string }

export type ProjectLinks = { live: string | null; github: string | null; repos?: RepoLink[] }

export type Project = {
  era: ProjectEra
  adrCards?: AdrCard[]
  diagram?: DiagramLayer[]
}
```

El tipo `Project` de arriba solo muestra los campos nuevos; los demás campos de hoy se quedan.

- `era` es obligatorio. Los valores de los 15 proyectos están en contenido.md §4.
- `adrCards` va de 1 a 6 tarjetas, y cada texto en ES y EN. Solo Synergos las trae (P-408).
- `diagram` va de 2 a 5 capas. Solo Synergos lo trae (contenido.md §11.4).
- `repos` es para casos con más de un repo:
  - Synergos: `Synergos.CMS`, `Synergos.UI` y `Synergos.Fabrica` (P-403, resuelta). Las URLs son las que el
    orquestador verificó en GitHub el 2026-11-04. P0 las copia de esa verificación, no las deduce.
  - Legal workspace: sin enlace mientras P-420 siga abierta.
  - Director & lines y Event bridge: sin repo.
- `live` de Synergos sigue en `null` (P-410).

### E-05 Servicios (A-405)

```ts
export type ServiceId = 'ai-harness' | 'software-factory' | 'process-optimization' | 'architecture' | 'product' | 'workshops'

export type ServiceItem = {
  id: ServiceId
  title: Localized
  description: Localized
  forWho: Localized
  deliverables: Localized<string[]>
  example?: Localized
  priceRange?: Localized
  icon?: string
}

export type ServiceAudience = { id: 'professionals' | 'companies' | 'engineering-teams'; title: Localized; text: Localized }

export type ServiceFaq = { q: Localized; a: Localized }

export type ServicesContent = {
  intro: Localized
  hero: { title: Localized; intro: Localized; cta: Localized }
  audiences: ServiceAudience[]
  items: ServiceItem[]
  process: { title: Localized; steps: Localized[]; principles: Localized<string[]> }
  faq: ServiceFaq[]
  cta: { title: Localized; text: Localized; button: Localized }
}
```

- `items` lleva exactamente 6, en el orden de contenido.md §5.3 y luego `workshops` (§5b).
- Mapeo de §5b al tipo:
  - `summary` va a `description`.
  - `outcomes` va a `deliverables`.
  - `forWho` es "Equipos de ingeniería" / "Engineering teams", el perfil de §5.2 al que se dirige el texto. Es una
    propuesta: el autor puede cambiarla.
- `priceRange` queda vacío mientras P-421 siga abierta.
- `faq` lleva 4 preguntas. La de propiedad espera a P-412.
- `icon` pasa a opcional: `ServiceIcon` dibuja por `id`.
- `intro` se queda igual a `hero.intro` hasta que el orquestador limpie el campo al integrar (T506).

### E-06 `SiteContent.home`

```ts
home: { greeting: Localized; name: string; title: Localized; previousTitle?: Localized; subtitle?: Localized }
```

### E-07 Lo que sé

La forma de los lóbulos (6 nodos, fuentes y proyectos) la define la 002 en T229. La 004 solo agrega lo que T229 no
cubre:

```ts
skills: { inWords?: Partial<Record<string, Localized>> }
about: { principles?: { short: Localized; full: Localized }[] }
```

- Las claves de `inWords` son los `id` de lóbulo que deje T229. Cada clave debe existir en `skills.lobes`; una prueba
  lo verifica.
- La de Prácticas de ingeniería falta mientras P-424 siga abierta.
- `principles` lleva 5, en el orden de contenido.md §8.6.

### E-08 `SiteContent.profile`

```ts
profile?: {
  availability: { location: Localized; timezone: 'UTC−5'; relocation: Localized }
  cv: { href: string }
}
```

`cv.href` es el perfil público de LinkedIn. Nunca un PDF (P-406).

### E-09 Cifras de Synergos (`content/synergos.ts`, nuevo)

```ts
export type SynergosFacts = {
  countedAt: string
  pieces: number
  capabilities: number
  orchestrators: number
  measuredAt: string
  testsAtLeast: number
  adrsAtLeast: number
  designSystemAtLeast: number
}
```

Valores en contenido.md §11.1. La leen el caso, la carrera, "En cifras" y `ls synergos/`. Ningún otro archivo repite
estos números como literal; una prueba busca los literales fuera de este archivo y de los textos de contenido.

### E-10 Comandos de terminal (`content/terminal.ts`, nuevo)

```ts
export type TerminalCommand =
  | { name: string; output: Localized; lang?: 'la' }
  | { name: string; generated: 'projects' | 'synergos' | 'help' | 'clear' }
```

Comandos: `help`, `whoami`, `cat principles.md`, `cat lemas.md` (§15b), `ls projects/`, `ls synergos/`,
`git log --oneline -1` y `clear`. `cat <lóbulo>.lobe` sigue en el mapa (T229).

- Los nombres se comparan sin distinguir mayúsculas.
- La entrada se corta a 80 caracteres.
- `cat principles.md` se genera desde `about.principles` para no duplicar texto.

### E-12 `/now` (`content/now.ts`, nuevo)

```ts
export type NowEntry = Localized & { lang?: 'la' }

export type NowContent = {
  updatedAt: string
  building: NowEntry[]
  learning: NowEntry[]
  preparing: NowEntry[]
  offKeyboard: NowEntry[]
  mottos: NowEntry[]
}
```

- Valores en contenido.md §24. "Veni, vidi, vici" lleva `lang: 'la'`.
- La fecha de HYROX no se publica.
- `updatedAt` se fija el día de la publicación.

## 2. Capa de datos (`lib/data`, enmiendas A-401 y A-403)

### A-401 `interest` en los mensajes

```ts
export type MessageInterest = ServiceId | 'other'

export type NewMessage = { interest: MessageInterest | null }

export type MessageRecord = { interest: MessageInterest | null }
```

Solo se muestran los campos nuevos; los demás de hoy se quedan.

- Los mensajes anteriores se leen con `interest: null`. El mapper de Mongo no exige el campo.
- `contactSchema` suma `interest`: opcional; vacío pasa a `null`; cualquier otro valor debe estar en
  `MessageInterest`.
- El panel (`components/admin/MessageList.tsx`) lo muestra con la etiqueta `admin.field.interest`.

### A-403 Reacciones

```ts
export type ReactionKind = 'clap' | 'idea' | 'fire'

export type ReactionCounts = Record<ReactionKind, number>

export interface ReactionRepo {
  counts(postId: string): Promise<ReactionCounts>
  apply(postId: string, kind: ReactionKind, op: 'add' | 'remove'): Promise<ReactionCounts>
}

export interface Repos {
  reactions: ReactionRepo
}
```

- **Colección**: `post_reactions`, `{ _id: postId, clap, idea, fire, updatedAt }`, con un `$inc` atómico. `remove`
  nunca baja de 0.
- **Repositorio en memoria**: el mismo comportamiento, para las pruebas y las e2e.
- **Contrato**: la suite de `tests/contract/repos.contract.ts` suma los casos del repositorio de reacciones, para
  memoria y Mongo.
- **Límite**: `RATE_LIMITS.reaction = { limit: 10, windowMs: 10 * MINUTE }`.

## 3. Contratos de API

### `GET /api/reactions/[postId]`

- **200**: `{ "clap": number, "idea": number, "fire": number }`, con `Cache-Control: public, max-age=30`.
- **404** si `postId` no existe en `content/posts/registry.ts`.
- **503** `{ "error": "unavailable" }` si la base no responde.
- No incluye ningún otro campo.

### Acción `toggleReaction(postId, kind, op)`

En `lib/actions/reactions.ts`:

- **Resultado**: `ActionResult` de `lib/actions/result.ts`.
  - `ok({ counts })` cuando se aplica.
  - `fail('validation')` si un valor no es válido.
  - `fail('rate_limited', { retryAfterMs })` al pasar el límite.
  - `fail('unavailable')` si la base no responde.
- La huella de IP se calcula con `requestIpHash()`, como en el formulario de contacto.

### Preselección en Contacto

`/{lang}/contactMe?servicio=<ServiceId>`. El servidor preselecciona la opción si el valor es válido y lo ignora si no.
El valor no se guarda hasta que la persona envía el formulario.

## 4. Búsqueda (A-406)

```ts
export const SEARCH_INDEX_VERSION = 2

export type SearchDocKind = 'page' | 'project' | 'post' | 'section' | 'skill'
```

- **Doc de habilidad**: `{ id: 'skill:<id>', kind: 'skill', title: name, text: '<lóbulo> · <nivel> %', keywords: '<lóbulo> <id>', url: '/{lang}/aboutMe#lobe-<lobeId>' }`.
- **Grupo**: la paleta suma el grupo `skills`.
- **Versión**: el cliente descarta índices de la versión 1 (`isSearchIndex`).

## 5. Registro de capacidades (E-13, `lib/capabilities/`)

```ts
export type CapabilityEffect = 'read' | 'view' | 'draft'

export type Capability<I, O> = {
  name: string
  description: Localized
  inputSchema: JsonSchema
  effect: CapabilityEffect
  execute(input: I, context: { lang: Locale }): Promise<O>
}
```

- **Herramientas**:
  - `read`: `search_portfolio`, `get_project`, `list_projects`, `get_experience`, `get_skills`, `list_posts` y
    `get_cv`.
  - `view`: `set_preferences`.
  - `draft`: `draft_contact_message` (P-416).
  - Entradas y descripciones en contenido.md §25.
- **Validación**: cada `inputSchema` se valida con un esquema zod equivalente. Una prueba compara los dos y falla si
  divergen; se muta una vez para ver que falla.
- **Límites**:
  - `query` hasta 100 caracteres; `limit` de 1 a 10.
  - Para `draft_contact_message`, los de `LIMITS` en `lib/validation` (nombre 60, correo 100, mensaje 1000).
- **Fuentes**: las salidas salen de `lib/content` y del índice de búsqueda. Nunca de `lib/data`, salvo
  `draft_contact_message`, que no lee la base: solo llena el formulario en la página.
- **Consumidores**: la paleta, el asistente, `lib/agent/webmcp.ts`, `app/llms.txt/route.ts` y, en la 003, A1 y A13.

## 6. Piezas compartidas de P0

| Pieza | Props | Comportamiento |
|---|---|---|
| `components/ui/CvLink.tsx` | `{ lang, variant?: 'solid' \| 'glass' }` | Enlace a `profile.cv.href`, en pestaña nueva con `rel="noopener noreferrer"`. Nombre accesible `cv.linkLabel` |
| `components/ui/AvailabilityChip.tsx` | `{ lang }` | Texto de `profile.availability` y punto `#25ED9E`. El punto no late con movimiento reducido. Nombre accesible `profile.availability.label` |
| `components/ui/EmailMenu.tsx` | `{ lang, email, trigger }` | Botón de menú con "Escribirme un correo" (`mailto:`) y "Copiar correo". Copiar muestra el `Toast` existente. Sin JS queda un `mailto:` |
| `lib/og/template.tsx` | `renderOgImage({ lang, title, line })` | `ImageResponse` de 1200 × 630, Montserrat Regular y Bold (R-403) |
| `lib/seo/person.ts` | `personJsonLd(lang)` | Objeto de contenido.md §22. `jsonLdScript()` escapa `<` |

## 7. Reglas de validación y estados

| Dato | Regla |
|---|---|
| `interest` | Opcional; enum de `MessageInterest`; se rechaza otro valor |
| Reacción | `kind` del enum; `op` en `add` o `remove`; piso 0; 10 por IP cada 10 min |
| Entrada del terminal | Máximo 80 caracteres; salida como texto |
| Herramientas WebMCP | Entrada validada con su esquema; solo datos públicos; `draft` nunca envía ni marca el consentimiento |
| Atajos de una tecla | Preferencia `cw-shortcuts` en `localStorage`: `on` u `off`, `on` por defecto |
| Guiño del hero | Preferencia de sesión `cw-wink-seen`: una vez por sesión |
| Reacción propia | `localStorage` `cw-reactions:<postId>` con el `kind` marcado |
