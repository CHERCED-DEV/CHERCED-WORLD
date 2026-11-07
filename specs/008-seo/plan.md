# Implementation Plan: SEO y dominio propio

**Branch**: `lane/SEO` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: [spec.md](./spec.md), a partir de [idea.md](./idea.md)

## Summary

El origen canónico pasa a ser una constante (`SITE_ORIGIN`) que manda en producción y que todo lo público usa. La
entidad "Camilo Hernández" se completa con `sameAs`, `WebSite`, `ProfilePage`, `CreativeWork` por caso y migas. Las
páginas de sección y las descripciones dicen lo que la gente busca, con texto que ya está en el sitio. Se agregan
enlaces internos entre casos, posts y servicios dentro de componentes que ya existen, el mecanismo de verificación de
Search Console y Bing queda listo y vacío, y una guía deja al autor los pasos que el repo no puede dar.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16.4.3 (App Router), React 19

**Primary Dependencies**: las del repo. Ninguna nueva

**Storage**: N/A (contenido como datos en `content/`)

**Testing**: Vitest (`tests/unit/seo/`), Playwright 1.64 (`tests/e2e/seo/`) en `desktop-chromium`, `mobile-chromium`
y `no-js`

**Target Platform**: Vercel (el proyecto existente; push a `main` despliega)

**Project Type**: sitio web

**Performance Goals**: sin costo medible: cuatro scripts JSON-LD de menos de 2 KB por página, sin JS de cliente nuevo

**Constraints**: sin infraestructura, sin variables de entorno, sin servicios de pago, sin dependencias nuevas, sin
cambios visibles salvo metadata y enlaces internos discretos

**Scale/Scope**: 10 páginas, 15 casos, 5 posts y 14 etiquetas, en ES y EN

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| I. Evolución, no reemplazo | Todo es aditivo. Las rutas no cambian; los títulos de sección siguen la plantilla de FR-706 |
| II. Glass sobre movimiento | No se tocan tokens, glass ni animaciones. Los enlaces nuevos reutilizan `buttonClassName` y los estilos de repos y de "Posts relacionados" |
| III. Seguridad real | El JSON-LD no publica correo, teléfono ni dirección exacta (prueba de la 004 más la de la 008). El token de verificación no es secreto: Google y Bing lo leen en el HTML |
| IV. Contenido como datos, SSR | El JSON-LD se arma con datos de `content/` y diccionarios, y sale en el HTML del servidor (e2e `no-js`). La relación caso → post vive en `content/related.ts` |
| V. Rendimiento y accesibilidad | Sin JS de cliente nuevo. Los enlaces nuevos son `<a>` con texto visible, operables con teclado |
| VI. Calidad verificable | Unitarias por cada JSON-LD, sitemap, `robots`, títulos y enlaces; e2e que recorre el sitemap entero |
| VII. Lanes con propiedad exclusiva | La lane SEO es dueña de los archivos de la tabla de abajo durante esta spec. Las enmiendas a pruebas de otras specs se listan |
| VIII. Simplicidad operativa | Sin infraestructura ni variables nuevas. La configuración no secreta (origen, tokens) vive versionada. Lo que exige consola externa (Vercel, DNS, Search Console) queda en la guía del autor |

## Research (decisiones)

- **R-801 Constante en vez de variable**: el origen canónico es `SITE_ORIGIN` en `lib/site-url.ts`. Una variable nueva
  rompería la constitución (VIII), y depender de `VERCEL_URL_CORS` deja la canónica a merced de la configuración de
  Vercel. *Alternativa descartada*: seguir leyendo variables en producción.
- **R-802 Solo en producción**: `getSiteUrl()` devuelve la constante cuando `VERCEL_ENV === 'production'`. En vista
  previa y en local sigue igual (las e2e usan `localhost`), así no se rompen las pruebas ni las vistas previas.
- **R-803 La redirección la hace Vercel**: la redirección de dominio de Vercel responde en el borde y conserva la ruta.
  *Alternativa descartada*: una redirección por host en `next.config.ts`, que solo haría falta si Vercel no permitiera
  redirigir el dominio `vercel.app` (queda anotado en la guía, §4, como decisión del autor).
- **R-804 Verificación por DNS en el dominio nuevo y meta tag en `vercel.app`**: el DNS de `vercel.app` no es del
  autor, así que esa propiedad se verifica con meta tag; el dominio nuevo, con DNS (cubre `http`, `https` y `www`). El
  meta tag sale de `SEARCH_VERIFICATION`, vacío hasta que el autor pegue su valor.
- **R-805 `@id` en vez de repetir el `Person`**: `WebSite`, `CreativeWork`, `BlogPosting` (decisión R-507 de la 005) y
  las migas apuntan al `Person` del layout por `@id`. `ProfilePage` es la excepción: su `mainEntity` lleva el `Person`
  completo (mismo `@id`), porque es la página del perfil y Google pide los datos de la entidad ahí.
- **R-806 Claves `searchTitle`**: los títulos descriptivos van en claves nuevas para que la imagen OG, el RSS y las
  pruebas de la OG sigan con el nombre corto de la sección.
- **R-807 `CreativeWork` para los casos**: `SoftwareApplication` pediría precio, sistema operativo o calificaciones que
  el contenido no tiene. `CreativeWork` dice lo que hay sin inventar.
- **R-808 Enlaces en componentes existentes**: los enlaces del caso van en su `nav` de enlaces con el estilo de los
  repos; los del post, como tarjeta de "Posts relacionados". Sin secciones nuevas ni CSS nuevo.
- **R-809 Migas solo en datos**: las migas visibles cambiarían el diseño; en JSON-LD bastan para el resultado de
  búsqueda.

## Archivos de la lane

| Archivo | Cambio |
|---|---|
| `lib/site-url.ts` | `SITE_ORIGIN`, `SITE_HOST` y la regla de producción |
| `lib/og/template.tsx` | `OG_DOMAIN` lee `SITE_HOST` |
| `content/projects.ts` | El enlace en vivo del caso 2 lee `SITE_ORIGIN` |
| `content/related.ts` (nuevo) | Caso 2 → posts 4 y 5 |
| `lib/seo/person.ts` | `personSameAs()` con Platzi; "Camilo Hernández Cediel" en `alternateName` |
| `lib/seo/website.ts`, `profile-page.ts`, `breadcrumbs.ts`, `case-study.ts`, `verification.ts` (nuevos) | Los JSON-LD nuevos y la verificación |
| `lib/seo/blog-posting.ts`, `lib/seo/synergos.ts` | Migas del post; `producer` Synergos Labs |
| `app/[lang]/layout.tsx` | Meta de verificación cuando hay token |
| `app/[lang]/page.tsx`, `aboutMe/page.tsx`, `portfolio/[id]/page.tsx`, `blog/[id]/page.tsx` | Scripts JSON-LD y enlaces relacionados |
| `app/[lang]/services/page.tsx`, `portfolio/page.tsx`, `blog/page.tsx`, `ai-lab/page.tsx` | Títulos `searchTitle` |
| `app/sitemap.ts` | Fechas reales de `/now`, `/privacy` y `/synergos` |
| `components/site/portfolio/related.ts` (nuevo), `CaseStudy.tsx` | Enlaces caso → post y caso → Servicios |
| `components/blog/PostView.tsx`, `post/RelatedPosts.tsx` | Post → caso |
| `content/i18n/{es,en}/{common,site,contact,blog,ailab,portfolio}.json` | Descripciones de FR-820, títulos de FR-821 y etiquetas de los enlaces |
| `tests/unit/seo/**`, `tests/e2e/seo/**` (nuevos) | Pruebas de la 008 |

## Enmiendas a pruebas de otras specs

| Prueba | Antes | Ahora | Por qué |
|---|---|---|---|
| `tests/unit/p0/person-jsonld.test.ts` | `sameAs` con LinkedIn y GitHub; tres `alternateName` | Más Platzi; cuatro `alternateName` | FR-810 |
| `tests/unit/pc2/bloque2.test.ts` | Tres `alternateName` | Cuatro | FR-810 (P-706 sigue: el nombre es "Camilo Hernández") |
| `tests/unit/p0/identity-copy.test.ts` | Descripciones de contenido.md §1 | Las de FR-820 (sigue exigiendo Home = `common:meta.description`) | FR-820 |
| `tests/e2e/l1/site.spec.ts` | "Servicios · …", "Portfolio · …" | Los títulos de FR-821 | FR-821 |
| `tests/e2e/l4/blog.spec.ts` | "Blog · Camilo Hernández" | "Blog de arquitectura y agentes de IA · Camilo Hernández" | FR-821 |
| `tests/e2e/x0/ai-lab.spec.ts` | "AI Lab · Camilo Hernández" | `ailab.meta.title` · Camilo Hernández | FR-821 |
| `tests/e2e/q2/post.spec.ts` | El post 4 no muestra "Posts relacionados" | El post 4 no tiene posts relacionados pero sí su caso (2) | FR-850 |
| `tests/e2e/p0/shell.spec.ts` | `sameAs` con LinkedIn y GitHub | Más Platzi | FR-810 |

`tests/e2e/p4/cases.spec.ts` no cambia: espera que Tab lleve del último repo del caso 12 al diagrama vivo, así que los
enlaces nuevos del caso van antes de los repos dentro del mismo `nav`.

## Riesgos

- **Solo se ve de verdad en producción**: el origen de la constante solo manda con `VERCEL_ENV === 'production'`. En
  una vista previa la canónica sigue saliendo de las variables (hoy, el dominio de producción) y `og:image` sale con la
  URL de la rama (B7 de la 007). La prueba de resultados enriquecidos de Google necesita una URL pública: se corre en
  la vista previa o en producción.
- **Vercel y el dominio `vercel.app`**: si Vercel no deja redirigir el dominio por defecto, hace falta la alternativa de
  R-803 con visto bueno del autor.
- **El nombre común**: "Camilo Hernández" a secas compite con homónimos; la spec lo mide sin prometerlo.
