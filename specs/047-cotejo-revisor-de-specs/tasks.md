# Tareas: 047 — Cotejo, revisor de specs

**Entrada**: [spec.md](./spec.md) y [plan.md](./plan.md) | **Línea**: L6 | **Ola**: 2

Formato: `- [ ] ID [P] [Historia] Descripción — archivos: … — cubre: …`.
- **[P]:** se puede hacer en paralelo con otras tareas de la misma fase.
- **US1 a US6:** las historias de la spec.
- Las rutas que empiezan con `cotejo/` son del repo nuevo `CHERCED-DEV/cotejo`; las demás, del sitio.

Ninguna tarea llama a modelos remotos.

## Fase 0: Repo nuevo y enmiendas de la base

- [ ] T4701 Pedirle al autor el visto bueno explícito para crear el repo público `CHERCED-DEV/cotejo` (P-4714). Sin ese sí no se crea nada
- [ ] T4702 Crear el repo con licencia MIT, README bilingüe con la atribución de la investigación de la 014 y el commit firmado con el correo personal del autor — archivos: `cotejo/LICENSE`, `cotejo/README.md`, `cotejo/README.en.md` — cubre: FR-4701
- [ ] T4703 El integrador aplica E-4701 a E-4705 después del primer release del núcleo y etiqueta `047-base-congelada` — archivos: `package.json`, `package-lock.json`, `content/types.ts`, `content/ailab/catalog.ts`, `content/i18n/{es,en}/ailab.json`, `components/ailab/shell/demo-loader.tsx`, `.github/workflows/cotejo.yml` — cubre: FR-4713, FR-4718

## Fase 1: Preparación del repo de Cotejo

- [ ] T4704 Monorepo con npm workspaces, TypeScript estricto, Vitest y lint — archivos: `cotejo/package.json`, `cotejo/tsconfig.json`, `cotejo/packages/*/package.json`
- [ ] T4705 [P] Mudar el generador de corpus y la medición de la 014, con semilla fija y tres semillas — archivos: `cotejo/corpus/generar_corpus.py`, `cotejo/bench/medir.ts` — cubre: FR-4714
- [ ] T4706 [P] Workflow de release: suite, medición sintética y tarballs como assets de la etiqueta — archivos: `cotejo/.github/workflows/release.yml` — cubre: FR-4701

## Fase 2: Historia 6 — El núcleo que usa la 046 (P1)

Pruebas primero:

- [ ] T4707 [P] [US6] Prueba de contrato del núcleo: forma del reporte, `schemaVersion`, hash estable sin los tiempos, perfil `breve` — archivos: `cotejo/packages/core/test/contract.test.ts` — cubre: FR-4702, FR-4716, SC-4711
- [ ] T4708 [P] [US6] Prueba de reproducibilidad con la red bloqueada — archivos: `cotejo/packages/core/test/repro.test.ts` — cubre: FR-4707, SC-4708
- [ ] T4709 [P] [US6] Pruebas por familia de reglas con los casos de la 014 (Unicode, frase enmascarada, polaridad, shingles) — archivos: `cotejo/packages/core/test/rules/*.test.ts` — cubre: FR-4703

Implementación:

- [ ] T4710 [US6] Ingesta con mdast: unidades con id estable y posición, normalización solo para comparar — archivos: `cotejo/packages/core/src/ingest.ts` — cubre: FR-4703
- [ ] T4711 [US6] Reglas de C1 y perfiles `speckit`, `cherced` y `breve` — archivos: `cotejo/packages/core/src/rules/**`, `cotejo/packages/core/src/profiles.ts` — cubre: FR-4703, FR-4716
- [ ] T4712 [US6] Reglas y diccionarios ES y EN como datos — archivos: `cotejo/rules/**`, `cotejo/packages/core/src/default-rules.ts` — cubre: FR-4704, FR-4719
- [ ] T4713 [US6] Reporte, SHA-256 propio, `reportHash`, SARIF, Markdown y resumen compacto — archivos: `cotejo/packages/core/src/report.ts`, `cotejo/packages/core/src/sha256.ts`, `cotejo/packages/core/src/sarif.ts`, `cotejo/packages/core/src/markdown.ts`, `cotejo/packages/core/src/compact.ts` — cubre: FR-4705, FR-4706
- [ ] T4714 [US6] Release `v0.1.0` del núcleo. Aviso al integrador: núcleo listo para la 046 — cubre: SC-4711
- [x] T4715 [US6] La misma prueba de contrato en el sitio, contra la versión fijada — archivos: `tests/unit/cotejo/contract.test.ts` — cubre: SC-4711

## Fase 3: Historia 1 — La demo en un segundo (P1)

- [x] T4716 [P] [US1] Muestra de unas 600 líneas con defectos sembrados y su verdad, todo ficticio — archivos: `content/ailab/cotejo/sample.es.md`, `content/ailab/cotejo/sample.en.md`, `content/ailab/cotejo/truth.ts` — cubre: FR-4713
- [x] T4717 [P] [US1] Prueba de la demo: métricas en vivo contra la verdad, límite de 3.000 líneas pegadas, nada sale del dispositivo — archivos: `tests/unit/cotejo/demo.test.ts` — cubre: FR-4713
- [x] T4718 [US1] Worker de la demo sobre la infraestructura de Workers del laboratorio (ampliación `lib/ailab/cotejo/**`) — archivos: `lib/ailab/cotejo/cotejo.worker.ts`, `lib/ailab/cotejo/client.ts` — cubre: FR-4713, SC-4709
- [x] T4719 [US1] Tarjeta: cargar o pegar, hallazgos por familia, caja de cristal que resalta líneas y desglosa el puntaje, precisión y recall — archivos: `components/ailab/cotejo/CotejoStage.tsx`, `components/ailab/cotejo/CotejoStage.module.scss`, `components/ailab/cotejo/FindingDetail.tsx`, `content/i18n/{es,en}/cotejo.json` — cubre: FR-4713
- [x] T4720 [US1] Descargar JSON, SARIF y Markdown — archivos: `components/ailab/cotejo/CotejoDownloads.tsx` — cubre: FR-4705

## Fase 4: Historia 2 — CLI y GitHub Action (P1)

- [ ] T4721 [P] [US2] Prueba de la CLI: salidas, alias, raíz y línea base — archivos: `cotejo/packages/cli/test/cli.test.ts` — cubre: FR-4711, FR-4712, FR-4720
- [ ] T4722 [US2] CLI `analizar`/`analyze`, `indexar` y `linea-base` — archivos: `cotejo/packages/cli/src/**` — cubre: FR-4711, FR-4712
- [ ] T4723 [US2] Action con SARIF (hasta 1.000 por severidad) y respaldo como artefacto en forks — archivos: `cotejo/action/action.yml`, `cotejo/action/src/**` — cubre: FR-4712
- [ ] T4724 [US2] PR de prueba en el repo de Cotejo con una contradicción sembrada y su anotación — cubre: historia 2, escenario 1

## Fase 5: Historia 3 — Para agentes (P2)

- [ ] T4725 [P] [US3] Prueba del MCP por stdio: herramientas, solo lectura y rechazo fuera de la raíz — archivos: `cotejo/packages/mcp/test/mcp.test.ts` — cubre: FR-4712, FR-4720
- [ ] T4726 [US3] Servidor MCP con `cotejo_analizar` y `cotejo_resumen` — archivos: `cotejo/packages/mcp/src/**` — cubre: FR-4712
- [ ] T4727 [US3] Skill de Claude Code que corre la CLI y lee el resumen compacto — archivos: `cotejo/skill/SKILL.md` — cubre: FR-4712
- [ ] T4728 [US3] Medición de tokens: spec completa frente al resumen — archivos: `cotejo/bench/tokens.ts` — cubre: SC-4712

## Fase 6: Historia 4 — Posiblemente implementado (P2)

- [ ] T4729 [P] [US4] Prueba con 20 requisitos del portafolio y su verdad — archivos: `cotejo/packages/trace/test/site.test.ts` — cubre: SC-4706
- [ ] T4730 [US4] BM25 con el puente de glosario, archivos imán, búsqueda literal de IDs en pruebas y los 3 más probables — archivos: `cotejo/packages/trace/src/**` — cubre: FR-4710
- [x] T4731 [US4] Índice del sitio generado con la CLI y versionado con su fecha — archivos: `content/ailab/cotejo/repo-index.json` — cubre: FR-4713

## Fase 7: Historia 5 — Capas semánticas (P3)

- [ ] T4732 [P] [US5] Prueba de candidatos y orden con modelos pequeños de prueba — archivos: `cotejo/packages/semantic/test/**` — cubre: FR-4708, FR-4709
- [ ] T4733 [US5] Embeddings (k = 5, coseno de 0,86 o más) y NLI con los cinco recortes — archivos: `cotejo/packages/semantic/src/**` — cubre: FR-4708, FR-4709
- [x] T4734 [US5] Capas opcionales en la demo, con consentimiento y la caché compartida con A5 — archivos: `components/ailab/cotejo/SemanticLayers.tsx`, `lib/ailab/cotejo/semantic.ts` — cubre: FR-4713

## Fase final: Pulido

- [ ] T4735 Medición completa: P, R y F1 por detector en el sintético (tres semillas), el difícil del autor y PURE; tiempos, RAM y MB — archivos: `cotejo/bench/results/**`, `cotejo/README.md` — cubre: FR-4715, SC-4701 a SC-4707
- [x] T4736 [P] Estación de la ruta — archivos: `content/ailab/cotejo/station.ts` — cubre: FR-4101
- [x] T4737 [P] Texto del caso de estudio para que el integrador lo sume (E-4706) — archivos: `content/ailab/cotejo/case.ts` — cubre: FR-4717
- [x] T4738 Medir la demo en el perfil móvil: C1 en 300 ms o menos, fps del fondo e INP — cubre: SC-4709
- [ ] T4739 Cronometrar al autor con y sin Cotejo sobre la muestra y publicar el resultado — cubre: SC-4710
- [x] T4740 Revisión de i18n ES/EN y accesibilidad (teclado, movimiento reducido, resaltado que no depende del color) — archivos: `content/i18n/{es,en}/cotejo.json`, `components/ailab/cotejo/**` — cubre: FR-4719
- [x] T4741 Capturas del celular (390×844 y WebKit) del AI Lab contra la última vista aprobada — cubre: FR-4108
- [ ] T4742 El integrador suma `cotejoStation` al registro de estaciones — archivos: `content/ailab/route/index.ts` — cubre: FR-4101 (E-4707)
- [x] T4743 Sección «Cómo quedó» en la spec — archivos: `specs/047-cotejo-revisor-de-specs/spec.md`

## Dependencias y orden

1. T4701 (el visto bueno del autor) antes de todo.
2. Fase 1, y después Fase 2. El release `v0.1.0` del núcleo es lo primero que se entrega, porque desbloquea la 046.
3. Con el release, el integrador aplica la Fase 0 del sitio (T4703).
4. Las Fases 3, 4 y 5 pueden ir en paralelo: tocan carpetas distintas.
5. La Fase 6 antes de la T4731 y la 7 antes de la T4734.
6. El pulido al final.

La parte del sitio no toca archivos de otra línea.

## Validación final

- [ ] T4744 En el repo de Cotejo: suite, medición sintética y reproducibilidad en verde en el CI
- [x] T4745 En el sitio: `npx vitest run tests/unit/cotejo`, `npm run lint` y `npm run typecheck` en verde
- [ ] T4746 Búsqueda en el diff de los dos repos de la lista de nombres prohibidos de la carpeta privada de la 041 (SC-4104)
