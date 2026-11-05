# Implementation Plan: El blog de un arquitecto que trabaja con agentes

**Branch**: `005-blog` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-blog/spec.md`

## Summary

El blog pasa de una lista plana a un índice con un post destacado, una grilla agrupada por año ("Ahora" y
"Archivo"), etiquetas que filtran y búsqueda. Los posts ganan callouts de decisión, diagramas en SVG, series, posts
relacionados, caja de autor, nota de traducción y fecha de actualización. Se comparten con una imagen OG por post, se
indexan con JSON-LD `BlogPosting` y se siguen por RSS. El calendario editorial suma siete posts en ES y EN, cada uno con
el visto bueno del autor. "Escuchar este post" queda bloqueado hasta que la 003 resuelva V3.

Todo se construye sobre lo que la 002 (R4) ya entregó y sobre las piezas de la 004:

- la plantilla OG (`lib/og`) y el `Person` (`lib/seo`);
- el índice de búsqueda;
- el registro de comandos de la paleta;
- las reacciones.

No hay dependencias, servicios ni variables nuevas.

## Technical Context

**Language/Version**: TypeScript 5.9 (estricto) sobre Node.js 22.

**Primary Dependencies**: las de hoy:
- next 16.4, react 19.3 y @next/mdx 16.4 con @mdx-js 3.1;
- sugar-high 2.6 para el resaltado, que ya existe;
- minisearch 7.2, a través del índice de búsqueda que ya existe;
- `next/og`, que viene con Next.

**Cero dependencias nuevas.** Mermaid solo entraría si el autor lo pide (P-503), y con justificación según el
principio VIII.

**Storage**: ninguno nuevo. Los posts siguen en MDX en `content/posts/`. Las reacciones son de la 004.

**Testing**: Vitest 5 y Playwright 1.64 con axe, como en la 002 y la 004. Las e2e usan el repositorio en memoria.

**Target Platform**: el proyecto de Vercel que ya existe.

**Project Type**: aplicación web en un solo proyecto Next.js (App Router).

**Performance Goals**: LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms y accesibilidad ≥ 95 en el índice, en las páginas de
etiqueta y en los posts (SC-505).

**Constraints**:
- El índice principal sigue siendo estático: no regresa D-05 de la 002.
- Las páginas de etiqueta se prerenderizan.
- Los feeds y las imágenes OG se generan en el build.
- El contenido principal se ve sin JS.

**Scale/Scope**: de 5 a 12 posts en dos idiomas; unas 20 etiquetas por idioma; 2 feeds.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Verificación | Estado |
|---|---|---|
| I. Evolución, no reemplazo | `/blog` y `/blog/[id]` no cambian. Se suman `/blog/tag/[tag]` y `/feed.xml` por idioma. Los posts de 2023 se quedan, en "Archivo" | ✅ |
| II. Glass sobre movimiento | Callouts y portada generada usan los tokens de cristal. Sin animaciones nuevas, salvo el reproductor bloqueado, que respeta movimiento reducido | ✅ |
| III. Seguridad real | Sin entradas públicas nuevas: la búsqueda es del lado del cliente sobre el índice público. El JSON-LD escapa `<` con la función de la 004 | ✅ |
| IV. Contenido como datos | Series, etiquetas y fechas viven en la meta de los posts y en `content/posts/series.ts`. Feed, JSON-LD y OG salen de las mismas fuentes. Sin almacenamiento en el navegador | ✅ |
| V. Rendimiento y accesibilidad | Portada generada en HTML y CSS, sin imagen extra. Diagramas en SVG estático. Filtros con URL propia, sin JS. Callouts anunciados | ✅ |
| VI. Calidad verificable | `npm run verify` y e2e por lane. Validación de los feeds en las pruebas | ✅ |
| VII. Propiedad exclusiva | 6 lanes con rutas disjuntas. Lo compartido con la 004 se recibe por transferencia o enmienda (abajo) | ✅ |
| VIII. Simplicidad operativa | Sin servicios, llaves ni variables. "Avísame del próximo post" queda fuera: exigiría un proveedor de correo | ✅ |

Re-check post-diseño: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/005-blog/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
└── tasks.md
```

### Source Code (repository root)

```text
content/types.ts (PostMeta)                                   Q0 (enmienda A-501)
content/i18n/{es,en}/blog.json, content/site.ts (blog.*)      Q0
content/posts/series.ts (nuevo)                               Q0
content/posts/post6..post12/**, content/posts/registry.ts     Q4
public/assets/imgs/posts/**                                   Q4
lib/blog/** (agrupación, relacionados, etiquetas, feed)       Q0
lib/seo/blog-posting.ts (nuevo)                               Q0 (enmienda A-502)
app/sitemap.ts                                                Q0 (enmienda A-507)
app/[lang]/blog/page.tsx, app/[lang]/blog/tag/** (nuevo)      Q1
components/blog/{BlogIndex,BlogIntro,PostCard,PostMedia}*     Q1
components/blog/index/** (nuevo)                              Q1
app/[lang]/blog/[id]/page.tsx                                 Q2
components/blog/{PostView,PostNav,Toc,ReadingProgress}*       Q2
components/blog/post/** (nuevo), components/blog/mdx/**       Q2
components/blog/catalog/**, app/[lang]/blog/catalog/**        Q2
mdx-components.tsx                                            Q2
app/[lang]/blog/[id]/opengraph-image.tsx (nuevo)              Q3
app/[lang]/feed.xml/route.ts (nuevo)                          Q3
tests/unit/q0..q4/**, tests/e2e/q0..q4/**                     cada lane la suya
tests/e2e/q5/**                                               Q5
```

Lo que **no** toca la 005:

- `components/blog/comments/**` y `components/blog/reactions/**` (004, P5);
- `lib/og/**` y `lib/seo/person.ts` (004, P0; la 005 solo los usa);
- `lib/search/**` y `components/experience/**` (004, P6), salvo la enmienda A-506, bloqueada.

**Structure Decision**: un solo proyecto Next.js. Las carpetas nuevas `components/blog/index/` y
`components/blog/post/` separan las piezas del índice y de la página del post, para que Q1 y Q2 no se pisen.

## Lanes

| Lane | Alcance | Historias / requisitos | Depende de | Puerto e2e |
|---|---|---|---|---|
| **Q0** Foundation del blog | `PostMeta` (A-501), series, copy del blog, utilidades de `lib/blog`, `BlogPosting` (A-502) y sitemap (A-507) | FR-503 (datos), FR-512 y FR-516 (datos), FR-521 (builder), FR-542 | La 004 integrada, o su `p0-frozen` con transferencias (abajo) | 3120 |
| **Q1** Índice | Destacado, grilla por año, portada generada, etiquetas con URL propia, búsqueda y enlace RSS visible | US1, US2, FR-501 a FR-506, FR-523 (enlace visible) | `q0-frozen` | 3121 |
| **Q2** Página del post | Callouts, diagramas, series, relacionados, caja de autor, nota de traducción, fecha de actualización, JSON-LD en el post; "Escuchar" bloqueado | US3, US5, FR-510 a FR-516, FR-521 (script), FR-530 a FR-532 | `q0-frozen` | 3122 |
| **Q3** Compartir y seguir | Imagen OG por post y feeds RSS | US4, FR-520, FR-522, FR-523 (`<head>`) | `q0-frozen` | 3123 |
| **Q4** Calendario editorial | Los siete posts propuestos, en ES y EN, con revisión del autor | FR-540, FR-541 | `q0-frozen`; cada post, su visto bueno | 3124 |
| **Q5** QA del blog | Responsive, interacción, contraste y presupuestos en índice, etiquetas, posts y feeds | SC-501 a SC-506 | `q0-frozen` (corre completa al integrar) | 3125 |

**Orden de integración**: Q0 → Q2 → Q1 → Q3 → Q4 → Q5. Después, `npm run verify` y la suite completa **3 veces
seguidas en verde**, revisión en la vista previa y corte a `main` con la confirmación del autor.

### Cuándo se implementa respecto de la 004

**Recomendado: después de integrar la 004.** La 005 comparte con la lane P0 de la 004:

- `content/types.ts`, `content/i18n/*/blog.json`, `content/site.ts` y `content/posts/**`;
- `lib/seo/**` y `app/sitemap.ts`.

La comparte, además, con P5 (los comentarios) y P6 (la paleta). Con la 004 integrada, esas rutas quedan libres y la
005 las toma sin enmiendas cruzadas.

**En paralelo, solo así**: después del `p0-frozen` de la 004, si su orquestador hace dos cosas:

1. Aplica A-501, A-502, A-504 y A-507 como enmiendas de P0.
2. Transfiere `content/posts/**` a Q4.

Las demás rutas de la 005 no las toca ninguna lane de la 004:

- `components/blog/**` (salvo `comments` y `reactions`);
- `app/[lang]/blog/**` y `app/[lang]/feed.xml/**`;
- `lib/blog/**` y `mdx-components.tsx`.

Sin esas condiciones, la 005 espera.

### Contratos entre lanes (se congelan con `q0-frozen`)

| Contrato | Proveedor | Consumidores | Forma |
|---|---|---|---|
| URL de etiqueta | Q0 (`lib/blog/tags.ts`) | Q1, Q2 y Q3 | `/{lang}/blog/tag/<slug>`, con `slugify` de `lib/blog/slug.ts` |
| Grupos por año | Q0 (`lib/blog/groups.ts`) | Q1 | `groupByYear(posts)` → `{ year, label: 'now' \| 'archive', posts }[]` |
| Relacionados | Q0 (`lib/blog/related.ts`) | Q2 | `relatedPosts(post, posts, exclude)`, hasta 3 |
| Feed | Q0 (`lib/blog/feed.ts`) | Q3, y Q1 y Q2 (`alternates`) | `feedItems(lang)` y `feedAlternates(lang)` |
| `BlogPosting` | Q0 (`lib/seo/blog-posting.ts`) | Q2 | `blogPostingJsonLd(meta, lang, url)` |
| Portada generada | Q1 (`components/blog/index/GeneratedCover.tsx`) | Q2 (portada del post) | `{ title, date, tags, lang }` |

## Enmiendas (A-5xx)

| ID | Cambio | Qué toca | Lane |
|---|---|---|---|
| A-501 | `PostMeta` suma `featured?: true`, `updated?: string`, `series?: { id; part }` y `cover?: 'generated'`. `image` sigue obligatoria, para no romper a sus consumidores | `content/types.ts` (004, P0) | Q0 |
| A-502 | `lib/seo/blog-posting.ts`, nuevo, reutiliza `jsonLdScript` y el `@id` de `person.ts` sin cambiarlos | `lib/seo/**` (004, P0) | Q0 |
| A-503 | La portada generada y la imagen OG del post reutilizan `lib/og` y los tokens, sin cambiarlos | Solo lectura | — |
| A-504 | Claves nuevas de `blog.json`, y `site.blog.welcome` y `meta.blog.description` con el copy de la spec | `content/i18n/*/blog.json` y `content/site.ts` (004, P0) | Q0 |
| A-505 | `Callout` entra en `components/blog/mdx/index.ts` (`mdxComponents`) y en el catálogo `/blog/catalog` | R4 de la 002 (congelada) | Q2 |
| A-506 | La paleta registra "Escuchar este post" en las páginas de post | `components/experience/**` (004, P6) | Q2. **Bloqueada** con US5 |
| A-507 | El sitemap suma las páginas de etiqueta | `app/sitemap.ts` (004, P0) | Q0 |

## Tareas bloqueadas por preguntas abiertas o dependencias

| Bloqueo | Qué bloquea | Tarea |
|---|---|---|
| 003, V3, y P-505 (camino A o B) | "Escuchar este post", su reproductor y su comando en la paleta (A-506) | T628 |
| P-503 | Diagramas con Mermaid, solo si el autor lo elige. Por defecto, SVG a mano | T629 |
| P-501 | El orden de publicación del calendario. Ningún post sale sin el visto bueno del autor | T641 |
| P-502 | El título del post 1 con la cifra exacta o con "más de" | T642 |
| P-504 | Nombrar o no el dictador de voz en el post 5 | T646 |
| 004 integrada | El post 3 enlaza al caso "Director & lines", y el 7, al caso "Legal workspace" | T644, T648 |

## Complexity Tracking

Sin violaciones que justificar.
