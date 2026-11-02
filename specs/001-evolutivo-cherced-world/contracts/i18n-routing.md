# Contrato: idiomas y rutas

**Dueño**: L0 · **Estado**: congelado en el tag `l0-frozen`

## Rutas

| Ruta | Página | Lane |
|------|--------|------|
| `/[lang]` | Home | L1 |
| `/[lang]/aboutMe` | Sobre mí | L1 |
| `/[lang]/services` | Servicios | L1 |
| `/[lang]/portfolio` | Portafolio | L1 |
| `/[lang]/portfolio/[id]` | Caso de estudio | L1 |
| `/[lang]/blog` | Blog | L4 |
| `/[lang]/blog/[id]` | Post | L4 |
| `/[lang]/contactMe` | Contacto | L3 |
| `/[lang]/privacy` | Política de privacidad (nueva) | L3 |
| `/[lang]/inbox` | Panel admin (login, setup, inbox, moderación) | L3 |
| `/[lang]/[...rest]` | 404 con identidad para rutas desconocidas | L0 |

`lang ∈ { 'es', 'en' }`. El layout raíz ya declara `generateStaticParams` con ambos idiomas; las
páginas con segmentos dinámicos propios declaran los suyos.

## `proxy.ts` (L0)

1. `/_next`, `/api`, `/capsule` (y lo que cuelga de ellos) y cualquier archivo con extensión: pasan
   sin cambios.
2. Primer segmento ∈ `{es, en}`: pasa. Si es una navegación de documento (`Sec-Fetch-Dest: document`
   o sin ese header, y sin `Sec-Purpose: prefetch`) y la cookie `cw-lang` difiere, la fija (1 año,
   `SameSite=Lax`). Next quita los headers `rsc` y `next-router-prefetch` antes del proxy, así que las
   peticiones del router (`Sec-Fetch-Dest: empty`) nunca tocan la cookie; los cambios de idioma en el
   cliente los guarda `LangSwitch` con `rememberLocale()`.
3. Cualquier otra ruta (incluidas las de 2023 sin prefijo: `/`, `/aboutMe`, `/portfolio/3`,
   `/blog/post1`, `/inbox`): **307** a `/<preferido><ruta>`, conservando la query y con
   `Vary: Cookie, Accept-Language`. El idioma preferido sale de la cookie `cw-lang`, si no de
   `Accept-Language` (primer `es*` o `en*` por orden de `q`), y si no es `es`. Un prefijo de idioma no
   soportado (`/fr/x`) se trata como ruta sin prefijo (`/es/fr/x`, que cae en el 404).
4. `proxy.ts` no hace autenticación ni toca la base.

## API de i18n

Dos puntos de entrada, para que un Client Component nunca arrastre diccionarios ni `server-only`:

```ts
// @/lib/i18n (universal: cliente y servidor)
export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'
export const LOCALE_COOKIE = 'cw-lang'
export function isLocale(value: string | null | undefined): value is Locale
export function otherLocale(lang: Locale): Locale
export type Namespace = 'common' | 'site' | 'motion' | 'contact' | 'admin' | 'privacy' | 'blog' | 'experience'
export type Dictionary = Readonly<Record<string, string>>
export function t(dict: Dictionary, key: string, vars?: Record<string, string | number>): string
export function pickKeys(dict: Dictionary, keys: readonly string[]): Record<string, string>
export function localizedPath(lang: Locale, path: string): string      // ('en', '/blog/post1') → '/en/blog/post1'
export function switchLocalePath(pathname: string, to: Locale): string // '/es/aboutMe' → '/en/aboutMe'
export function stripLocale(path: string): { locale: Locale | null; path: string }
export function alternates(path: string): { canonical: string; languages: Record<Locale | 'x-default', string> }
export function rememberLocale(lang: Locale): void                      // escribe la cookie cw-lang en el cliente

// @/lib/i18n/server (solo servidor: importa 'server-only')
export async function getDictionary<N extends Namespace>(lang: Locale, ns: N): Promise<Dictionary>
```

- `getDictionary('en', ns)` devuelve el diccionario español con el inglés encima, así una clave que
  falte en inglés sale en español (FR-065). El objeto viene congelado.
- `t` interpola `{nombre}` (si falta la variable deja el marcador) y lanza `MissingTranslationError`
  si la clave no existe en ninguno de los dos idiomas: nunca devuelve la clave cruda. En páginas
  estáticas eso rompe el build, que es lo que se busca.
- A los Client Components se les pasan los textos ya resueltos por props (`pickKeys` ayuda); nunca el
  diccionario entero.
- `localizedPath` acepta rutas con o sin prefijo (reemplaza el que tenga), con query y hash.
- `alternates(path)` recibe la ruta **de la página actual con su prefijo** (`'/en/blog/post1'`):
  `canonical` es esa misma ruta, `languages` trae la de cada idioma y `x-default` es la ruta sin prefijo
  (`'/blog/post1'`), que el proxy resuelve al idioma preferido. Si recibe una ruta sin prefijo, la
  canónica es la española.
- Prueba de paridad (`tests/unit/l0/i18n-parity.test.ts`): cada clave de `es` existe en `en` y viceversa,
  con los mismos marcadores `{...}` y sin textos vacíos, para todos los namespaces.

## Diccionarios sembrados por L0

Todas las claves de content-inventory §5, repartidas así (cada lane es dueña de su archivo):

- `common` (L0): navegación, marca, intro, footer, 404 y error, idioma, tema, palette (`palette.open`,
  `palette.hint`), menú, skip link, y los textos de formulario que comparten L3 y L4: `form.*` y
  `privacy.consent`, `privacy.policyLink`, `privacy.required`.
- `site` (L1): `home.*` y `meta.{home,about,services,portfolio}.*`. La fuente de verdad del banner es
  `site.home` en `content/site.ts`; las claves `home.*` existen porque las pide el inventario y L1 decide
  si las usa.
- `motion` (L2): `loader.loading`.
- `contact`, `admin`, `privacy` (L3): textos de contacto, panel y página de privacidad, más
  `meta.contact.*`, `meta.inbox.title` y `meta.privacy.*`.
- `blog` (L4): `comments.*`, `post.*` y `meta.blog.*`.
- `experience` (L5): `palette.copyEmail`, `palette.copied`, `assistant.*` y `capsule.title`.

## Metadatos

Cada página exporta `generateMetadata({ params })` con `title` (el layout aplica la plantilla
`%s | <-CHERCED-WORLD->`), `description`, `alternates: alternates(path)` y `openGraph`. `metadataBase`,
íconos, `openGraph.siteName` y `locale` ya los define el layout raíz (research R-13).
`app/sitemap.ts` (L0) lista las rutas públicas de ambos idiomas con sus alternativas, incluidos todos los
proyectos (`getProjects()`) y todos los posts (`listPosts`); `/inbox` no aparece. `app/robots.ts` solo
bloquea `/api/` y no menciona `/inbox` (FR-040).
