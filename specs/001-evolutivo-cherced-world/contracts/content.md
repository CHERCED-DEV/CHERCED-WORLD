# Contrato: contenido

**Dueños**: tipos y accesores en L0 · datos en LC · **Estado**: tipos y accesores se congelan al cerrar L0

## Archivos

| Ruta | Dueño | Qué es |
|------|-------|--------|
| `content/types.ts` | L0 | Tipos de [data-model.md](../data-model.md) §1 |
| `content/site.ts` | LC (L0 deja un seed válido) | `export const site: SiteContent` |
| `content/projects.ts` | LC (seed con 2 proyectos) | `export const projects: Project[]` |
| `content/capsule.ts` | LC (seed con 2 entradas) | `export const capsule: CapsuleEntry[]` |
| `content/posts/registry.ts` | LC (seed con `post1` en ambos idiomas) | Registro de imports MDX |
| `content/posts/<id>/<lang>.mdx` | LC | Cuerpo del post con `export const meta: PostMeta` |
| `content/i18n/<lang>/<ns>.json` | Dueño del namespace ([data-model.md](../data-model.md)) | Textos de interfaz |
| `public/assets/**` | LC | Imágenes y logos |
| `lib/content/*.ts` | L0 | Accesores (abajo) |

## Registro de posts

```ts
// content/posts/registry.ts
import type { Locale, PostMeta } from '@/content/types'
type PostModule = { default: React.ComponentType; meta: PostMeta }
export const postRegistry: Record<string, Partial<Record<Locale, () => Promise<PostModule>>>> = {
  post1: { es: () => import('./post1/es.mdx'), en: () => import('./post1/en.mdx') },
}
```

## Accesores (`lib/content/`, L0)

```ts
export function getSite(): SiteContent
export function getProjects(): Project[]                        // ordenados por `order`
export function getProject(id: string): Project | null
export function getAllTechnologies(): string[]                  // únicas, orden alfabético
export async function listPosts(lang: Locale): Promise<(PostMeta & { fallback: boolean })[]>  // fallback = mostrado en su idioma original
export async function loadPost(id: string, lang: Locale): Promise<{ Content: React.ComponentType; meta: PostMeta; fallback: boolean } | null>
export function postIds(): string[]
export function pick<T>(value: Localized<T>, lang: Locale): T
```

Las lanes consumidoras programan contra estos accesores y los seeds. Al integrarse LC, el contenido real
reemplaza a los seeds sin cambiar ninguna firma.

## Reglas para LC

- Las fuentes 2023 se leen desde el commit `4d81960` (por ejemplo,
  `git show 4d81960:pages/api/customCMS/CMS.ts`), porque L0 elimina el código 2023 del árbol.
- Se aplican el inventario, las decisiones D-01 a D-05 y las reglas de traducción de
  [content-inventory.md](../content-inventory.md).
- Los pendientes (P-01, P-02, P-03) se cargan como `pending: true` o `href: null`, nunca inventados.
- Prueba de completitud (`tests/unit/lc/content-completeness.test.ts`): 11 proyectos, 3 posts con
  `es` y `en`, cero campos `Localized` vacíos y cero textos 2023 sin corregir (lista C-01 a C-17).
