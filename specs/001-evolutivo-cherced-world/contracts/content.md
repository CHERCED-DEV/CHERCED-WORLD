# Contrato: contenido

**Dueños**: tipos y accesores en L0 · datos en LC · **Estado**: tipos y accesores congelados en el tag
`l0-frozen`

## Archivos

| Ruta | Dueño | Qué es |
|------|-------|--------|
| `content/types.ts` | L0 | Tipos de [data-model.md](../data-model.md) §1 (`Locale` se reexporta desde `lib/i18n`) |
| `content/site.ts` | LC (L0 deja un seed válido) | `export const site: SiteContent` |
| `content/projects.ts` | LC (seed con proyectos 1 y 2) | `export const projects: Project[]` |
| `content/capsule.ts` | LC (seed con 2 entradas) | `export const capsule: CapsuleEntry[]` |
| `content/posts/registry.ts` | LC (seed con `post1` en ambos idiomas) | Registro de imports MDX |
| `content/posts/<id>/<lang>.mdx` | LC | Cuerpo del post con `export const meta` (forma de `PostMeta`) |
| `content/i18n/<lang>/<ns>.json` | Dueño del namespace ([data-model.md](../data-model.md)) | Textos de interfaz |
| `public/assets/**` | LC | Imágenes y logos (el shell usa algunos íconos: ver [ui-shell.md](./ui-shell.md)) |
| `lib/content/index.ts` | L0 | Accesores (abajo) |

## Registro de posts

```ts
// content/posts/registry.ts
import type { ComponentType } from 'react'
import type { Locale, PostMeta } from '@/content/types'
export type PostModule = { default: ComponentType; meta: PostMeta }
export type PostLoader = () => Promise<PostModule>
export const postRegistry: Record<string, Partial<Record<Locale, PostLoader>>> = {
  post1: {
    es: () => import('./post1/es.mdx') as Promise<PostModule>,
    en: () => import('./post1/en.mdx') as Promise<PostModule>,
  },
}
```

El `as Promise<PostModule>` es necesario porque `@types/mdx` no declara `meta`. Como el MDX no se
tipa, la forma de `meta` la garantizan la prueba de completitud de LC y el build: `app/sitemap.ts`
carga todos los posts con `listPosts`, así que un MDX que no compila rompe `npm run build`.

## Accesores (`lib/content`, L0)

```ts
export function getSite(): SiteContent
export function getProjects(): Project[]                        // ordenados por `order`
export function getProject(id: string): Project | null
export function getAllTechnologies(): string[]                  // únicas, orden alfabético
export function getCapsule(): CapsuleEntry[]                    // por fecha ascendente
export async function listPosts(lang: Locale): Promise<(PostMeta & { fallback: boolean })[]>  // del más nuevo al más viejo
export async function loadPost(id: string, lang: Locale): Promise<{ Content: ComponentType; meta: PostMeta; fallback: boolean } | null>
export function postIds(): string[]
export function pick<T>(value: Localized<T>, lang: Locale): T
```

- `fallback: true` significa que el post no existe en `lang` y se entrega en su otro idioma (FR-064).
- `getCapsule()` es nuevo respecto del borrador del contrato: L5 lo necesita para la línea de tiempo.
- `lib/content` no es `server-only` (el contenido es público), pero conviene leerlo en Server
  Components y pasar a los Client Components solo lo que necesitan.

Las lanes consumidoras programan contra estos accesores y los seeds. Al integrarse LC, el contenido real
reemplaza a los seeds sin cambiar ninguna firma. `tests/contract/signatures.ts` congela las firmas.

## Formatos dentro de los datos

- `CareerEntry.start`/`end`: `'YYYY-MM'`. `EducationEntry.start`/`end`: `'YYYY-MM'`, o `'YYYY'` cuando
  la fuente 2023 solo da el año (UNAD 2020, EAM 2011–2016).
- `SiteContent.about.image: ImageRef` es nuevo: el retrato de la sección "Sobre mí"
  (`/assets/imgs/meParallax.png`) con su alt en ambos idiomas.
- Tecnologías de proyectos en mayúsculas, como en 2023 (`REACT`, `NEXTJS`).

## Pruebas con MDX

Vitest no transforma `.mdx` (no hay plugin MDX entre las dependencias). Para probar código que use el
registro, se reemplaza con `vi.mock('@/content/posts/registry', ...)`; el ejemplo está en
`tests/unit/l0/content.test.ts`. Para validar los MDX reales, la prueba de LC puede leer los archivos
como texto o confiar en el build.

## Reglas para LC

- Las fuentes 2023 se leen desde el commit `4d81960` (por ejemplo,
  `git show 4d81960:pages/api/customCMS/CMS.ts`), porque L0 elimina el código 2023 del árbol.
- Se aplican el inventario, las decisiones D-01 a D-05 y las reglas de traducción de
  [content-inventory.md](../content-inventory.md).
- Los pendientes (P-01, P-02, P-03) se cargan como `pending: true` o `href: null`, nunca inventados.
- El seed de L0 ya trae: redes (Facebook con `href: null`), home, descripción y retrato de "Sobre mí",
  2 entradas de carrera (Newshore con `pending: true`), 3 viñetas y 4 tecnologías de skills, 2 entradas
  de educación (UNAD con `pending: true`), 2 cursos, idiomas, servicios completos, 1 párrafo de la
  introducción del portafolio, contacto, blog y un borrador de privacidad de 3 secciones (P-06). LC
  completa el resto.
- Prueba de completitud (`tests/unit/lc/content-completeness.test.ts`): 11 proyectos, 3 posts con
  `es` y `en`, cero campos `Localized` vacíos y cero textos 2023 sin corregir (lista C-01 a C-17).
