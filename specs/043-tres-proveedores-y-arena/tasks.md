# Tareas: 043 — Tres proveedores y arena de modelos

**Entrada**: [spec.md](./spec.md) y [plan.md](./plan.md) | **Línea**: L4 | **Ola**: 2

Formato: `- [ ] ID [P] [Historia] Descripción — archivos: … — cubre: …`.
- **[P]:** se puede hacer en paralelo con otras tareas de la misma fase.
- **US1 a US5:** las historias de la spec.

Ninguna tarea llama a una API real. Las pruebas usan dobles y respuestas grabadas.

## Fase 0: Enmiendas de la base (las hace el integrador)

Se aplican antes de arrancar la L4 y se congelan con la etiqueta `043-base-congelada`.

- [ ] T4301 Dependencias `@anthropic-ai/sdk` y `openai` con versión exacta, el script `arena:run` y `evals:agent` acotado a su archivo — archivos: `package.json`, `package-lock.json` — cubre: FR-4302, FR-4314 (E-4301)
- [ ] T4302 La configuración de evals carga `GEMINI_`, `ANTHROPIC_` y `OPENAI_` sin imprimirlas — archivos: `vitest.evals.config.ts` — cubre: FR-4314 (E-4302)
- [ ] T4303 Precios de Claude y OpenAI con su fecha y `PRICE_SOURCES` por proveedor; los de Gemini no cambian — archivos: `lib/ai/pricing.ts` — cubre: FR-4305 (E-4303)
- [ ] T4304 [P] `TYPICAL_USE.arena` y la línea `arena` del panel de gasto — archivos: `lib/ai/models.ts`, `lib/ai/spend.ts` — cubre: FR-4309 (E-4304, E-4305)
- [ ] T4305 [P] Límites `arena` y `arenaDaily` — archivos: `lib/security/rate-limit.ts` — cubre: FR-4313 (E-4306)
- [ ] T4306 `BudgetRepo` en memoria y en Mongo, colección `ai_budget` con índice TTL — archivos: `lib/data/types.ts`, `lib/data/memory/budget.ts`, `lib/data/memory/index.ts`, `lib/data/mongo/budget.ts`, `lib/data/mongo/collections.ts`, `lib/data/mongo/indexes.ts`, `lib/data/mongo/index.ts` — cubre: FR-4308 (E-4307)
- [ ] T4307 [P] Ids y tarjeta A10, `runsIn: 'providers'`, demo e insignia — archivos: `content/types.ts`, `content/ailab/catalog.ts`, `content/i18n/{es,en}/ailab.json`, `components/ailab/shell/demo-loader.tsx`, `components/ailab/shell/RunsInBadge.tsx` — cubre: FR-4311 (E-4308 a E-4310)
- [ ] T4308 Extraer `gradeExpect` sin cambiar `gradeAnswer`; correr `tests/unit/evals` — archivos: `lib/ai/evals/grade.ts` — cubre: FR-4312 (E-4311)
- [ ] T4309 [P] Llaves en la tabla de variables y textos de privacidad — archivos: `README.md`, `content/i18n/{es,en}/privacy.json` — cubre: FR-4310, FR-4315 (E-4313, E-4314)
- [ ] T4310 Etiqueta `043-base-congelada` sobre el commit de la base

## Fase 1: Preparación

- [ ] T4311 Tipos del contrato (`ProviderId`, `ModelTask`, `BudgetLine`, entrada, intento, resultado y errores) — archivos: `lib/ai/providers/types.ts` — cubre: FR-4301
- [ ] T4312 [P] Tabla de modelos por tarea con el valor por defecto de P-4301 — archivos: `lib/ai/providers/models.ts` — cubre: FR-4303
- [ ] T4313 [P] Meta de 10 USD y techo de 25 USD, mes en UTC — archivos: `lib/ai/budget/config.ts` — cubre: FR-4308

## Fase 2: Historia 2 — Un solo puerto (P1)

Pruebas primero:

- [ ] T4314 [P] [US2] Prueba del enrutador: el más barato con precio, `prefer`, `exclude` y modelo sin precio que nunca se llama — archivos: `tests/unit/providers/router.test.ts` — cubre: FR-4305, SC-4305
- [ ] T4315 [P] [US2] Prueba del fallback: sin llave se salta, 429/5xx/tiempo/rechazo/inválido pasan al siguiente, un 400 no hace fallback, `attempts` completos — archivos: `tests/unit/providers/fallback.test.ts` — cubre: FR-4306, SC-4302
- [ ] T4316 [P] [US2] Prueba de la salida estructurada: Zod a JSON Schema, un reintento, error claro — archivos: `tests/unit/providers/schema.test.ts` — cubre: FR-4304
- [ ] T4317 [P] [US2] Prueba de redacción de llaves con llaves falsas de los tres formatos — archivos: `tests/unit/providers/redact.test.ts` — cubre: FR-4310

Implementación:

- [ ] T4318 [US2] Enrutador por costo con la tabla de precios — archivos: `lib/ai/providers/router.ts` — cubre: FR-4305
- [ ] T4319 [US2] Adaptador de Gemini sobre `generateJson`, sin modificar `lib/ai/generate.ts` — archivos: `lib/ai/providers/gemini.ts` — cubre: FR-4302, SC-4306
- [ ] T4320 [US2] Adaptador de Claude con el SDK oficial: `stop_reason`, fallback del servidor en Opus 5.5 y Sonnet 5.5, esfuerzo por tarea, sin `temperature`, modelo real — archivos: `lib/ai/providers/claude.ts`, `tests/unit/providers/claude.test.ts` — cubre: FR-4302, FR-4307
- [ ] T4321 [US2] Adaptador de OpenAI con su SDK oficial, después de leer su documentación; modelos por elegir según P-4301 — archivos: `lib/ai/providers/openai.ts`, `tests/unit/providers/openai.test.ts` — cubre: FR-4302
- [ ] T4322 [US2] Simulador y `providersMode()` — archivos: `lib/ai/providers/simulator.ts`, `lib/ai/providers/mode.ts` — cubre: FR-4302, SC-4301
- [ ] T4323 [US2] `generateJson` que une enrutador, adaptadores, validación, reserva y ajuste — archivos: `lib/ai/providers/port.ts`, `lib/ai/providers/redact.ts` — cubre: FR-4301, FR-4304, FR-4306
- [ ] T4323b [P] [US2] Prueba de `callTools` con respuestas grabadas de los tres proveedores: llamadas normalizadas iguales, argumentos inválidos que no llegan, `native` reenviado solo al mismo proveedor, resultados en paralelo en un solo mensaje — archivos: `tests/unit/providers/tools.test.ts` — cubre: FR-4319, SC-4309
- [ ] T4323c [US2] `callTools` en los tres adaptadores (Gemini con `functionDeclarations`, Claude con `strict` y `tool_choice` automático, OpenAI según la documentación de su SDK) — archivos: `lib/ai/providers/tools.ts`, `lib/ai/providers/gemini-tools.ts`, `lib/ai/providers/claude.ts`, `lib/ai/providers/openai.ts` — cubre: FR-4319

## Fase 3: Historia 3 — Techo mensual (P1)

- [ ] T4324 [P] [US3] Prueba del libro: techo, 50 reservas concurrentes sin sobregiro, cambio de mes, aviso una vez por mes, falla cerrada sin Mongo — archivos: `tests/unit/providers/budget.test.ts` — cubre: FR-4308, SC-4303
- [ ] T4325 [US3] Reserva, ajuste, `assertMonthlyBudget`, `BudgetExhaustedError` y marcas de aviso — archivos: `lib/ai/budget/ledger.ts` — cubre: FR-4308, FR-4309
- [ ] T4326 [US3] Resumen del mes para el panel y mensaje al buzón en cada cruce (P-4304) — archivos: `lib/ai/budget/summary.ts`, `lib/ai/budget/notify.ts` — cubre: FR-4309
- [ ] T4326b [P] [US3] `monthlySpend(now)` para la 045, con su prueba de contrato (sin desglose por línea ni datos por visitante) — archivos: `lib/ai/budget/spend.ts`, `tests/unit/providers/monthly-spend.test.ts` — cubre: FR-4309
- [ ] T4327 [US3] Tarjeta del tope mensual (gastado, por proveedor y por línea, porcentajes, «precios por revisar») — archivos: `components/ailab/arena/BudgetCard.tsx`, `components/ailab/arena/BudgetCard.module.scss` — cubre: FR-4309
- [ ] T4328 [US3] El integrador monta la tarjeta en el panel de gasto — archivos: `app/[lang]/inbox/(panel)/spend/page.tsx` — cubre: FR-4309 (E-4312)

## Fase 4: Historia 1 — Arena pregenerada (P1)

- [ ] T4329 [P] [US1] Seis tareas en ES y EN con su esquema y sus reglas, y rúbrica del juez — archivos: `content/ailab/arena/tasks.ts`, `content/ailab/arena/judge.ts` — cubre: FR-4311, FR-4312
- [ ] T4330 [P] [US1] Esquema de la corrida y prueba de contrato de `results.json` — archivos: `content/ailab/arena/results.ts`, `content/ailab/arena/results.json`, `tests/unit/arena/results.test.ts` — cubre: FR-4314
- [ ] T4331 [P] [US1] Prueba de la calificación: reglas con `gradeExpect` y juez que nunca es del proveedor evaluado — archivos: `tests/unit/arena/grade.test.ts` — cubre: FR-4312, SC-4304
- [ ] T4332 [US1] Calificación de una columna (reglas y juez) — archivos: `lib/ai/providers/arena.ts` — cubre: FR-4312
- [ ] T4333 [US1] Tarjeta: selector de tarea, tres columnas, tabla de métricas, aviso «no es un benchmark», fecha de la corrida — archivos: `components/ailab/arena/ArenaStage.tsx`, `components/ailab/arena/ArenaStage.module.scss`, `content/i18n/{es,en}/arena.json` — cubre: FR-4311, FR-4317, SC-4307
- [ ] T4334 [US1] Caja de cristal por columna y exportar JSON — archivos: `components/ailab/arena/ArenaTrace.tsx` — cubre: FR-4316

## Fase 5: Historia 4 — En vivo con cuenta (P2)

- [ ] T4335 [P] [US4] Prueba de la ruta: origen, sin cuenta, límite por cuenta y diario, estimado de más de 0,05 USD, techo, entrada de más de 1.000 caracteres — archivos: `tests/unit/arena/route.test.ts` — cubre: FR-4313
- [ ] T4336 [US4] `POST /api/ailab/arena`, con las tres llamadas en paralelo y los jueces después — archivos: `app/api/ailab/arena/route.ts` — cubre: FR-4313
- [ ] T4337 [US4] Aviso de consentimiento de proveedores (en `components/ai/providers/` si se aprueba la ampliación) — archivos: `components/ai/providers/ProvidersConsent.tsx` o `components/ailab/arena/ProvidersConsent.tsx` — cubre: FR-4315
- [ ] T4338 [US4] Botón «Correr en vivo», tarea libre y estados (sin cuenta, límite, techo, apagado) — archivos: `components/ailab/arena/ArenaLive.tsx` — cubre: FR-4313

## Fase 6: Historia 5 — Corrida pregenerada (P3)

- [ ] T4339 [US5] Corrida completa a mano que suma un registro y guarda las últimas 10 (no corre en pruebas ni en el build) — archivos: `evals/arena.eval.ts`, `lib/ai/providers/arena-run.ts` — cubre: FR-4314
- [ ] T4340 [US5] Prueba de la corrida con dobles: registro válido, costo total en USD y COP — archivos: `tests/unit/arena/run.test.ts` — cubre: FR-4314, SC-4308

## Fase final: Pulido

- [ ] T4341 [P] Estación de la ruta — archivos: `content/ailab/arena/station.ts` — cubre: FR-4101
- [ ] T4342 [P] Guías para el autor: crear la llave y poner un límite en cada consola, sin pedir ni leer valores — archivos: `specs/043-tres-proveedores-y-arena/configurar-claude.md`, `specs/043-tres-proveedores-y-arena/configurar-openai.md` — cubre: FR-4310
- [ ] T4343 Revisión de i18n ES/EN y accesibilidad (teclado, encabezados, aviso que no depende del color) — archivos: `content/i18n/{es,en}/arena.json`, `components/ailab/arena/**` — cubre: FR-4317
- [ ] T4344 Capturas del celular (390×844 y WebKit) de la tarjeta y del AI Lab contra la última vista aprobada — cubre: FR-4108
- [ ] T4345 El integrador suma `arenaStation` al registro de estaciones — archivos: `content/ailab/route/index.ts` — cubre: FR-4101 (E-4315)
- [ ] T4346 Sección «Cómo quedó» en la spec — archivos: `specs/043-tres-proveedores-y-arena/spec.md`

## Dependencias y orden

1. La Fase 0 entera, con su etiqueta.
2. La Fase 1.
3. La Fase 2 (el puerto, con `callTools`), que es lo que necesitan la 046, la 048, la 049 y la 050. Al terminarla, la
   L4 avisa «puerto listo» y el integrador congela su contrato con la etiqueta `043-puerto-congelado`.
4. La Fase 3 antes de cualquier ruta que gaste (Fase 5).
5. La Fase 4 puede ir en paralelo con la Fase 3.
6. Después, las Fases 5 y 6.
7. El pulido al final.

Ninguna tarea toca archivos de otra línea.

## Validación final

- [ ] T4347 `npx vitest run tests/unit/providers tests/unit/arena tests/unit/evals`, `npm run lint` y `npm run typecheck` en verde
- [ ] T4348 Revisión a mano en `next dev` sin llaves (simulador y pregenerado) y con la red de los proveedores bloqueada
- [ ] T4349 Búsqueda en el diff de la lista de nombres prohibidos de la carpeta privada de la 041, antes de entregar (SC-4104)
- [ ] T4350 Pedirle al autor que corra `npm run arena:run` una vez con sus llaves y registrar el costo real (SC-4308)
