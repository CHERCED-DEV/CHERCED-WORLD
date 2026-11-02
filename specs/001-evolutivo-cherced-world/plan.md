# Implementation Plan: Evolutivo CHERCED-WORLD 2026

**Branch**: `001-evolutivo-cherced-world` | **Date**: 2026-11-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-evolutivo-cherced-world/spec.md`

## Summary

Migrar el portafolio de 2023 (Next 13, Pages Router, Express dentro de API routes y "CMS" en
localStorage) a Next.js 16 con App Router y React 19 sin cambiar su identidad. El contenido pasa a
módulos tipados y MDX renderizados en el servidor, en español e inglés. El GlitteringSea se reescribe
como una única instancia montada en el layout raíz, con glassmorphism por tokens encima. Los datos
privados (mensajes, comentarios y sesión del administrador) se guardan en la base existente a través de
una capa de datos solo de servidor, sin servicios ni variables nuevas. El asistente y la command palette
comparten un índice estático del contenido público, sin modelo externo. El trabajo se reparte en 7 lanes
con propiedad exclusiva de archivos: L0 va primero y congela contratos, después las otras seis corren en
paralelo, y todo se integra en la rama del evolutivo para un único corte a `main`. Antes del corte, un
hotfix separado cierra la exposición de datos del sitio 2023.

## Technical Context

**Language/Version**: TypeScript 5.9 (estricto) sobre Node.js 22 (`engines.node: "22.x"`)

**Primary Dependencies**: next 16.4, react / react-dom 19.3, mongodb 7.8, zod 4.6, server-only,
@next/mdx 16.4 + @mdx-js/loader 3.1 + @mdx-js/react 3.1, sugar-high 2.6, minisearch 7.2, sass 1.107

**Storage**: la base MongoDB existente (`MONGODB_INTEGRAL_DB`): colecciones `messages` y `comments`
existentes, y `admin_credentials`, `admin_sessions`, `setup_codes` y `rate_limits` nuevas. El contenido
vive en el repositorio.

**Testing**: Vitest 5 (unitarias y contrato), Playwright 1.64 + @axe-core/playwright 4.14 (e2e,
accesibilidad, sin JS, privacidad, contraste sobre canvas)

**Target Platform**: el proyecto existente en Vercel (serverless y CDN); navegadores: últimas 2
versiones de Chrome, Edge, Firefox y Safari

**Project Type**: aplicación web full-stack en un solo proyecto Next.js

**Performance Goals**: LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms en móvil de gama media; fondo animado
≥ 50 fps de mediana

**Constraints**: cero infraestructura y cero variables de entorno nuevas; despliegue = merge a `main`;
intro ≤ 1,5 s; contenido visible sin JS; contraste AA sobre glass; datos personales nunca en
respuestas públicas

**Scale/Scope**: 1 administrador, 10 vistas públicas × 2 idiomas, 11 proyectos, 3 posts; tráfico de
portafolio personal (cientos de visitas al día como máximo)

ESLint 9.39 (no 10) y TypeScript 5.9 (no 7) se eligen porque son los rangos probados con
`eslint-config-next` 16 y con el type-check de Next 16. Subir de versión es una tarea posterior.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Verificación en este plan | Estado |
|-----------|---------------------------|--------|
| I. Evolución, no reemplazo | Mismas rutas con prefijo de idioma y 307 desde las de 2023 ([i18n-routing](./contracts/i18n-routing.md)); piezas firma como componentes de L2; paleta y Montserrat en tokens; contenido migrado desde `4d81960` | ✅ |
| II. Glass sobre movimiento | Tokens centralizados, fallback sólido, reduced motion y transparency, instancia única en el layout raíz, prueba de contraste sobre canvas (R-08) | ✅ |
| III. Seguridad real | scrypt + sesión opaca con hash en la base; `requireAdmin()` en cada acción; proyección `PublicComment` sin email; rate limit con IP en HMAC; hotfix 2023 antes del corte (R-05, R-06, R-14) | ✅ |
| IV. Contenido como datos | TS tipado + MDX en el repo; RSC por defecto; sin localStorage como fuente; sin auto-llamadas HTTP | ✅ |
| V. Rendimiento y accesibilidad | Presupuestos en Playwright; índice de búsqueda cargado bajo demanda; `<dialog>` nativo | ✅ |
| VI. Calidad verificable | `npm run verify`; `prebuild` en Vercel con lint + typecheck + unitarias; suite de contrato compartida | ✅ |
| VII. Propiedad exclusiva | 7 lanes con rutas disjuntas (tabla abajo); stubs con firma congelada; namespaces de i18n por lane | ✅ |
| VIII. Simplicidad operativa | Sin servicios ni variables nuevas; IP y sesiones sin secretos nuevos; polling en vez de sockets; 9 dependencias de runtime justificadas (R-16) | ✅ |

Re-check post-diseño: sin violaciones. La única tensión (sesiones "firmadas") se resolvió con la
enmienda PATCH 2.0.1 de la constitución, sin cambiar la intención del principio III.

## Project Structure

### Documentation (this feature)

```text
specs/001-evolutivo-cherced-world/
├── spec.md
├── content-inventory.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── i18n-routing.md
│   ├── content.md
│   ├── data-and-actions.md
│   └── ui-shell.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

Cada ruta indica la lane dueña. Ninguna ruta tiene dos dueños.

```text
package.json, package-lock.json, tsconfig.json, next.config.ts,      L0
eslint.config.mjs, vitest.config.ts, playwright.config.ts,
proxy.ts, mdx-components.tsx*, .gitignore, README.md
app/
├── global-error.tsx, sitemap.ts, robots.ts                           L0
├── [lang]/
│   ├── layout.tsx (layout raíz), not-found.tsx, [...rest]/        L0
│   ├── page.tsx, aboutMe/, services/, portfolio/                     L1
│   ├── blog/                                                         L4
│   ├── contactMe/, privacy/, inbox/                                  L3
└── api/
    ├── admin/updates/route.ts                                        L3
    ├── search-index/[lang]/route.ts                                  L5
    └── (rutas 2023 → 410) contactMe/, blog/, sockets/, customCMS/, projects/   L3
components/
├── ui/          GlassSurface, Button, Dialog, FormField, Toast…      L0
├── shell/       SiteHeader, FloatMenu, SiteFooter, BackToTop,        L0
│                LangSwitch, ThemeToggle, PaletteTrigger
├── motion/      Background (GlitteringSea v2), Intro, loaders        L2 (stub de L0)
├── site/        HomeBanner, About*, Services, Portfolio*, Project*   L1
├── blog/        PostLayout, Toc, Share, Code, CommentForm, Comments  L4
├── contact/     ContactForm, ConsentField                            L3
├── admin/       Login, Setup, Inbox, Moderation, Updates             L3
└── experience/  ExperienceRoot, CommandPalette, Assistant, Capsule   L5 (stub de L0)
content/
├── types.ts                                                          L0
├── site.ts, projects.ts, capsule.ts, posts/**                        LC (seeds de L0)
└── i18n/<lang>/<ns>.json                                             dueño del namespace
lib/
├── i18n/, content/, events.ts, site-url.ts                           L0
├── validation/, actions/result.ts                                    L0
├── data/types.ts, data/index.ts, data/memory/                        L0
├── data/mongo/, auth/, security/                                     L3
├── actions/contact.ts, comments.ts, auth.ts, admin.ts                L3 (firmas de L0)
├── motion/                                                           L2
├── blog/                                                             L4
└── search/, assistant/                                               L5
styles/          tokens, _glass, _breakpoints, globals                L0
public/
├── fonts/                                                            L0
├── assets/                                                           LC
└── capsule/                                                          L5
tests/
├── unit/<lane>/, e2e/<lane>/                                         cada lane la suya
└── contract/repos.contract.ts                                        L0
```

`*` `mdx-components.tsx` lo crea L0 con los componentes por defecto y queda en manos de L4 desde el
congelamiento.

**Structure Decision**: un solo proyecto Next.js con App Router. No se separa backend ni frontend
(principio VIII). Se eliminan `pages/`, `components/` de 2023, `sass/`, `utils/` y `messages.json`;
`public/assets/` se conserva y lo reorganiza LC.

## Lanes

| Lane | Alcance | Historias / requisitos | Depende de |
|------|---------|------------------------|------------|
| **H** Hotfix 2023 | Cerrar la exposición en el código 2023 sobre `main` | FR-116, SC-018 | — |
| **L0** Foundation | Tooling, layouts, shell, i18n, tokens glass, primitivas, contratos, fakes, seeds, borrado de 2023 | FR-001/002/006/007/008, FR-010/011/012, FR-020/021/022/024/025, FR-060–065, FR-102, FR-110–114 | H fusionado en `main` |
| **LC** Contenido | Migración bilingüe completa, assets, alt, posts MDX, cápsula (texto) | FR-004, FR-064, FR-075, FR-083, FR-103 (datos) | L0 |
| **L1** Sitio público | Home, sobre mí, servicios, portafolio, casos de estudio, carrusel, filtro | US1, US7 | L0 |
| **L2** Movimiento | GlitteringSea v2, intro, loaders, intensidad por página, prueba de contraste | US2, FR-005, FR-013–017 | L0 |
| **L3** Datos privados | Mongo, auth, setup, contacto, privacidad, inbox, moderación, updates, rutas 410 | US3, US4, FR-030–049, FR-036 | L0 |
| **L4** Blog | Render MDX, código, TOC, compartir, UI de comentarios y respuestas | US6 | L0 |
| **L5** Experiencia | Palette, asistente, índice de búsqueda, cápsula (UI y capturas) | US8, US9, FR-090–104, FR-117 | L0 |

Orden de integración en la rama del evolutivo: L0 → LC → L2 → L1 → L4 → L3 → L5. Después se corre la
verificación completa, se revisa en la vista previa de Vercel y se hace el corte a `main` (FR-115).

## Enmiendas de L0 antes del congelamiento (`l0-frozen`)

L0 es dueña de los contratos hasta el tag `l0-frozen`. Estas decisiones se tomaron al implementarlos y
ya están reflejadas en `contracts/` y `data-model.md`:

| # | Cambio | Motivo |
|---|--------|--------|
| A-01 | Ruta nueva de L0 `app/[lang]/[...rest]/page.tsx` que renderiza el 404 con identidad desde el servidor (`noindex`) | Sin `app/layout.tsx`, las URLs desconocidas bajo un idioma no llegan a `[lang]/not-found.tsx`. Además, en Next 16.4 toda respuesta de `notFound()` sale como shell de error y la UI la pinta el cliente (verificado), así que el catch-all es la única forma de que el 404 se vea sin JS |
| A-02 | Montserrat con `next/font/google` en vez de `next/font/local` | `public/fonts/Montserrat` solo trae el peso Regular; los títulos necesitan pesos reales. Se autoaloja en build, sin llamadas en runtime |
| A-03 | `getDictionary` se importa desde `@/lib/i18n/server`; `@/lib/i18n` queda universal | Que un Client Component pueda usar `localizedPath` sin arrastrar `server-only` ni diccionarios |
| A-04 | El proxy solo fija `cw-lang` en navegaciones de documento; `LangSwitch` la guarda en el cliente | Next quita los headers `rsc`/`next-router-prefetch` antes del proxy y los prefetch de `/es/*` pisaban la preferencia |
| A-05 | Firmas finales de `lib/actions/auth.ts` (`(prev, formData)`) y `lib/actions/admin.ts` (argumentos explícitos) | El borrador solo listaba nombres |
| A-06 | `getCapsule()` en `lib/content` y `SiteContent.about.image` | L5 necesita la cápsula y L1 el retrato con alt bilingüe |
| A-07 | Los repositorios aplican las transiciones de estado de data-model y la regla de la respuesta del autor; semántica de `hit` documentada | Que memoria y Mongo se comporten igual y la suite de contrato lo pruebe |
| A-08 | Errores de validación como claves de i18n (`ERROR_KEYS`) y `setupSchema` con confirmación | Una sola fuente de textos y evitar que el autor quede fuera por un error de tipeo en la contraseña |
| A-09 | Menú flotante sobre `popover` nativo; atributos `data-js`, `data-theme`, `data-intro` los pone el script en línea | Funciona sin JS y sin destello |
| A-10 | `ExperienceRoot` y los componentes de motion pueden ser Server Components `async` | L5 necesita leer su namespace en el servidor |
| A-11 | `agentRules: false` en `next.config.ts` | `next dev` creaba un `AGENTS.md` fuera de toda lane |

## Complexity Tracking

Sin violaciones de la constitución que justificar.
