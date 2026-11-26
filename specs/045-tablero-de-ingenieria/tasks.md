# Tareas: 045 — Tablero de ingeniería vivo

**Entrada:** [spec.md](./spec.md) y [plan.md](./plan.md). **Línea:** L3, ola 1, rama `lane/l3-tablero`.

Formato: `- [ ] TNNxx [P] [USn] Descripción — archivos: … — cubre: FR-…`. `[P]` significa que corre en paralelo con
las otras `[P]` de la misma fase.

## Fase 0 — Enmiendas de la base (las hace el integrador)

- [x] T4501 Namespace `engineering` en i18n — archivos: `lib/i18n/config.ts`, `lib/i18n/server.ts` — cubre: E-4501
  (la hizo la base de la ola 1)
- [x] T4502 Reporte JSON de Vitest en el `prebuild` (verificar la opción con Vitest 5.0.5) y el script
  `metrics:history` — archivos: `package.json` — cubre: E-4502, FR-4503 (la hizo la base de la ola 1)
- [x] T4503 `.engineering/` en `.gitignore` — archivos: `.gitignore` — cubre: E-4503 (la hizo la base de la ola 1)
- [x] T4504 Etiqueta `045-base` en la rama base después de T4501 a T4503 (el integrador usó una sola etiqueta
  para la ola, `041-base-ola1`)

## Fase 1 — Preparación

- [x] T4505 Rama `lane/l3-tablero` y worktree `.worktrees/l3-tablero` desde `045-base`, con la junction de
  `node_modules` creada antes de arrancar la sesión de la línea (la hizo el integrador: rama `lane/045-ingenieria`
  en `.worktrees/L3-ingenieria`, desde `041-base-ola1`)
- [x] T4506 [P] Diccionarios — archivos: `content/i18n/es/engineering.json`, `content/i18n/en/engineering.json` —
  cubre: FR-4501
- [x] T4507 [P] Lista de archivos versionados que el tablero puede leer, sin nada ignorado por Git — archivos:
  `lib/engineering/tracked.ts`, `tests/unit/engineering/tracked.test.ts` — cubre: FR-4507

## Fase 2 — US1: de la spec al commit

- [x] T4508 [P] [US1] Pruebas de contrato de `history.json`: esquema, sin correos, sin nombres fuera del autor y sin
  URLs de vista previa — archivos: `tests/unit/engineering/history.test.ts` — cubre: FR-4506, SC-4504
- [x] T4509 [US1] Esquema y lectura del historial — archivos: `lib/engineering/history.ts` — cubre: FR-4506
- [x] T4510 [US1] Recolector local: `git log` (sha corto, fecha y asunto), fecha de creación de cada spec con
  `--diff-filter=A` y despliegues con `gh api` si está; solo archivos versionados — archivos:
  `scripts/engineering-metrics.mjs` — cubre: FR-4506, FR-4507
- [x] T4511 [US1] Primera toma del historial — archivos: `content/engineering/history.json` — cubre: FR-4506
- [x] T4512 [P] [US1] Pruebas de la clasificación de estados (construida, en construcción, aprobada, borrador,
  propuesta, sin estado y otro), con las líneas «Estado:» reales de 017, 030 y 040 como casos, más las carpetas 014
  (solo `propuesta.md`) y 015 (solo `notas.md`) — archivos:
  `tests/unit/engineering/specs.test.ts` — cubre: FR-4504
- [x] T4513 [US1] Leer `specs/`, clasificar y sacar los `FR-` de los `.md` versionados de cada carpeta — archivos:
  `lib/engineering/specs.ts` — cubre: FR-4504
- [x] T4514 [P] [US1] Pruebas de asuntos con varias specs (`fix(018, 022): …`), días de spec a construida y commits por
  semana — archivos: `tests/unit/engineering/commits.test.ts` — cubre: FR-4504, FR-4511
- [x] T4515 [US1] Asuntos a specs, días y semanas — archivos: `lib/engineering/commits.ts` — cubre: FR-4504, FR-4511
- [x] T4516 [US1] `SpecsTable` en grupos plegables de 10, sin hidratar la tabla, y `SpecDetail` con commits y enlaces
  — archivos: `components/engineering/SpecsTable.tsx`, `components/engineering/SpecDetail.tsx`,
  `components/engineering/Engineering.module.scss` — cubre: FR-4501, FR-4504 (el detalle de cada spec quedó en su
  propia página estática, `app/[lang]/ingenieria/[spec]/page.tsx`; ver «Cómo quedó»)
- [x] T4517 [US1] `WeeklyBars` en SVG con su tabla equivalente — archivos: `components/engineering/WeeklyBars.tsx` —
  cubre: FR-4511
- [x] T4518 [US1] Página y metadatos en los dos idiomas — archivos: `app/[lang]/ingenieria/page.tsx`,
  `app/[lang]/ingenieria/opengraph-image.tsx` — cubre: FR-4501, FR-4502

## Fase 3 — US2: pruebas y este despliegue

- [x] T4519 [P] [US2] Pruebas del reporte de Vitest: totales válidos, reporte ausente y reporte con otra forma —
  archivos: `tests/unit/engineering/vitest-report.test.ts` — cubre: FR-4503
- [x] T4520 [US2] Leer el reporte — archivos: `lib/engineering/vitest-report.ts` — cubre: FR-4503
- [x] T4521 [P] [US2] Pruebas del conteo por tipo y de la búsqueda literal de `FR-` y `SC-` en `tests/` — archivos:
  `tests/unit/engineering/tests.test.ts` — cubre: FR-4505
- [x] T4522 [US2] Conteo y búsqueda — archivos: `lib/engineering/tests.ts` — cubre: FR-4505
- [x] T4523 [US2] `DeployStrip` con `VERCEL_GIT_COMMIT_SHA`, `VERCEL_ENV`, fecha del build y pruebas del build — archivos:
  `components/engineering/DeployStrip.tsx` — cubre: FR-4503
- [x] T4524 [US2] `TestsPanel` y los requisitos con prueba en `SpecDetail` — archivos:
  `components/engineering/TestsPanel.tsx`, `components/engineering/SpecDetail.tsx` — cubre: FR-4505

## Fase 4 — US3: evals y gasto de IA

- [x] T4525 [P] [US3] Prueba de contrato del registro de evals contra `EvalResults` — archivos:
  `tests/unit/engineering/evals.test.ts` — cubre: FR-4508
- [x] T4526 [US3] Registro con la batería de la 032 — archivos: `content/engineering/evals.ts` — cubre: FR-4508
- [x] T4527 [US3] `EvalsPanel`: última corrida o «todavía no hay una corrida publicada» con cómo se corre — archivos:
  `components/engineering/EvalsPanel.tsx` — cubre: FR-4508
- [x] T4528 [P] [US3] Pruebas del gasto: sin la 043 usa `spendToday`, con la 043 usa el mes; base caída con «no
  disponible ahora»; sin datos de visitantes — archivos: `tests/unit/engineering/spend.test.ts` — cubre: FR-4509
- [x] T4529 [US3] Gasto y llamadas al MCP (`mcpDaily`), cacheados una hora — archivos: `lib/engineering/spend.ts`,
  `app/api/engineering/spend/route.ts` — cubre: FR-4509
- [x] T4530 [US3] `SpendPanel` como isla cliente, frente a la meta de 10 USD y el techo de 25 USD, en USD y COP —
  archivos: `components/engineering/SpendPanel.tsx` — cubre: FR-4509

## Fase 5 — US4: calidad que se vigila

- [x] T4531 [US4] Presupuestos del principio V con la prueba que vigila cada uno y la medición solo si está en el
  historial — archivos: `lib/engineering/budgets.ts`, `components/engineering/BudgetsPanel.tsx`,
  `tests/unit/engineering/budgets.test.ts` — cubre: FR-4510

## Fase 6 — US5 y pulido

- [x] T4532 Prueba con todas las fuentes vacías: ningún valor de rendimiento, de evals ni de gasto que no exista —
  archivos: `tests/unit/engineering/empty-sources.test.ts` — cubre: SC-4503
- [x] T4533 [P] Estación `tablero-en-numeros` con el contrato `RouteStation` de la 042 — archivos:
  `content/engineering/station.ts` — cubre: FR-4512
- [x] T4534 e2e: tabla de specs, detalle de la 030, franja del despliegue, sección de evals vacía, teclado y axe —
  archivos: `tests/e2e/engineering/engineering.spec.ts` — cubre: FR-4501, SC-4505 (corrió contra `next dev --webpack`:
  la prueba de rendimiento se salta ahí y queda para un build de producción)
- [ ] T4535 Integrador: sitemap y estación en la ruta (con P-4502) — archivos: `app/sitemap.ts`,
  `content/ailab/route/index.ts` — cubre: E-4504, E-4505 (del integrador; el cambio exacto está en «Cómo quedó»)
- [ ] T4536 Conteo a mano el día de la revisión: specs, archivos de prueba por tipo y commits de tres specs al azar —
  cubre: SC-4502 (queda para el día de la revisión; `tests/unit/engineering/tests.test.ts` ya compara el conteo por
  tipo con un recorrido aparte del árbol)
- [ ] T4537 Capturas de 390×844 y WebKit de la página — cubre: FR-4108 de la 041 (hechas en Chromium a 390×844 y en
  escritorio; falta WebKit, que no está entre los proyectos de Playwright del repo)
- [x] T4538 Sección «Cómo quedó» en la spec — archivos: `specs/045-tablero-de-ingenieria/spec.md`

## Dependencias y orden

- Fase 0 antes de todo. Las fases 2 a 5 son independientes entre sí una vez está T4507.
- T4511 necesita T4510. La página (T4518) necesita T4509, T4513 y T4515.
- T4529 lee `mcpDaily` de la 044. Si la L2 no se integró, esa línea de la sección dice «sin datos».
- La función de gasto mensual de la 043 llega en la ola 2: hasta entonces T4529 usa `spendToday`, y el integrador la
  cambia al integrar la L4, como enmienda a `lib/engineering/spend.ts`.
- T4533 necesita el contrato `042-estaciones`. Si la L1 no se integró, se escribe contra el tipo de la spec.
- Al integrarse, la línea deja la etiqueta `045-tablero`. Desde ahí, cada línea con modelo suma sus evals con E-4506.

## Validación final

- [x] T4539 `npx vitest run tests/unit/engineering`, `npm run lint`, `npm run typecheck` y
  `npx playwright test tests/e2e/engineering/engineering.spec.ts` en verde; sin la suite exhaustiva y sin gastar API
  (el e2e corrió contra `next dev --webpack`, porque el build de producción no compila en el worktree; ver «Cómo quedó»)
- [ ] T4540 Correr `npm run metrics:history` y versionar `content/engineering/history.json` en el mismo commit del push
  de la ola, no en uno aparte (del integrador; la línea dejó una primera toma con `--sin-gh`)
- [ ] T4541 Búsqueda de nombres internos en el diff antes del push (SC-4104 de la 041) (del integrador: la lista
  privada no está en el worktree de la línea)
