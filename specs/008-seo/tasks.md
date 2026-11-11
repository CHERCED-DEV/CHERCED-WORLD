# Tasks: SEO y dominio propio (008)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Guía del autor**: [guia-search-console.md](./guia-search-console.md)
· **Rama**: `lane/SEO`, sobre `007-pulido-y-conversion` (960a91b)

**Formato**: `- [ ] T8xx [Bloque] Descripción con ruta`. La lane cierra con `npm run build` en verde (lint, tipos y
Vitest en el `prebuild`) y las e2e de `tests/e2e/seo` y de las pruebas que tocó, en `desktop-chromium`,
`mobile-chromium` y `no-js`.

## Fase 0: especificar

- [x] T800 `specs/008-seo/`: spec con la auditoría (A1 a A19), requisitos, preguntas P-801 a P-807 con su supuesto,
  plan con las decisiones R-801 a R-809, esta lista y la guía del autor.

## Bloque 1: el dominio en un solo sitio

- [x] T801 [FR-801] `SITE_ORIGIN` y `SITE_HOST` en `lib/site-url.ts`; en producción `getSiteUrl()` devuelve la
  constante.
- [x] T802 [FR-801] `OG_DOMAIN` (`lib/og/template.tsx`) y el enlace en vivo del caso 2 (`content/projects.ts`) leen la
  constante. La cápsula 2023 conserva su origen histórico.
- [x] T803 [SC-801, SC-802] `tests/unit/seo/canonical-origin.test.ts`: el dominio no se escribe en otro archivo, y en
  producción `robots`, el sitemap, el JSON-LD, el RSS y `llms.txt` salen con la constante.
- [ ] T804 [FR-802] **Autor**: comprar el dominio (P-801), conectarlo en Vercel, cambiar `SITE_ORIGIN` y configurar la
  redirección 301 desde `cherced-world.vercel.app` (guía §2 a §4).

## Bloque 2: la entidad

- [x] T810 [FR-810] `lib/seo/person.ts`: `personSameAs()` con LinkedIn, GitHub `CHERCED-DEV` y Platzi;
  "Camilo Hernández Cediel" en `alternateName`.
- [x] T811 [FR-811] `lib/seo/website.ts` y el script `data-cw-website` en Home.
- [x] T812 [FR-812] `lib/seo/profile-page.ts` y el script `data-cw-profile-page` en Sobre mí.
- [x] T813 [FR-813] `lib/seo/case-study.ts` (`CreativeWork`) y el script `data-cw-case-ld` en cada caso.
- [x] T814 [FR-814] `lib/seo/breadcrumbs.ts`; migas en los casos (`caseBreadcrumbJsonLd`) y en los posts
  (`postBreadcrumbJsonLd`), con `data-cw-breadcrumbs`.
- [x] T815 [FR-815] `producer` Synergos Labs en `lib/seo/synergos.ts`.
- [x] T816 [SC-806] `tests/unit/seo/jsonld.test.ts`: forma de cada JSON-LD, URLs absolutas del origen, sin datos
  privados, y un `CreativeWork` por caso en ES y EN.

## Bloque 3: títulos y descripciones

- [x] T820 [FR-820] Descripciones nuevas de Home (y `common:meta.description`), Sobre mí, Servicios y Contacto en ES y
  EN.
- [x] T821 [FR-821] Claves `searchTitle` de Servicios, Portafolio y Blog, y `ailab.meta.title`, usadas en sus páginas.
- [x] T822 [FR-822, SC-804] `tests/unit/seo/metadata.test.ts`: largo de títulos y descripciones, y que solo nombran lo
  que el sitio cuenta.

## Bloque 4: técnico

- [x] T830 [FR-830] `tests/unit/seo/sitemap-robots.test.ts`: las rutas `noindex` del código no están en el sitemap;
  cada entrada declara `es`, `en` y `x-default`.
- [x] T831 [FR-831] `robots.txt` sin cambios, con prueba.
- [x] T832 [FR-832] Fechas reales de `/now`, `/privacy` y `/synergos` en `app/sitemap.ts`.
- [x] T840 [FR-840] `lib/seo/verification.ts` (`SEARCH_VERIFICATION` vacío) y la meta en `app/[lang]/layout.tsx` solo
  con token.
- [ ] T841 [FR-840] **Autor**: pegar el token de Google (y el de Bing, si no importa desde Search Console) en
  `SEARCH_VERIFICATION` (guía §1 y §6).
- [x] T850 [FR-850] `content/related.ts`, `components/site/portfolio/related.ts`; enlaces del caso en
  `CaseStudy.tsx` y tarjeta del caso en `RelatedPosts.tsx`.
- [x] T851 [FR-851] `tests/unit/seo/alt-text.test.ts`: `alt` de las imágenes de contenido y de los posts.
- [x] T852 [SC-803, SC-805] `tests/e2e/seo/seo.spec.ts`: recorrido del sitemap entero (200, canónica propia,
  `hreflang`, sin `noindex`, `alt`), 404 `noindex`, 308 de etiquetas, mismo origen en `robots`, RSS y `llms.txt`,
  JSON-LD en el HTML, títulos y enlaces internos en escritorio, móvil y sin JS.
- [x] T853 Pruebas de otras specs ajustadas (plan, "Enmiendas a pruebas de otras specs").

## Bloque 5: medición y pasos del autor

- [x] T860 [FR-860] Tabla de búsquedas en la spec y método de medición en la guía (§8).
- [ ] T861 **Autor**: Search Console en `cherced-world.vercel.app` y luego en el dominio nuevo, sitemap enviado y
  cambio de dirección (guía §1 y §5).
- [ ] T862 **Autor**: Bing Webmaster Tools (guía §6).
- [ ] T863 **Autor**: enlaces desde LinkedIn, GitHub y Platzi al sitio (guía §7).
- [ ] T864 **Autor**: llenar "Antes" y, a las 8 semanas del dominio, "Después" en la tabla FR-860; prueba de resultados
  enriquecidos en Home, Sobre mí, un caso y un post (SC-807).
- [x] T865 Respuestas conciliadas con `spec.md`, sección de respuestas del autor del 2026-11-07 y decisiones delegadas. Instagram aplicado; dominio y verificaciones externas conservan sus tareas abiertas.

## Cierre de la lane

- [x] T870 `npm run build` en verde y e2e de la lane y de las pruebas tocadas en verde. Commits en `lane/SEO`, sin push
  ni merge.

### Resultados (2026-11-06)

- `npm run build`: lint y tipos en verde; Vitest 164 archivos, 1.890 pruebas en verde y 27 omitidas; `next build` en
  verde (120 páginas estáticas). Con la máquina cargada por la suite del orquestador, tres corridas anteriores
  fallaron solo por tiempo (5 s) en pruebas ajenas a la lane (`p0/content-refs`, `r1/home-dictionary`,
  `p5/contact`); las tres pasan solas y en la corrida final.
- e2e de la lane (`tests/e2e/seo`, puerto 3145, 2 workers): 20 en verde en `desktop-chromium`, `mobile-chromium` y
  `no-js` (13 omitidas por proyecto a propósito).
- e2e tocadas (`l1/site`, `l4/blog`, `q2/post`, `x0/ai-lab`, `pc1/bloque1`, `s1/synergos`, `p0/shell`,
  `pc4/not-found`, `p4/cases`, `pc4/tags`, `q0/blog-base`): todas en verde salvo una que ya fallaba en la base.
- **Falla previa, ajena a la lane**: `s1/synergos.spec.ts` "desde Sobre mí, justo debajo de las cifras" en
  `desktop-chromium` (el botón queda en y = 654 y las cifras terminan en y = 1.092). El commit `5ad0bf1` de la 007
  movió "Ver mi master product" a la columna del retrato en escritorio y la prueba no se actualizó. La 008 no toca ese
  layout (en Sobre mí solo agrega un script JSON-LD al final). Queda para el director.

## Análisis (speckit.analyze, 2026-11-06)

| Chequeo | Resultado |
|---|---|
| Cada FR tiene tarea | Sí: FR-801 a FR-860 están en T801 a T864 |
| Cada SC tiene prueba | SC-801 a SC-806 con unitarias o e2e; SC-807 es del autor (T864) |
| Constitución | Sin infraestructura, variables, dependencias ni cambios de diseño (plan, Constitution Check) |
| Cero invención | Las descripciones citan su fuente (FR-820); el JSON-LD no trae fechas, precios ni calificaciones; el token de verificación arranca vacío |
| Conflictos con specs anteriores | FR-706 (007): los títulos de cuatro secciones cambian dentro de su plantilla, pregunta P-805. Contenido.md §1 (004): descripciones enmendadas en FR-820. R-507 (005): se conserva |
| Lo que solo se verifica fuera del repo | La canónica con `SITE_ORIGIN` en producción, la prueba de resultados enriquecidos, la redirección 301 y la medición |

