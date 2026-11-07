# Tasks: El blog (005)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Datos**: [data-model.md](./data-model.md) ·
**Research**: [research.md](./research.md) · **Base**: la 004 integrada (o su `p0-frozen` con las transferencias del
plan) · **Rama**: `005-blog`

**Formato**: `- [ ] T6xx [P] [USx] Descripción con ruta`.

- `[P]` marca una tarea que puede correr en paralelo con las demás de su lane.
- `[USx]` es la historia de la spec.
- **BLOQUEADA** lleva la pregunta o la dependencia que la frena.

**Reglas para todas las lanes**:

- Cada lane trabaja en `.worktrees/Q<n>`, rama `lane/Q<n>`, y toca solo sus rutas.
- Cierra con `npm run verify` y sus e2e en verde, con su `E2E_PORT` (3120 a 3125).
- Las e2e usan el repositorio en memoria, nunca la base de producción.
- Ningún texto trae cifras o nombres internos del empleador, material de clientes ni rutas de archivos privados del
  autor.

## Precondición (orquestador)

- [ ] T601 Confirmar el punto de partida y crear la rama `005-blog` y los worktrees `.worktrees/Q0` a `.worktrees/Q5`.
  El punto de partida es uno de estos dos:
  - la 004 integrada (camino recomendado);
  - el `p0-frozen` de la 004, con A-501, A-502, A-504 y A-507 aplicadas por su P0 y `content/posts/**` transferido a Q4.

## Q0 Foundation del blog (va primero y congela con `q0-frozen`)

Rutas: `content/types.ts` (solo `PostMeta`), `content/posts/series.ts`, `content/i18n/{es,en}/blog.json`,
`content/site.ts` (solo `blog.*`), `lib/blog/**`, `lib/seo/blog-posting.ts`, `app/sitemap.ts`, `tests/unit/q0/**`.

- [ ] T602 A-501 en `content/types.ts`: `PostMeta` suma `featured?: true`, `updated?: string`, `series?: { id: string;
  part: number }` y `cover?: 'generated'`. `image` sigue obligatoria (data-model §1).
- [ ] T603 [P] `content/posts/series.ts` (vacío), con el tipo `PostSeries` (data-model §2).
- [ ] T604 [P] A-504: copy de la tabla "Copy" de la spec en `content/i18n/{es,en}/blog.json`, y `site.blog.welcome` y
  `meta.blog.description` en `content/site.ts` (FR-503, FR-542).
- [ ] T605 [P] Utilidades en `lib/blog/` (data-model §4):
  - `tags.ts`: `tagSlug`, `tagPath` y `allTagSlugs`;
  - `groups.ts`: `groupByYear` y `featuredPost`;
  - `related.ts`: `relatedPosts`;
  - `series.ts`: `seriesParts`;
  - `feed.ts`: `feedItems`, `feedAlternates` y el escape XML;
  - todo exportado desde `lib/blog/index.ts`.
- [ ] T606 [P] A-502: `lib/seo/blog-posting.ts` con `blogPostingJsonLd` (research R-507). Reutiliza `jsonLdScript` y el
  `@id` de `lib/seo/person.ts` sin cambiarlos.
- [ ] T607 [P] A-507: las páginas de etiqueta en `app/sitemap.ts` (`allTagSlugs` × idiomas).
- [ ] T608 Pruebas en `tests/unit/q0/`:
  - `groups.test.ts`: "Ahora" es el año más reciente con posts, no el año del calendario;
  - `related.test.ts`: hasta 3 y sin repetir anterior, siguiente ni el propio;
  - `tags.test.ts`: unión de los dos idiomas y slugs estables con tildes y espacios;
  - `feed.test.ts`: escape, RFC 822 y solo los posts del idioma;
  - `meta.test.ts`: `featured` como máximo uno por idioma, `updated ≥ date`, `series.id` existente y `part` único;
  - `blog-posting.test.ts`.
- [ ] T609 `npm run verify` y las e2e de l4, r4 y q0 en verde. Tag `q0-frozen`.

## Q1 Índice (después de `q0-frozen`)

Rutas: `app/[lang]/blog/page.tsx`, `app/[lang]/blog/tag/**`, `components/blog/{BlogIndex,BlogIntro,PostCard,PostMedia}*`,
`components/blog/index/**`, `tests/unit/q1/**`, `tests/e2e/q1/**`.

- [ ] T610 [US1] Post destacado arriba, con portada grande y sin repetirse en la grilla, y el resto en grilla:
  `components/blog/index/FeaturedPost.tsx` y `BlogIndex.tsx` (FR-501, FR-502).
- [ ] T611 [US1] Grupos por año con los títulos "Ahora" y "Archivo" en `components/blog/index/YearGroup.tsx`, con
  `groupByYear` (FR-502, R-504).
- [ ] T612 [P] [US1] La bienvenida nueva en `components/blog/BlogIntro.tsx` (FR-503).
- [ ] T613 [P] [US1] `components/blog/index/GeneratedCover.tsx` (R-502). `PostCard.tsx` y `PostMedia.tsx` lo usan cuando
  el post tiene `cover: 'generated'` (FR-504). Mostrar al autor el post 3 con portada generada para que confirme.
- [ ] T614 [US2] Etiquetas como enlaces y páginas estáticas `app/[lang]/blog/tag/[tag]/page.tsx` (FR-505, R-503):
  - `generateStaticParams` con la unión de etiquetas y `dynamicParams = false`;
  - lista vacía con enlace al índice para la etiqueta que no existe en ese idioma;
  - se anuncia la cantidad.
- [ ] T615 [US2] Búsqueda del blog en `components/blog/index/BlogSearch.tsx`, sobre el índice que ya existe, filtrado a
  posts del idioma (FR-506):
  - sin JS no se muestra, y las etiquetas cubren;
  - sin resultados, ofrece limpiar.
- [ ] T616 [P] [US4] Enlace visible "Suscríbete por RSS" y `alternates.types` con `feedAlternates` en
  `app/[lang]/blog/page.tsx` y en la página de etiqueta (FR-523).
- [ ] T617 Pruebas y cierre:
  - `tests/e2e/q1/index.spec.ts`: destacado, grupos, portada generada, etiqueta con y sin JS, etiqueta del otro idioma,
    búsqueda "saga" y "tests" (SC-501, SC-502);
  - `npm run verify` y e2e de q1 en verde.

## Q2 Página del post (después de `q0-frozen`)

Rutas: `app/[lang]/blog/[id]/page.tsx`, `components/blog/{PostView,PostNav,Toc,ReadingProgress}*`,
`components/blog/post/**`, `components/blog/mdx/**`, `components/blog/catalog/**`, `app/[lang]/blog/catalog/**`,
`mdx-components.tsx`, `tests/unit/q2/**`, `tests/e2e/q2/**`.

- [ ] T620 [US3] A-505: `components/blog/mdx/Callout.tsx`, registrado en `components/blog/mdx/index.ts` y documentado en
  el catálogo `/blog/catalog` (FR-510, R-505).
- [ ] T621 [P] [US3] Contenedor con desplazamiento propio para diagramas SVG anchos en `components/blog/mdx/MdxImage.tsx`,
  sin scroll horizontal de la página. La guía de SVG va en el catálogo (FR-511).
- [ ] T622 [P] [US3] Navegación de serie en `components/blog/post/SeriesNav.tsx`: "{serie} · parte {n} de {total}" y
  partes publicadas, con `seriesParts` (FR-512).
- [ ] T623 [P] [US3] `components/blog/post/RelatedPosts.tsx`: hasta 3, sin repetir `PostNav` (FR-513).
- [ ] T624 [P] [US3] `components/blog/post/AuthorBox.tsx`: retrato según el tema, `author.line` y enlace a Contacto
  (FR-514).
- [ ] T625 [P] [US3] Nota "Escrito originalmente en {idioma}" en `components/blog/post/TranslatedNote.tsx`, cuando el post
  es una traducción y no un fallback (FR-515). `LanguageNotice` se queda como está.
- [ ] T626 [P] [US3] "Actualizado el {fecha}" con `<time>` en `components/blog/PostView.tsx` (FR-516).
- [ ] T627 [US4] En `app/[lang]/blog/[id]/page.tsx`:
  - el JSON-LD `BlogPosting` con `blogPostingJsonLd` y `jsonLdScript` (FR-521);
  - `alternates.types` del feed (FR-523);
  - la portada generada de Q1 cuando `cover: 'generated'`.
- [ ] T628 [US5] **BLOQUEADA (003, V3, y P-505)**: "Escuchar este post".
  - `components/blog/post/ListenPlayer.tsx`, con el motor que decida la 003 (FR-530, FR-531).
  - A-506: el comando "Escuchar este post" en la paleta solo en páginas de post (FR-532).
- [ ] T629 [US3] **BLOQUEADA (P-503)**: diagramas con Mermaid renderizados en el build. Solo si el autor elige Mermaid y
  se justifica la dependencia (principio VIII). Por defecto, no se hace.
- [ ] T630 Pruebas y cierre:
  - `tests/e2e/q2/post.spec.ts`: callout anunciado, diagrama a 320 px, serie, relacionados, caja de autor, nota de
    traducción, fecha actualizada y JSON-LD válido (SC-503);
  - `npm run verify` y e2e de q2 y de l4 en verde.

## Q3 Compartir y seguir (después de `q0-frozen`)

Rutas: `app/[lang]/blog/[id]/opengraph-image.tsx`, `app/[lang]/feed.xml/**`, `tests/unit/q3/**`, `tests/e2e/q3/**`.

- [ ] T635 [P] [US4] `app/[lang]/blog/[id]/opengraph-image.tsx` con `renderOgImage` de la 004 (título, fecha y etiquetas),
  prerenderizada para posts × idiomas, con `alt` localizado (FR-520, R-502).
- [ ] T636 [P] [US4] `app/[lang]/feed.xml/route.ts` con `force-static` y `generateStaticParams` para `es` y `en`, RSS 2.0
  con `atom:link rel="self"` y `Content-Type` correcto (FR-522, R-501).
- [ ] T637 Pruebas y cierre:
  - `tests/unit/q3/feed-xml.test.ts`: el XML parsea y no lleva datos fuera de la meta (SC-504);
  - `tests/e2e/q3/share.spec.ts`: `og:image` de cada post en ES y EN, feed accesible y `<link rel="alternate">` (SC-503);
  - `npm run verify` y e2e de q3 en verde.

## Q4 Calendario editorial (después de `q0-frozen`; cada post, con su visto bueno)

Rutas: `content/posts/post6/**` a `content/posts/post12/**`, `content/posts/registry.ts`, `public/assets/imgs/posts/**`,
`tests/unit/q4/**`.

- [x] T640 [P] `tests/unit/q4/posts-confidentiality.test.ts`, para los posts nuevos (FR-541):
  - sin cantidades ligadas al empleador;
  - sin rutas tipo `Desktop/` ni nombres de carpetas privadas;
  - cada post existe en ES y EN (FR-540).
- [ ] T641 **BLOQUEADA (P-501)**: el orden de publicación. El handoff recomienda arrancar con el post 1. Ningún post se
  integra sin el visto bueno del autor.
  - Orden resuelto por el autor (2026-11-07): post 1, post 2, post 3 y post 4. Sigue abierta hasta su visto bueno de
    cada post, porque el registro no tiene borradores: integrar la rama es publicar.
  - El autor autoriza incorporar el post 1 (`post6`) el 2026-11-07 cuando pase las validaciones. La revisión de los
    demás posts sigue pendiente; esta tarea permanece abierta para el resto del calendario.
- [x] T642 Post 1, "Lo que 2.353 tests no vieron" / "What 2,353 tests didn't see", en `content/posts/post6/`.
  **BLOQUEADA (P-502)** en el título: por defecto, cifra exacta con la fecha de medición en el primer párrafo.
  - Escrito en `lane/BLOG` con la cifra exacta y su fecha (6-ago-2026, CI) en el primer párrafo, registrado y con
    portada generada. El visto bueno de integración llegó el 2026-11-07, condicionado a las validaciones (T641).
- [ ] T643 [P] Post 2, "Un gate que nunca falló no vigila nada" / "A gate that never failed isn't watching anything", en
  `content/posts/post7/`.
- [ ] T644 Post 3, "Director y líneas: cómo dirijo agentes en paralelo", en `content/posts/post8/`. **Depende de la 004**:
  enlaza al caso "Director & lines".
- [ ] T645 [P] Post 4, "La compensación es dato" / "Compensation is data", en `content/posts/post9/`. Cuando exista el
  simulador de sagas de la 003 (R1), se agrega el enlace.
- [ ] T646 Post 5, "Me hice mi propio dictador de voz" / "I built my own voice dictation tool", en
  `content/posts/post10/`. **BLOQUEADA (P-504)** en el nombre y el repo de la herramienta: por defecto, ni nombre ni
  enlace.
- [ ] T647 [P] Post 6, "Agnóstico hasta el segundo caso" / "Agnostic until the second use case", en
  `content/posts/post11/`.
- [ ] T648 Post 7, "Una frontera de confianza para la IA" / "A trust boundary for AI", en `content/posts/post12/`.
  **Depende de la 004** (caso "Legal workspace"), con revisión de anonimización del autor antes de integrar.
- [ ] T649 Registrar cada post aprobado en `content/posts/registry.ts`, con portada o `cover: 'generated'`. Luego
  `npm run verify` y la auditoría de contraste de posts (l2) en verde.
  - `post6` aprobado y validado el 2026-11-07: `verify` en verde (1.976 unitarias, 27 omitidas, build de 130 páginas),
    152 e2e del blog aprobadas y 172 omitidas por proyecto; cuatro pruebas de contraste del nuevo post aprobadas.
    Se adapta su imagen al idioma con los assets existentes de la 010. Esta tarea sigue abierta para futuros posts.

## Q5 QA del blog (en paralelo; corre completa al integrar)

Rutas: `tests/e2e/q5/**`.

- [ ] T655 [P] Responsive de 320 a 2560 px en el índice, las páginas de etiqueta y todos los posts, en ES y EN (SC-502).
- [ ] T656 [P] Auditoría de interacción de los controles nuevos: etiquetas, búsqueda, enlaces de serie, relacionados y
  RSS.
- [ ] T657 [P] Accesibilidad de 95 o más y contraste AA en los callouts, la portada generada y la caja de autor.
- [ ] T658 [P] Presupuestos de LCP, CLS e INP en el índice, una página de etiqueta y un post largo (SC-505), y 0
  dependencias nuevas en `package.json` (SC-506).
- [ ] T659 Estabilizar lo que salga de T655 a T658, con la suite completa en verde en el puerto 3125.

## Integración (orquestador)

- [ ] T660 Integrar en orden Q0 → Q2 → Q1 → Q3 → Q4 → Q5, con `npm run verify` después de cada merge.
- [ ] T661 Correr la suite completa (unitarias, contrato y e2e) **3 veces seguidas en verde**.
- [ ] T662 Desplegar la vista previa, revisarla con el autor y cortar a `main` solo con su confirmación explícita.
- [ ] T663 Desbloquear T628, T629, T641, T642 y T646 a medida que se resuelvan sus preguntas, cada una con
  `npm run verify`.

## Dependencias y orden

- **T601** abre todo, y **Q0 (T602 a T609)** bloquea a Q1 a Q5.
- **Entre lanes**: solo los contratos del plan.
  - T627 (Q2) usa `GeneratedCover` de T613 (Q1). Q2 lo prueba con un doble hasta que integre Q1, que se integra
    después.
  - T616 y T627 usan `feedAlternates` de Q0.
- **Dentro de Q4**: cada post es independiente, salvo el orden que fije P-501.

## Estrategia

- **MVP**: Q0, Q1 y Q3 (US1, US2 y US4): un índice que invita a leer, filtros y buena apariencia al compartir.
- **Después**: Q2 (US3), y Q4 a medida que el autor apruebe cada post.
- **Al final**: US5, cuando la 003 resuelva V3.

## Análisis cruzado (2026-11-04)

`/speckit.analyze` sobre spec, plan y tasks:

| ID | Severidad | Hallazgo | Resolución |
|---|---|---|---|
| F1 | Alta | FR-504 y US1 pedían la imagen OG como portada de las tarjetas. Eso suma una descarga por tarjeta y pide cambiar `images.localPatterns` (R0) | FR-504 y US1 corregidos: portada generada en HTML y CSS con `cover: 'generated'` (R-502, A-501) |
| F2 | Alta | Key Entities hacía opcional `image`, lo que rompe a sus consumidores al congelar | `image` sigue obligatoria y se suma `cover?: 'generated'` (spec y data-model) |
| F3 | Media | FR-506 dejaba abierto el respaldo sin JS (página de resultados o etiquetas) | Fijado: las etiquetas con URL propia son el respaldo (R-503) |
| F4 | Media | La spec decía que la 005 crea la plantilla OG si llega primero | La plantilla es de la 004 (P0). La 005 arranca después, o tras `p0-frozen` con transferencias |
| F5 | Media | FR-532 toca la paleta, que es de la 004 (P6) | Enmienda A-506, bloqueada con US5 (T628) |
| F6 | Baja | SC-506 (cero dependencias) no tenía tarea | T658 revisa `package.json` |

**Cobertura**: los 23 requisitos funcionales y los 6 criterios de éxito tienen al menos una tarea. Hay 50 tareas:
5 bloqueadas por una pregunta o por la 003 (T628, T629, T641, T642, T646) y 2 que dependen de la 004 (T644, T648).
