# Tareas: 046 — Del pedido a la spec, con gates y humano en el bucle

**Entrada**: [spec.md](./spec.md) y [plan.md](./plan.md) | **Línea**: L5 | **Ola**: 2

Formato: `- [ ] ID [P] [Historia] Descripción — archivos: … — cubre: …`.
- **[P]:** se puede hacer en paralelo con otras tareas de la misma fase.
- **US1 a US6:** las historias de la spec.

**Requisito de arranque:** que existan las etiquetas `043-puerto-congelado` y `047-base-congelada`.

Ninguna tarea llama a una API real.

## Fase 0: Enmiendas de la base (las hace el integrador)

- [ ] T4601 Script `evals:gates` — archivos: `package.json` — cubre: historia 6 (E-4601)
- [ ] T4602 [P] Límites `gates` y `gatesDaily` — archivos: `lib/security/rate-limit.ts` — cubre: FR-4614 (E-4602)
- [ ] T4603 [P] `TYPICAL_USE.gates` y la línea `gates` del panel de gasto — archivos: `lib/ai/models.ts`, `lib/ai/spend.ts` — cubre: FR-4613 (E-4603)
- [ ] T4604 [P] Id y tarjeta A12, registro de la demo — archivos: `content/types.ts`, `content/ailab/catalog.ts`, `content/i18n/{es,en}/ailab.json`, `components/ailab/shell/demo-loader.tsx` — cubre: FR-4601 (E-4604 a E-4606)
- [ ] T4605 Etiqueta `046-base-congelada`

## Fase 1: Preparación

- [ ] T4606 Esquemas `specBreve`, `reviewFinding`, tipos de corrida y de paso — archivos: `lib/ai/gates/schema.ts` — cubre: FR-4602, FR-4606
- [ ] T4607 [P] Rúbrica de cinco criterios con definiciones y ejemplos ES y EN — archivos: `content/ailab/gates/rubric.ts` — cubre: FR-4605
- [ ] T4608 [P] Tres pedidos de ejemplo (P-4601), ficticios — archivos: `content/ailab/gates/examples.ts` — cubre: FR-4601
- [ ] T4609 [P] Prueba de contrato de `specBreve`, `reviewFinding` y `revision.json` — archivos: `tests/unit/gates/schema.test.ts` — cubre: FR-4602, FR-4606, FR-4616

## Fase 2: Historia 3 — Nadie revisa lo suyo (P1)

Pruebas primero:

- [ ] T4610 [P] [US3] Prueba de `pickReviewers` con todas las combinaciones de proveedores activos — archivos: `tests/unit/gates/reviewers.test.ts` — cubre: FR-4604, SC-4602
- [ ] T4611 [P] [US3] Prueba de `needsVerification` y del proveedor del verificador — archivos: `tests/unit/gates/verify.test.ts` — cubre: FR-4608, SC-4602
- [ ] T4612 [P] [US3] Prueba de la unión de hallazgos: agrupación, «visto por los dos» y lugares inexistentes descartados — archivos: `tests/unit/gates/merge.test.ts` — cubre: FR-4607

Implementación:

- [ ] T4613 [US3] Elección de revisores y verificador — archivos: `lib/ai/gates/providers.ts` — cubre: FR-4604, FR-4608
- [ ] T4614 [US3] Unión de hallazgos — archivos: `lib/ai/gates/merge.ts` — cubre: FR-4607
- [ ] T4615 [US3] Instrucciones del redactor, de los revisores y del verificador, con los datos delimitados — archivos: `lib/ai/gates/prompts.ts` — cubre: FR-4602, FR-4604, FR-4608, FR-4615

## Fase 3: Historia 1 — Corrida grabada (P1)

- [ ] T4616 [P] [US1] Prueba de `shouldStop` (sus cinco casos más «revisión no disponible» y «no es software») y de `recommend` — archivos: `tests/unit/gates/stop.test.ts` — cubre: FR-4610, FR-4611, SC-4607
- [ ] T4617 [US1] Regla de parada y recomendación — archivos: `lib/ai/gates/stop.ts` — cubre: FR-4610, FR-4611
- [ ] T4618 [US1] Chequeos deterministas con el núcleo de Cotejo (perfil `breve`) más las dos reglas propias y la corrección gratis — archivos: `lib/ai/gates/checks.ts`, `tests/unit/gates/checks.test.ts` — cubre: FR-4603, SC-4606
- [ ] T4619 [US1] Orquestador `runGate` con `onStep` — archivos: `lib/ai/gates/run.ts`, `tests/unit/gates/run.test.ts` — cubre: FR-4602 a FR-4611
- [ ] T4620 [US1] Simulador determinista sin llaves — archivos: `lib/ai/gates/simulator.ts` — cubre: FR-4619
- [ ] T4621 [US1] Tres corridas grabadas con el simulador como base y el formato de `GateRun`. Las reales las graba el autor con su permiso — archivos: `content/ailab/gates/recorded/*.json`, `content/ailab/gates/recorded.ts` — cubre: FR-4614
- [ ] T4622 [US1] Tarjeta: pedido, pasos en lista con `aria-live`, hallazgos con su gravedad en texto, los tachados del verificador, recomendación con su motivo y los tres botones — archivos: `components/ailab/gates/GatesStage.tsx`, `components/ailab/gates/GatesStage.module.scss`, `components/ailab/gates/FindingList.tsx`, `content/i18n/{es,en}/gates.json` — cubre: FR-4611, FR-4612, FR-4618, SC-4601
- [ ] T4623 [US1] Caja de cristal por paso y total — archivos: `components/ailab/gates/GatesTrace.tsx` — cubre: FR-4613

## Fase 4: Historia 2 — En vivo con cuenta (P1)

- [ ] T4624 [P] [US2] Prueba de la ruta: origen, sin cuenta, límites, largo, URL que no se visita, techo mensual y tope de corrida — archivos: `tests/unit/gates/route.test.ts` — cubre: FR-4601, FR-4614, SC-4605
- [ ] T4625 [US2] `POST /api/ailab/gates` con los pasos enviados a medida que terminan — archivos: `app/api/ailab/gates/route.ts` — cubre: FR-4614
- [ ] T4626 [US2] Pedido propio en la tarjeta, con el aviso de proveedores de la 043 y los estados (sin cuenta, límite, techo, apagado) — archivos: `components/ailab/gates/GatesLive.tsx` — cubre: FR-4614, FR-4615

## Fase 5: Historia 4 — Pedir cambios (P2)

- [ ] T4627 [P] [US4] Prueba de la ronda pedida: comentario como datos, una sola vez y sin presupuesto — archivos: `tests/unit/gates/changes.test.ts` — cubre: FR-4612
- [ ] T4628 [US4] `POST /api/ailab/gates/changes`: recibe la corrida del navegador, valida su esquema y hace una ronda más — archivos: `app/api/ailab/gates/changes/route.ts` — cubre: FR-4612

## Fase 6: Historia 5 — Llevarse la evidencia (P2)

- [ ] T4629 [US5] Armado de `spec.md` y `revision.json` con su decisión — archivos: `lib/ai/gates/export.ts`, `components/ailab/gates/GatesDownloads.tsx` — cubre: FR-4616
- [ ] T4630 [US5] Aporte al acta de la 042 con su mecanismo (P-4605). Si no existe, solo la descarga — archivos: `components/ailab/gates/GatesStage.tsx` — cubre: FR-4616

## Fase 7: Historia 6 — Medir la revisión (P3)

- [ ] T4631 [P] [US6] Batería: 10 specs con 30 defectos sembrados, 5 limpias, 10 hallazgos falsos, 6 inyecciones y 2 pedidos que no son de software — archivos: `content/ailab/gates/evals.ts` — cubre: historia 6
- [ ] T4632 [P] [US6] Calificación con reglas y su prueba con respuestas grabadas — archivos: `lib/ai/gates/grade.ts`, `tests/unit/gates/grade.test.ts` — cubre: SC-4603, SC-4604
- [ ] T4633 [US6] Corrida de la batería, que guarda las últimas 10 (no corre en pruebas ni en el build) — archivos: `evals/gates.eval.ts`, `content/ailab/gates/results.json` — cubre: historia 6

## Fase final: Pulido

- [ ] T4634 [P] Estación de la ruta — archivos: `content/ailab/gates/station.ts` — cubre: FR-4101
- [ ] T4635 Revisión de i18n ES/EN y accesibilidad (teclado, movimiento reducido, gravedad en texto) — archivos: `content/i18n/{es,en}/gates.json`, `components/ailab/gates/**` — cubre: FR-4618
- [ ] T4636 Capturas del celular (390×844 y WebKit) del AI Lab contra la última vista aprobada — cubre: FR-4108
- [ ] T4637 El integrador suma `gatesStation` al registro de estaciones — archivos: `content/ailab/route/index.ts` — cubre: FR-4101 (E-4607)
- [ ] T4638 Sección «Cómo quedó» en la spec — archivos: `specs/046-del-pedido-a-la-spec-con-gates/spec.md`

## Dependencias y orden

1. Las etiquetas `043-puerto-congelado` y `047-base-congelada`.
2. La Fase 0.
3. La Fase 1.
4. La Fase 2 y la parte pura de la Fase 3 (T4616, T4617) pueden ir en paralelo: tocan archivos distintos.
5. El orquestador (T4619) necesita las Fases 2 y 3.
6. Después, la tarjeta y las Fases 4 a 7.
7. El pulido al final.

Ninguna tarea toca archivos de otra línea.

## Validación final

- [ ] T4639 `npx vitest run tests/unit/gates`, `npm run lint` y `npm run typecheck` en verde
- [ ] T4640 Revisión a mano en `next dev` con el simulador y las corridas grabadas, sin llaves
- [ ] T4641 Búsqueda en el diff de la lista de nombres prohibidos de la carpeta privada de la 041 (SC-4104)
- [ ] T4642 Pedirle al autor que grabe las tres corridas reales y corra `npm run evals:gates` una vez, con su permiso, y registrar el costo
