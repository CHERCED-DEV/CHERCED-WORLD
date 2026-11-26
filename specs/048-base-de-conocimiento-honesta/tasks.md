# Tareas: 048 — Base de conocimiento honesta

**Entrada**: [spec.md](./spec.md) y [plan.md](./plan.md). **Línea**: L7, ola 3.

**Arranca cuando**: la 048 está aprobada por el autor y las etiquetas congeladas de la 043 (puerto) y la 044 (núcleo
MCP) están integradas en `dev`.

**Formato**: `- [ ] TNNxx [P] [USn] Descripción — archivos: … — cubre: FR-…`. `[P]` marca una tarea que puede ir en
paralelo, porque toca otros archivos y no depende de otra. `US1` a `US5` son las historias H1 a H5 de la spec.

## Fase 0: enmiendas de la base (las hace el integrador)

- [ ] T4801 Sumar `K1` a `LAB_EXPERIMENT_IDS` — archivos: `content/types.ts` — cubre: FR-4815
- [ ] T4802 Entrada `K1` del catálogo y sus textos `ailab.k1.*` en ES y EN — archivos: `content/ailab/catalog.ts`, `content/i18n/{es,en}/ailab.json` — cubre: FR-4802, FR-4815
- [ ] T4803 Acciones de límite `kb`, `kbDaily` y `mcpEmpresa` — archivos: `lib/security/rate-limit.ts` — cubre: FR-4811, FR-4812
- [ ] T4804 `TYPICAL_USE.kb` y la línea `K1` del gasto — archivos: `lib/ai/models.ts`, `lib/ai/spend.ts` — cubre: FR-4810, FR-4812
- [ ] T4805 Espacio de i18n `kb` en el cargador — archivos: `lib/i18n/server.ts` — cubre: FR-4815
- [ ] T4806 Script `evals:kb` y ruta propia `evals/kb.eval.ts`; ruta propia `tests/e2e/kb.spec.ts` — archivos: `package.json` — cubre: FR-4814
- [ ] T4807 Etiquetar `048-base` y anotar la enmienda en el plan de la 041 — archivos: `specs/041-pruebame-en-vivo/plan.md`

## Fase 1: preparación

- [ ] T4810 Corpus ficticio de Rodamundo en ES y EN (20 a 30 documentos, con la política vieja y la nueva, el par en conflicto y el documento con instrucción escondida), para aprobación del autor (P-4802) — archivos: `content/ailab/kb/corpus/{es,en}/*.md` — cubre: FR-4801, FR-4802, FR-4803
- [ ] T4811 [P] Metadatos tipados de cada documento (id, área, versión, fecha, público, reemplaza a, conflicto con) — archivos: `content/ailab/kb/documents.ts` — cubre: FR-4801
- [ ] T4812 [P] Textos de la interfaz — archivos: `content/i18n/{es,en}/kb.json` — cubre: FR-4815

## Fase 2: H1, preguntar y ver la fuente (P1)

- [ ] T4820 [US1] Pruebas primero: fragmentos con id estable, guarda de citas, reglas de confianza y abstención — archivos: `tests/unit/kb/fragments.test.ts`, `tests/unit/kb/guard.test.ts`, `tests/unit/kb/confidence.test.ts` — cubre: FR-4804, FR-4807, FR-4808
- [ ] T4821 [US1] Partir documentos en fragmentos `doc#seccion` — archivos: `lib/ai/kb/fragments.ts` — cubre: FR-4804
- [ ] T4822 [US1] Índice con `createSearcher`, armado una vez por instancia — archivos: `lib/ai/kb/index.ts` — cubre: FR-4804
- [ ] T4823 [US1] Guarda de citas: fragmento que existe y frase literal sin tildes ni mayúsculas — archivos: `lib/ai/kb/guard.ts` — cubre: FR-4807
- [ ] T4824 [US1] Confianza con reglas y causa de un conjunto cerrado; el modelo solo puede bajarla — archivos: `lib/ai/kb/confidence.ts` — cubre: FR-4808
- [ ] T4825 [US1] Esquema Zod de la respuesta y prompt con fragmentos delimitados — archivos: `lib/ai/kb/prompt.ts` — cubre: FR-4806, FR-4809
- [ ] T4826 [US1] Orquestación: búsqueda, hasta 3 pasos, puerto de la 043, un reintento, guardas y `assertMonthlyBudget` — archivos: `lib/ai/kb/answer.ts` — cubre: FR-4805, FR-4806, FR-4812
- [ ] T4827 [US1] Simulador local con el mejor fragmento — archivos: `lib/ai/kb/simulator.ts` — cubre: FR-4816
- [ ] T4828 [US1] Ruta de la demo con origen, largo, límites y modo apagado — archivos: `app/api/ailab/kb/route.ts` — cubre: FR-4812
- [ ] T4829 [US1] Respuestas pregeneradas de las 8 sugeridas por idioma, con prueba de huella del corpus — archivos: `content/ailab/kb/suggested.ts`, `content/ailab/kb/pregenerated/{es,en}.json`, `tests/unit/kb/pregenerated.test.ts` — cubre: FR-4813
- [ ] T4830 [US1] Interfaz: pregunta, sugeridas, respuesta, tarjetas de fuente y confianza con texto — archivos: `components/ailab/kb/KbStage.tsx`, `components/ailab/kb/SourceCard.tsx`, `components/ailab/kb/ConfidenceBadge.tsx` — cubre: FR-4815

## Fase 3: H2, tratar de engañarla (P1)

- [ ] T4840 [US2] Pruebas primero: versión vigente, conflicto e inyección marcada — archivos: `tests/unit/kb/traps.test.ts` — cubre: FR-4803, FR-4808, FR-4809
- [ ] T4841 [US2] Detector de fragmentos con forma de instrucción — archivos: `lib/ai/kb/injection.ts` — cubre: FR-4809
- [ ] T4842 [US2] Aviso de versión anterior y de conflicto en la respuesta y en la tarjeta — archivos: `lib/ai/kb/confidence.ts`, `components/ailab/kb/SourceCard.tsx` — cubre: FR-4808

## Fase 4: H3, la caja de cristal (P2)

- [ ] T4850 [US3] Prueba de la traza: pasos, puntajes, guardas, citas descartadas, tokens y costo — archivos: `tests/unit/kb/trace.test.ts` — cubre: FR-4810
- [ ] T4851 [US3] Armar la traza en el servidor — archivos: `lib/ai/kb/trace.ts` — cubre: FR-4810
- [ ] T4852 [US3] Botón «Cómo respondió», cerrado por defecto y con `aria-expanded` — archivos: `components/ailab/kb/KbTrace.tsx` — cubre: FR-4810, FR-4815

## Fase 5: H4, el MCP de la empresa (P2)

- [ ] T4860 [US4] Prueba de contrato: `tools/list` solo de lectura, búsqueda vacía con «sin evidencia» y fragmento inexistente — archivos: `tests/unit/kb/mcp.test.ts` — cubre: FR-4811
- [ ] T4861 [US4] Herramientas `listar_documentos`, `buscar_en_documentos` y `leer_fragmento` — archivos: `lib/mcp/servers/empresa/tools.ts`, `lib/mcp/servers/empresa/server.ts` — cubre: FR-4811
- [ ] T4862 [US4] Endpoint `/api/mcp/empresa` con `createMcpHandler` y su límite — archivos: `app/api/mcp/empresa/route.ts` — cubre: FR-4811
- [ ] T4863 [US4] Bloque «Conecta tu cliente», con la línea para copiar — archivos: `components/ailab/kb/McpConnect.tsx` — cubre: FR-4811

## Fase 6: H5, comparar con un chatbot ingenuo (P3)

- [ ] T4870 [US5] Respuestas ingenuas pregeneradas de las trampas, etiquetadas — archivos: `content/ailab/kb/naive.ts` — cubre: FR-4813
- [ ] T4871 [US5] Interruptor de comparación lado a lado (apilado en el celular) — archivos: `components/ailab/kb/NaiveCompare.tsx` — cubre: FR-4815

## Fase final: pulido

- [ ] T4880 Batería de evals de al menos 40 casos ES y EN, en siete tipos — archivos: `content/ailab/kb/evals/battery.ts` — cubre: FR-4814
- [ ] T4881 Calificador con reglas y prueba que falla si la última corrida tiene fallos de inyección o abstención — archivos: `lib/ai/kb/evals/grade.ts`, `tests/unit/kb/evals.test.ts`, `content/ailab/kb/evals/results.json` — cubre: FR-4814
- [ ] T4882 Corredor manual de la batería con el proveedor elegible — archivos: `evals/kb.eval.ts` — cubre: FR-4814
- [ ] T4883 [P] Estación «Pregúntale a una empresa y trata de engañarla» — archivos: `content/ailab/kb/station.ts` — cubre: FR-4101
- [ ] T4884 [P] Prueba e2e con el simulador en escritorio y 390×844 — archivos: `tests/e2e/kb.spec.ts` — cubre: FR-4815
- [ ] T4885 Capturas del celular (390×844 y WebKit) de la página del AI Lab contra la última vista aprobada — cubre: FR-4108
- [ ] T4886 Sección «Cómo quedó» en la spec — archivos: `specs/048-base-de-conocimiento-honesta/spec.md`

## Dependencias y orden

- La fase 0 va antes de todo (integrador).
- La fase 1 va antes de las fases 2 a 6. T4810 espera la aprobación del corpus por el autor.
- Las fases 2 y 3 van en orden, porque comparten `confidence.ts`. La fase 4 puede ir en paralelo con la 3.
- La fase 5 solo depende de las fases 1 y 2 (índice y fragmentos), y puede ir en paralelo con las 3 y 4.
- La fase 6 depende de la fase 3, porque usa las trampas.
- La fase final va al cierre. Al integrar, el integrador registra la demo (`l7-kb.ts`) y la estación.

## Validación final

- [ ] `npx vitest run tests/unit/kb`, `npm run lint` y `npm run typecheck` en verde.
- [ ] `npx playwright test tests/e2e/kb.spec.ts` en verde con el simulador.
- [ ] Ninguna llamada real a modelos sin permiso del autor. La primera corrida de `npm run evals:kb` la hace o la
      autoriza el autor (unos 0,15 USD).
- [ ] Búsqueda de nombres internos y de datos reales en el diff antes del push (SC-4104).
