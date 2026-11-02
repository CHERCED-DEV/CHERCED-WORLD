# Contrato: idiomas y rutas

**Dueño**: L0 · **Estado**: se congela al cerrar L0

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

`lang ∈ { 'es', 'en' }`. `generateStaticParams` devuelve ambos en todas las páginas públicas.

## `proxy.ts` (L0)

1. `/_next`, `/api`, archivos con extensión y `/capsule/*`: pasan sin cambios.
2. Primer segmento ∈ `{es, en}`: pasa y fija la cookie `cw-lang` si difiere.
3. Cualquier otra ruta (incluidas las de 2023 sin prefijo: `/`, `/aboutMe`, `/portfolio/3`, `/blog/post1`,
   `/inbox`): **307** a `/<preferido><ruta>`. El idioma preferido sale de la cookie `cw-lang`, si no de
   `Accept-Language` (primer `es*` o `en*`), y si no es `es`.
4. `proxy.ts` no hace autenticación ni toca la base.

## API de i18n (`lib/i18n/`, L0)

```ts
export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'
export function isLocale(value: string): value is Locale

export type Namespace = 'common' | 'site' | 'motion' | 'contact' | 'admin' | 'privacy' | 'blog' | 'experience'
export async function getDictionary<N extends Namespace>(lang: Locale, ns: N): Promise<Dictionary>
export function t(dict: Dictionary, key: string, vars?: Record<string, string | number>): string

export function localizedPath(lang: Locale, path: string): string      // ('en', '/blog/post1') → '/en/blog/post1'
export function switchLocalePath(pathname: string, to: Locale): string // '/es/aboutMe' → '/en/aboutMe'
export function alternates(path: string): { canonical: string; languages: Record<Locale | 'x-default', string> }
```

- `getDictionary` funciona solo en el servidor. A los Client Components se les pasan los textos ya
  resueltos por props; nunca el diccionario entero.
- `t` aplica la regla de FR-065: si falta la clave en `en`, usa `es`; nunca devuelve la clave cruda.
- Prueba de paridad (`tests/unit/l0/i18n-parity.test.ts`): cada clave de `es` existe en `en` y viceversa,
  para todos los namespaces.

## Metadatos

Cada página exporta `generateMetadata({ params })` con `title`, `description`,
`alternates: alternates(path)` y `openGraph`. `metadataBase` se define en el layout raíz (research R-13).
`app/sitemap.ts` (L0) lista todas las rutas públicas de ambos idiomas, incluidos los 11 proyectos y todos
los posts.
