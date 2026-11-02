# Tasks: Evolutivo CHERCED-WORLD 2026

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [content-inventory.md](./content-inventory.md)

**Tests**: obligatorias según el principio VI de la constitución.

**Organización**: una fase por lane. Cada lane es dueña exclusiva de las rutas listadas en "Rutas
propias"; tocar una ruta ajena es motivo para rechazar el PR (principio VII). La etiqueta `[USx]` indica
la historia que atiende cada tarea.

## Reglas para agentes

1. Trabaja solo en tu worktree y tu rama: `lane/<id>` creada desde `001-evolutivo-cherced-world` después
   de que L0 se integre.
2. Modifica únicamente tus rutas propias. Si necesitas cambiar un contrato congelado (todo lo de L0),
   detente y repórtalo como enmienda; no lo cambies tú.
3. Programa contra los contratos de `contracts/` y los fakes en memoria. Nunca contra otra lane.
4. Antes de entregar, deben pasar `npm run verify` y tus e2e (`npx playwright test tests/e2e/<lane>`).
5. Documentación en español; código sin comentarios salvo que una herramienta los exija.
6. Haz commit en tu rama con mensajes en español. No hagas push ni merge: integra el orquestador.

---

## Phase 0: Lane H — Hotfix 2023 (sobre `main`)

**Objetivo**: FR-116 y SC-018. Cerrar la exposición de datos del sitio en línea sin cambiar nada visible.

**Rutas propias**: `pages/api/contactMe/index.ts`, `pages/inbox.tsx`, `pages/api/blog/comments/[id].ts`
(código 2023, en la rama `hotfix/cerrar-exposicion-datos` creada desde `main`)

- [ ] T001 Crear la rama `hotfix/cerrar-exposicion-datos` desde `main`
- [ ] T002 Hacer que `GET /api/contactMe` responda 405 sin consultar la base (el `POST` sigue igual) en `pages/api/contactMe/index.ts`
- [ ] T003 Hacer que `getServerSideProps` devuelva `inbox: []` sin llamar a `getInBoxData()` en `pages/inbox.tsx`
- [ ] T004 Excluir `email` de la respuesta de `GET /api/blog/comments/:id` con `.select('-email')` en `pages/api/blog/comments/[id].ts`
- [ ] T005 Verificar que el proyecto 2023 compila (`npm ci && npm run build`)
- [ ] T006 Pedir confirmación al autor, hacer merge a `main` y verificar en producción: `GET /api/contactMe` → 405, y las claves de `GET /api/blog/comments/post1` sin `email` (solo se inspeccionan las claves, no el contenido)
- [ ] T007 Hacer merge de `main` en `001-evolutivo-cherced-world`

---

## Phase 1: Lane L0 — Setup

**Objetivo**: proyecto Next 16 limpio, con tooling y gate de calidad.

**Rutas propias (L0, toda la lane)**: `package.json`, `package-lock.json`, `tsconfig.json`,
`next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `proxy.ts`,
`mdx-components.tsx` (hasta congelar), `.gitignore`, `README.md`,
`app/global-error.tsx`, `app/sitemap.ts`, `app/robots.ts`,
`app/[lang]/layout.tsx`, `app/[lang]/not-found.tsx`, `components/ui/**`, `components/shell/**`,
`components/motion/**` y `components/experience/**` (solo stubs, hasta congelar), `content/types.ts`,
seeds en `content/**` (hasta congelar), `content/i18n/*/common.json`, `lib/i18n/**`, `lib/content/**`,
`lib/events.ts`, `lib/site-url.ts`, `lib/validation/**`, `lib/actions/result.ts`, stubs en
`lib/actions/{contact,comments,auth,admin}.ts` (hasta congelar), `lib/data/types.ts`,
`lib/data/index.ts`, `lib/data/memory/**`, `styles/**`, `public/fonts/**`, `tests/contract/**`,
`tests/unit/l0/**`, `tests/e2e/l0/**`, y el borrado del código 2023

- [ ] T010 Eliminar el código 2023 (`pages/`, `components/`, `sass/`, `utils/`, `messages.json`, `next.config.js`, `.eslintrc.json`), conservando `public/` y `.specify/`/`specs/`
- [ ] T011 Reescribir `package.json`: dependencias exactas de research R-16 (next 16.4.3, react/react-dom 19.3.1, mongodb 7.8.0, zod 4.6.7, server-only 0.0.1, @next/mdx 16.4.3, @mdx-js/loader 3.1.1, @mdx-js/react 3.1.1, @types/mdx 2.0.14, sugar-high 2.6.4, minisearch 7.2.0, sass 1.107.1; dev: typescript 5.9.3, eslint 9.39.5, eslint-config-next 16.4.3, vitest 5.0.5, @playwright/test 1.64.1, @axe-core/playwright 4.14.0, @types/node, @types/react, @types/react-dom), scripts `dev`, `build`, `prebuild` (lint + typecheck + `vitest run`), `lint`, `typecheck`, `test`, `e2e`, `verify`, y `engines.node: "22.x"`; regenerar `package-lock.json`
- [ ] T012 [P] Crear `tsconfig.json` estricto con alias `@/*`
- [ ] T013 [P] Crear `next.config.ts` con `@next/mdx` (`pageExtensions` con `mdx`) e `images` locales
- [ ] T014 [P] Crear `eslint.config.mjs` (flat config) con `eslint-config-next`
- [ ] T015 [P] Crear `vitest.config.ts` (alias `@`, entorno node) y `playwright.config.ts` (proyectos `desktop-chromium`, `mobile-chromium` 390×844 y `no-js` con `javaScriptEnabled: false`; `webServer` = `npm run build && npm run start`)
- [ ] T016 [P] Actualizar `.gitignore` (`.env.local`, `playwright-report/`, `test-results/`, `.next/`)

---

## Phase 2: Lane L0 — Foundational (bloquea a todas las demás)

- [ ] T020 Crear `content/types.ts` con los tipos de data-model §1 (`Locale`, `Localized`, `ImageRef`, `SiteContent`, `CareerEntry`, `EducationEntry`, `TechSkill`, `Project`, `PostMeta`, `CapsuleEntry`)
- [ ] T021 [P] Implementar `lib/i18n/` según contracts/i18n-routing.md (`locales`, `isLocale`, `getDictionary`, `t` con fallback es→en y error si falta en ambos, `localizedPath`, `switchLocalePath`, `alternates`) con pruebas en `tests/unit/l0/i18n.test.ts`
- [ ] T022 [P] Sembrar `content/i18n/{es,en}/{common,site,motion,contact,admin,privacy,blog,experience}.json` con todas las claves de content-inventory §5 y agregar la prueba de paridad `tests/unit/l0/i18n-parity.test.ts`
- [ ] T023 Implementar `proxy.ts` (exclusiones, cookie `cw-lang`, 307 al idioma preferido desde cualquier ruta sin prefijo) con pruebas en `tests/unit/l0/proxy.test.ts`
- [ ] T024 [P] Implementar los accesores de `lib/content/` (contracts/content.md) y los seeds válidos: `content/site.ts`, `content/projects.ts` (proyectos 1 y 2), `content/capsule.ts` (2 entradas), `content/posts/registry.ts` y `content/posts/post1/{es,en}.mdx`
- [ ] T025 [P] Crear `styles/tokens.scss`, `styles/_glass.scss` (mixin `glass($variant)` y fallback sólido), `styles/_breakpoints.scss` (`sm 480`, `md 768`, `lg 992`, `xl 1248`) y `styles/globals.scss` según contracts/ui-shell.md; temas `dark` (por defecto) y `light` en blanco y negro
- [ ] T026 [P] Crear las primitivas `components/ui/` (`GlassSurface`, `Button`, `Dialog` sobre `<dialog>`, `Separator`, `VisuallyHidden`, `Icon`, `FormField`, `Toast`/`useToast`) con su `*.module.scss`
- [ ] T027 [P] Crear `lib/events.ts` (`emit`, `on`) con los eventos de contracts/ui-shell.md, y `lib/site-url.ts` (R-13)
- [ ] T028 Preparar el layout raíz `app/[lang]/layout.tsx` (no hay `app/layout.tsx`): `<html lang>`, Montserrat local, script en línea de tema e intro (R-09), `metadataBase` y montaje de `Background` e `Intro` desde `@/components/motion`
- [ ] T029 [P] Crear los stubs `components/motion/index.ts` y `components/experience/index.ts` con las firmas exactas de contracts/ui-shell.md
- [ ] T030 Crear `components/shell/` (`SiteHeader` con logo, navegación y "regresar" en páginas de detalle; `LangSwitch`; `ThemeToggle` que emite `cw:theme-change`; `PaletteTrigger` con atajo Ctrl/⌘+K que emite `cw:open-palette`; `FloatMenu` móvil; `SiteFooter` con redes, ocultando `href: null`, y copyright C-01; `BackToTop`), todo en glass y operable con teclado
- [ ] T031 Completar `app/[lang]/layout.tsx` con el shell y `ExperienceRoot`, y crear `app/[lang]/not-found.tsx` y `app/global-error.tsx` con identidad visual (FR-007), más `app/sitemap.ts` y `app/robots.ts`
- [ ] T032 [P] Crear los esquemas zod de `lib/validation/` (`contactSchema`: nombre 1–60, correo válido ≤ 100, teléfono opcional `^\+?[0-9 ()-]{6,20}$`, mensaje 1–1000, `consent` obligatorio; `commentSchema`: `postId`, nombre 1–60, correo ≤ 100, comentario 1–1000, `consent`; `passwordSchema` ≥ 12; `setupSchema`; `replySchema` 1–1000) con pruebas en `tests/unit/l0/validation.test.ts`
- [ ] T033 [P] Crear `lib/actions/result.ts` y los stubs con firma final de `lib/actions/{contact,comments,auth,admin}.ts` (responden `{ ok: false, error: 'unavailable' }`)
- [ ] T034 Crear `lib/data/types.ts` (interfaces de contracts/data-and-actions.md), `lib/data/index.ts` (`getRepos()` con registro de fábrica, fakes por defecto), `lib/data/memory/*` y la suite compartida `tests/contract/repos.contract.ts`, ejecutada contra memoria en `tests/unit/l0/memory-repos.test.ts`
- [ ] T035 [P] Crear `mdx-components.tsx` con los componentes por defecto
- [ ] T036 E2E de L0 en `tests/e2e/l0/shell.spec.ts`: 307 desde las 9 rutas 2023 sin prefijo, `LangSwitch` conserva la ruta, sin destello de tema, header y menú flotante con teclado, header visible sin JS
- [ ] T037 Pasar `npm run verify` y crear el tag `l0-frozen`: desde ese punto los contratos y los stubs cambian de dueño según el plan

**Checkpoint**: L0 integrada en `001-evolutivo-cherced-world`. Las lanes LC, L1, L2, L3, L4 y L5 arrancan
en paralelo, cada una en su worktree.

---

## Phase 3: Lane LC — Contenido

**Rutas propias**: `content/site.ts`, `content/projects.ts`, `content/capsule.ts`, `content/posts/**`,
`public/assets/**`, `tests/unit/lc/**`

- [ ] T040 [US1] Migrar `content/site.ts` completo desde `git show 4d81960:pages/api/customCMS/CMS.ts`, con las correcciones C-01 a C-17, los textos de content-inventory §6 en primera persona (D-03), skills con los valores 2023 (D-04), `pending: true` en P-01 y P-03, Facebook con `href: null` (P-02) y el borrador de privacidad (`privacy`, P-06)
- [ ] T041 [P] [US7] Migrar los 11 proyectos a `content/projects.ts` desde `git show 4d81960:pages/api/projects/database/data.ts`, con el mapeo p1→contexto, p2→decisiones, p3→resultado; id 10 con `links: { live: null, github: null }`; C-06 y C-14; `summary` y `alt` bilingües; textos en español según content-inventory §10
- [ ] T042 [P] [US6] Migrar los 3 posts a `content/posts/post{1,2,3}/{es,en}.mdx` con `meta` (fecha original del commit que los agregó, etiquetas, `originalLang: 'en'`, alt de content-inventory §9) y registrarlos en `content/posts/registry.ts`
- [ ] T043 [P] [US9] Cargar las 16 entradas de content-inventory §11 en `content/capsule.ts`
- [ ] T044 [P] [US1] Ordenar `public/assets/`: conservar las rutas que usa el contenido, convertir a WebP las imágenes grandes sin perder calidad visible y dejar sin uso (no borrar) los assets de P-05 hasta que decida el autor
- [ ] T045 [US1] Prueba de completitud `tests/unit/lc/content-completeness.test.ts`: 11 proyectos, 3 posts × 2 idiomas, cero `Localized` vacíos, cero textos 2023 sin corregir (C-01 a C-17) y cada `src` existente en `public/`

---

## Phase 4: Lane L1 — Sitio público (US1, US7) 🎯 MVP visual

**Rutas propias**: `app/[lang]/page.tsx`, `app/[lang]/aboutMe/**`, `app/[lang]/services/**`,
`app/[lang]/portfolio/**`, `components/site/**`, `content/i18n/*/site.json`, `tests/unit/l1/**`,
`tests/e2e/l1/**`

- [ ] T050 [US1] Home en `app/[lang]/page.tsx` + `components/site/HomeBanner`: "My name is / Camilo / I'M A DEVELOPER", separador, redes, `<BackgroundIntensity value="full" />` y `generateMetadata`
- [ ] T051 [P] [US1] Sobre mí en `app/[lang]/aboutMe/page.tsx` + `components/site/about/*`: descripción con imagen parallax, carrera (oculta mientras haya entradas `pending`), skills con barras glass y sus valores, tecnologías, educación, cursos con enlace a Platzi e idiomas
- [ ] T052 [P] [US1] Servicios en `app/[lang]/services/page.tsx` + `components/site/services/*`: introducción y 3 tarjetas glass con enlace "Explore" al portafolio
- [ ] T053 [US7] Portafolio en `app/[lang]/portfolio/page.tsx` + `components/site/portfolio/*`: introducción, filtro por tecnología del lado cliente (sin JS se ven todos), carrusel accesible (flechas, swipe, `aria-live`) y pie "And many more to come!"
- [ ] T054 [US7] Caso de estudio en `app/[lang]/portfolio/[id]/page.tsx`: secciones con contenido nulo omitidas, botones Live y GitHub con `target="_blank" rel="noopener noreferrer"` solo si hay enlace, `generateStaticParams` 11 × 2, `notFound()` para ids desconocidos
- [ ] T055 [P] [US1] Completar `content/i18n/{es,en}/site.json` con los textos que falten
- [ ] T056 [US1] E2E en `tests/e2e/l1/`: contenido visible sin JS en las 4 páginas y el detalle, filtro, carrusel con teclado, enlaces externos, 404 de proyecto, axe sin violaciones críticas y presupuestos de rendimiento (LCP, CLS)

---

## Phase 5: Lane L2 — Movimiento (US2)

**Rutas propias**: `components/motion/**` (desde `l0-frozen`), `lib/motion/**`,
`content/i18n/*/motion.json`, `tests/unit/l2/**`, `tests/e2e/l2/**`

- [ ] T060 [US2] Motor `lib/motion/engine.ts`: partículas en Canvas 2D, interacción con puntero y toque (radio 120 px), pausa y reanudación, reducción adaptativa (mediana > 20 ms en 60 cuadros → −30 %, mínimo 60) y cuadro estático con reduced motion; pruebas en `tests/unit/l2/engine.test.ts` con canvas y rAF falsos
- [ ] T061 [US2] `components/motion/Background.tsx`: un solo canvas fijo, store de intensidad (`lib/motion/intensity.ts`), pausa con `visibilitychange` e `IntersectionObserver`, recoloreo con `cw:theme-change` y liberación de recursos al desmontar
- [ ] T062 [P] [US2] `BackgroundIntensity` (marcador `full`/`subtle` que publica en el store)
- [ ] T063 [P] [US2] `components/motion/Intro.tsx`: ≤ 1,5 s, se salta con clic, tecla o toque, respeta `data-intro`, marca `cw-intro-seen`, versión estática con reduced motion y anunciada a lectores de pantalla (FR-005)
- [ ] T064 [P] [US2] `AtomLoader` y `DotsLoader` evolucionados desde `git show 4d81960:sass/StarterAndLoaders.scss`, con etiqueta accesible
- [ ] T065 [US2] E2E en `tests/e2e/l2/`: un solo canvas tras 10 navegaciones, pausa con pestaña oculta, cero movimiento con reduced motion, intro ≤ 1,5 s y una vez por sesión, fallback sólido con reduced transparency y prueba de contraste por muestreo de píxeles en todas las páginas y ambos temas (`contrast.spec.ts`, research R-08)

---

## Phase 6: Lane L3 — Datos privados (US3, US4)

**Rutas propias**: `app/[lang]/contactMe/**`, `app/[lang]/privacy/**`, `app/[lang]/inbox/**`,
`app/api/admin/**`, `app/api/{contactMe,blog,sockets,customCMS,projects}/**`, `components/contact/**`,
`components/admin/**`, `lib/data/mongo/**`, `lib/auth/**`, `lib/security/**`,
`lib/actions/{contact,comments,auth,admin}.ts` (desde `l0-frozen`),
`content/i18n/*/{contact,admin,privacy}.json`, `tests/unit/l3/**`, `tests/e2e/l3/**`

- [ ] T070 [US3] `lib/data/mongo/`: cliente cacheado con `MONGODB_INTEGRAL_DB`, repositorios con las interfaces de L0, índices TTL idempotentes, logs de error sin datos personales (FR-114), valores por defecto de los históricos (comentario sin `status` → `approved`, mensaje sin `status` → `read`, `phone` numérico tal cual) y `register.ts`; la suite `tests/contract/repos.contract.ts` corre contra Mongo si existe la variable (`tests/unit/l3/mongo-repos.test.ts`)
- [ ] T071 [P] [US3] `lib/security/`: `ipHash` = HMAC-SHA256 con clave SHA-256(`MONGODB_INTEGRAL_DB`), lectura de IP desde `x-forwarded-for`, y reglas de rate limit de data-model §2, con pruebas
- [ ] T072 [P] [US4] `lib/auth/`: `password.ts` (scrypt N=2^15, sal de 16 bytes, comparación en tiempo constante), `session.ts` (token de 32 bytes, cookie `cw-admin` `HttpOnly; Secure; SameSite=Lax`, SHA-256 en la base, 12 h deslizantes), `setup.ts` (código de 8 caracteres, vigencia 24 h, línea de log `[CHERCED-WORLD] Código de configuración inicial: XXXX-XXXX (vence <fecha>)`) y `requireAdmin()`, con pruebas
- [ ] T073 [US3] `submitContact` en `lib/actions/contact.ts`: campo trampa `website`, `renderedAt` ≥ 3 s, `consent` obligatorio (`consent_required`), validación zod, 3 envíos por 10 min, guardado con `status: 'unread'` y `consentAt`
- [ ] T074 [US3] `submitComment` y `getApprovedComments` en `lib/actions/comments.ts`: el `postId` debe estar en `postIds()`, queda `pending`, con consentimiento y anti-spam; la lectura pública devuelve `PublicComment` sin email
- [ ] T075 [US4] `login`, `logout`, `completeSetup` y `changePassword` en `lib/actions/auth.ts`, con bloqueo de 5 fallos en 15 min y mensaje genérico
- [ ] T076 [US4] Acciones de `lib/actions/admin.ts`: estados de mensaje, borrado, estados de comentario, respuesta del autor (solo en `approved`; se borra al pasar a `rejected`) y borrado; todas con `requireAdmin()`
- [ ] T077 [US3] Contacto en `app/[lang]/contactMe/page.tsx` + `components/contact/*`: formulario con `useActionState`, errores por campo sin perder lo escrito, casilla de autorización con enlace a privacidad, toast honesto y `BackgroundIntensity subtle`
- [ ] T078 [P] [US3] Política de privacidad en `app/[lang]/privacy/page.tsx`, desde `site.privacy`
- [ ] T079 [US4] Panel en `app/[lang]/inbox/**` + `components/admin/*`: layout con `requireAdmin()` o login/setup (setup → 404 si existe credencial), inbox (ordenar, filtrar, leído/no leído, archivar, eliminar con confirmación, responder con `mailto:`), moderación (aprobar, rechazar, eliminar, responder como autor), contador de no leídos solo aquí, cambio de contraseña y `noindex`
- [ ] T080 [US4] `GET /api/admin/updates` en `app/api/admin/updates/route.ts` (401 sin sesión) + `components/admin/Updates`: polling cada 5 s, pausa con pestaña oculta, backoff de 5 a 30 s e indicador "reconectando"
- [ ] T081 [P] [US3] Rutas 2023 retiradas (`app/api/{contactMe,blog,sockets,customCMS,projects}/[[...slug]]/route.ts`) que responden 410
- [ ] T082 [US3] E2E en `tests/e2e/l3/`: contacto (sin casilla, válido, rate limit, campo trampa), escaneo de privacidad de todas las respuestas y HTML públicos (cero correos ni teléfonos, SC-007), setup + login + bloqueo, 401 en vistas privadas y mensaje visible en ≤ 10 s con dos contextos de navegador

---

## Phase 7: Lane L4 — Blog (US6)

**Rutas propias**: `app/[lang]/blog/**`, `components/blog/**`, `lib/blog/**`, `mdx-components.tsx`
(desde `l0-frozen`), `content/i18n/*/blog.json`, `tests/unit/l4/**`, `tests/e2e/l4/**`

- [ ] T090 [P] [US6] `lib/blog/`: tiempo de lectura (200 palabras/min), índice desde los encabezados y URLs para compartir, con pruebas
- [ ] T091 [US6] Índice del blog en `app/[lang]/blog/page.tsx`: bienvenida, átomo decorativo, tarjetas glass, aviso de idioma original y metadatos
- [ ] T092 [US6] Post en `app/[lang]/blog/[id]/page.tsx`: `generateStaticParams`, `loadPost`, encabezado (título, fecha, etiquetas, tiempo de lectura), índice si es largo, compartir, imagen con alt, aviso de idioma de respaldo y `notFound()`
- [ ] T093 [P] [US6] `mdx-components.tsx` + `components/blog/mdx/*`: encabezados con ancla, código con `sugar-high` y botón copiar, imágenes con `next/image` y el catálogo de componentes interactivos (`GlassDemo`)
- [ ] T094 [US6] Comentarios en `components/blog/comments/*`: lista server-side con `getApprovedComments` (nombre, fecha, respuesta del autor con distintivo, nunca correo), formulario en `Dialog` con autorización y mensaje "en revisión", y estado vacío
- [ ] T095 [US6] E2E en `tests/e2e/l4/`: posts sin JS, código copiable, formulario contra la acción (fake), aviso de idioma y axe

---

## Phase 8: Lane L5 — Experiencia (US8, US9)

**Rutas propias**: `components/experience/**` (desde `l0-frozen`), `lib/search/**`, `lib/assistant/**`,
`app/api/search-index/**`, `public/capsule/**`, `content/i18n/*/experience.json`, `tests/unit/l5/**`,
`tests/e2e/l5/**`

- [ ] T100 [US9] Capturar el sitio 2023 en línea, antes del corte (FR-117): 8 rutas públicas + `/portfolio/1` + `/blog/post1`, en 1440×900 y 390×844, como WebP en `public/capsule/`
- [ ] T101 [US8] `lib/search/build-index.ts` (páginas, proyectos, posts, hechos de sobre mí y servicios, por idioma) y `app/api/search-index/[lang]/route.ts` con `force-static`
- [ ] T102 [US8] `lib/assistant/`: normalización, sinónimos ES↔EN, intenciones, plantillas de respuesta con enlaces, "no sé" y "fuera de alcance"; benchmark en `tests/unit/l5/assistant-benchmark.test.ts` con 40 preguntas de referencia (≥ 90 %) y 15 de manipulación (100 %)
- [ ] T103 [US9] `ExperienceRoot`: escucha `cw:open-palette` y `cw:open-assistant`, y muestra el botón flotante glass del asistente
- [ ] T104 [US9] `CommandPalette`: `Dialog`, `minisearch` sobre el índice cargado bajo demanda, acciones (idioma, tema vía `cw:theme-change`, asistente, copiar correo), navegación con teclado, anuncios accesibles y comando secreto → cápsula
- [ ] T105 [P] [US8] UI del asistente en `components/experience/Assistant*`: preguntas, respuestas con enlaces y estado "no disponible"; las conversaciones no se guardan en ningún lado (FR-097)
- [ ] T106 [P] [US9] Cápsula en `components/experience/Capsule*`: capturas + línea de tiempo de `content/capsule.ts` y marca `cw-capsule-found`
- [ ] T107 [US9] E2E en `tests/e2e/l5/`: Ctrl/⌘+K → "blog" → Enter, Esc devuelve el foco, comando secreto, tema recordado, asistente con preguntas informales y axe

---

## Phase 9: Integración y corte (orquestador)

- [ ] T110 Integrar las lanes en `001-evolutivo-cherced-world` en el orden L0 → LC → L2 → L1 → L4 → L3 → L5, verificando en cada merge que el diff solo toque rutas de esa lane
- [ ] T111 Correr `npm run verify` y la suite e2e completa, más los escenarios 1 a 11 de quickstart.md, y un build sin `MONGODB_INTEGRAL_DB` para confirmar que el contenido público no depende de la base (FR-113)
- [ ] T112 Cargar los pendientes del autor (P-01 a P-06) en `content/site.ts` y en los assets
- [ ] T113 Hacer push de `001-evolutivo-cherced-world`, revisar con el autor la vista previa de Vercel y hacer la prueba de reconocimiento de SC-002 (5 personas que conocieron la versión 2023)
- [ ] T114 Con confirmación del autor: merge único a `main` (FR-115) y verificación en producción de SC-001, SC-003, SC-007 y SC-017

---

## Dependencies & Execution Order

```text
H ──► L0 ──► ┬─ LC ─┐
             ├─ L1 ─┤
             ├─ L2 ─┤
             ├─ L3 ─┼─► Integración (T110–T114)
             ├─ L4 ─┤
             └─ L5 ─┘
```

- **H** no depende de nada y va primero. Necesita confirmación del autor para el merge a `main`.
- **L0** depende de que H esté en `main` (T007), para no arrastrar el código 2023 expuesto.
- **LC, L1, L2, L3, L4 y L5** dependen solo de `l0-frozen` y corren en paralelo.
- **T100** (capturas 2023) tiene que pasar antes de T114, porque después del corte el sitio 2023 ya no existe.
- Dentro de cada lane, las tareas `[P]` tocan archivos distintos y pueden ir en paralelo.

## Implementation Strategy

1. H (minutos) → L0 (la base; sin ella nadie arranca).
2. Seis agentes en paralelo, uno por lane, cada uno en su worktree.
3. Integración ordenada, verificación completa, vista previa, pendientes del autor y corte.
