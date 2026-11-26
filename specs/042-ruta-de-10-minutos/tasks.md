# Tareas: 042 — Ruta de 10 minutos

**Entrada:** [spec.md](./spec.md) y [plan.md](./plan.md). **Línea:** L1, ola 1, rama `lane/l1-ruta`.

Formato: `- [ ] TNNxx [P] [USn] Descripción — archivos: … — cubre: FR-…`. `[P]` significa que corre en paralelo con
las otras `[P]` de la misma fase (archivos distintos y sin dependencias entre sí).

## Fase 0 — Enmiendas de la base (las hace el integrador)

- [ ] T4201 Namespace `route` en i18n — archivos: `lib/i18n/config.ts`, `lib/i18n/server.ts` — cubre: E-4201 — la hizo
  la base (`89f511e`), no la línea
- [ ] T4202 `export` de `clock` sin cambiar su comportamiento — archivos: `lib/ai/agent/interview.ts` — cubre: E-4204 —
  la hizo la base (`89f511e`), no la línea
- [ ] T4203 Etiqueta `042-base` en la rama base después de T4201 y T4202 — del integrador: la base quedó en la etiqueta
  `041-base-ola1`

## Fase 1 — Preparación

- [ ] T4204 Crear la rama `lane/l1-ruta` y el worktree `.worktrees/l1-ruta` desde `042-base`, con la junction de
  `node_modules` creada antes de arrancar la sesión de la línea — del integrador: quedó como `lane/042-ruta` en
  `.worktrees/L1-ruta`, desde `041-base-ola1`
- [x] T4205 [P] Diccionarios vacíos con las claves de la interfaz — archivos: `content/i18n/es/route.json`,
  `content/i18n/en/route.json` — cubre: FR-4201

## Fase 2 — US5: el contrato de estaciones (va primero porque las demás historias lo usan)

- [x] T4206 [US5] Prueba de contrato que falla: ids únicos, una estación o más por prueba, ruta núcleo de 10 minutos o
  menos, de 2 a 4 pasos, ES y EN, `href` internos que existen (rutas de `app/` y anclas `lab-*` del catálogo) — archivos:
  `tests/unit/route/registry.test.ts` — cubre: FR-4208, FR-4209
- [x] T4207 [US5] Tipo `RouteStation`, `RouteProof` y `routeStationSchema` — archivos: `content/ailab/route/stations.ts`
  — cubre: FR-4208
- [x] T4208 [US5] Las seis estaciones de la línea (cuatro núcleo y `rompelo` y `diseno-de-sistemas`) — archivos:
  `content/ailab/route/core.ts` — cubre: FR-4202, FR-4203
- [x] T4209 [US5] Registro `routeStations` y `coreRoute` hasta que T4206 pase — archivos: `content/ailab/route/index.ts`
  — cubre: FR-4208, FR-4209

## Fase 3 — US1: recorrer las cuatro estaciones

- [x] T4210 [P] [US1] Pruebas del avance: versión, lectura con `sessionStorage` bloqueado, marcas, notas de 500
  caracteres como máximo y reinicio — archivos: `tests/unit/route/progress.test.ts` — cubre: FR-4204, FR-4205
- [x] T4211 [US1] Avance en `sessionStorage` hasta que T4210 pase — archivos: `lib/ailab/route/progress.ts` — cubre:
  FR-4204, FR-4205
- [x] T4212 [P] [US1] `StationCard`, renderizada en el servidor: objetivo, minutos, pasos, botón y evidencia —
  archivos: `components/ailab/route/StationCard.tsx`, `components/ailab/route/StationCard.module.scss` — cubre:
  FR-4201, FR-4203
- [x] T4213 [P] [US1] `RouteClock`: 10:00 hacia abajo, negativo con aviso, anuncio solo al cambiar de estación y sin
  animación con movimiento reducido — archivos: `components/ailab/route/RouteClock.tsx` — cubre: FR-4213
- [x] T4214 [US1] `RouteView`, la isla cliente con las marcas y las notas — archivos:
  `components/ailab/route/RouteView.tsx`, `components/ailab/route/RouteView.module.scss` — cubre: FR-4202, FR-4204
- [x] T4215 [US1] Página y metadatos en los dos idiomas, más el aviso sin JavaScript — archivos:
  `app/[lang]/ai-lab/ruta/page.tsx`, `app/[lang]/ai-lab/ruta/opengraph-image.tsx` — cubre: FR-4201
- [x] T4216 [US1] Estación sin modelo disponible: aviso y traza grabada con `TracePanel`, marcada como grabada (P-4206:
  la del simulador mientras no haya permiso para grabar una real) — archivos:
  `content/ailab/route/recorded-trace.json`, `components/ailab/route/RecordedTrace.tsx` — cubre: FR-4212

## Fase 4 — US2: el acta

- [x] T4217 [P] [US2] Pruebas del acta: cuatro pruebas siempre presentes, «sin probar» por defecto, notas tal cual,
  URLs absolutas, zona `America/Bogota` y duración con `clock` — archivos: `tests/unit/route/acta.test.ts` — cubre:
  FR-4206
- [x] T4218 [US2] `routeActa` hasta que T4217 pase — archivos: `lib/ailab/route/acta.ts` — cubre: FR-4206
- [x] T4219 [US2] Botón «Descargar el acta» con `Blob` — archivos: `components/ailab/route/RouteActaButton.tsx` —
  cubre: FR-4206

## Fase 5 — US3: Rómpelo

- [x] T4220 [P] [US3] Pruebas del muestreo: tres casos `refusal` distintos del idioma pedido, y el resumen de la última
  corrida o «todavía no hay una corrida publicada» con `runs: []` — archivos: `tests/unit/route/break-it.test.ts` —
  cubre: FR-4207
- [x] T4221 [US3] Muestreo y resumen hasta que T4220 pase — archivos: `lib/ailab/route/break-it.ts` — cubre: FR-4207
- [x] T4222 [US3] `BreakIt` con «Copiar» y «Otros ataques», enlazado al tablero de la 032 — archivos:
  `components/ailab/route/BreakIt.tsx`, `components/ailab/route/BreakIt.module.scss` — cubre: FR-4207

## Fase 6 — US4: las entradas (enmiendas de la base, las hace el integrador al integrar)

- [x] T4223 [US4] `RouteReturnPill`: solo con ruta activa, se cierra, teclado, sin tapar contenido en 390×844 —
  archivos: `components/ailab/route/RouteReturnPill.tsx`, `components/ailab/route/RouteReturnPill.module.scss` —
  cubre: FR-4211 — construida y probada aislada; montarla es la T4226
- [ ] T4224 [US4] Integrador: enlace de texto en la ventana «Para reclutadores» — archivos:
  `components/site/home/RecruitersBlock.tsx` — cubre: E-4202, FR-4210 — del integrador, con el código listo en el
  reporte de la línea
- [ ] T4225 [US4] Integrador: acceso al inicio del AI Lab — archivos: `components/ailab/shell/LabPage.tsx` — cubre:
  E-4203, FR-4210 — del integrador, con el código listo en el reporte de la línea
- [ ] T4226 [US4] Integrador: montar la pastilla, si el autor aprobó P-4204 — archivos: `app/[lang]/layout.tsx` —
  cubre: E-4206, FR-4211 — del integrador (P-4204 quedó en «sí» por defecto), con el código listo en el reporte
- [ ] T4227 [US4] Integrador: URL de la ruta en el sitemap — archivos: `app/sitemap.ts` — cubre: E-4205 — del
  integrador, con el código listo en el reporte de la línea

## Fase 7 — Pulido

- [x] T4228 [P] Textos finales en ES y EN según `content/style-rules.ts` — archivos: `content/i18n/{es,en}/route.json`,
  `content/ailab/route/core.ts` — cubre: FR-4201
- [x] T4229 e2e de punta a punta: empezar, abrir una estación, volver, marcar las cuatro, descargar el acta, axe sin
  violaciones críticas, y cero llamadas a `/api/ailab/*` y `/api/agent/*` sin abrir estaciones — archivos:
  `tests/e2e/route/route.spec.ts` — cubre: FR-4213, FR-4214, SC-4205
- [ ] T4230 Capturas de 390×844 y WebKit de la ruta, de la ventana «Para reclutadores» y del inicio del AI Lab, contra
  la última vista aprobada; se describe cada cambio visual — cubre: SC-4204 — la línea hizo las de la ruta (Chromium
  en 390×844 y escritorio, y WebKit en 390×844); las de la ventana y del AI Lab son del integrador al aplicar E-4202 y
  E-4203
- [ ] T4231 Cronometrar la ruta con el autor (las dos personas más las consigue él) — cubre: SC-4201, SC-4202 — espera
  al autor
- [x] T4232 Sección «Cómo quedó» en la spec — archivos: `specs/042-ruta-de-10-minutos/spec.md`

## Dependencias y orden

- Fase 0 antes de todo. Fase 2 (el contrato) antes de las fases 3 a 5.
- Las fases 3, 4 y 5 pueden ir en paralelo dentro de la línea una vez esté la fase 2; las tareas `[P]` de cada fase
  también.
- La fase 6 la hace el integrador al integrar la línea, después de T4223.
- Integración: la línea se integra con la etiqueta `042-estaciones`. Desde ahí, las líneas 044 y 045 entregan sus
  estaciones y el integrador las suma a `content/ailab/route/index.ts`.

## Validación final

- [x] T4233 `npx vitest run tests/unit/route`, `npm run lint`, `npm run typecheck` y
  `npx playwright test tests/e2e/route/route.spec.ts` en verde; sin la suite exhaustiva y sin gastar API
- [ ] T4234 Búsqueda de nombres internos en el diff antes del push (SC-4104 de la 041) — limpia en el diff de la línea
  contra `041-base-ola1`; el integrador la repite sobre el diff integrado antes del push
