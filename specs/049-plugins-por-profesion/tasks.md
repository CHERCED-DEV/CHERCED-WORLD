# Tareas: 049 — Plugins por profesión

**Entrada**: [spec.md](./spec.md) y [plan.md](./plan.md). **Línea**: L8, ola 3.

**Arranca cuando**: la 049 está aprobada por el autor y las etiquetas congeladas de la 043 y la 044 están integradas en
`dev`.

**Formato**: `- [ ] TNNxx [P] [USn] Descripción — archivos: … — cubre: FR-…`. `US1` a `US5` son las historias H1 a H5
de la spec.

## Fase 0: enmiendas de la base (las hace el integrador)

- [ ] T4901 Sumar `O1` a `LAB_EXPERIMENT_IDS` — archivos: `content/types.ts` — cubre: FR-4916
- [ ] T4902 Entrada `O1` del catálogo con las descargas de Pyodide y sus textos `ailab.o1.*` — archivos: `content/ailab/catalog.ts`, `content/i18n/{es,en}/ailab.json` — cubre: FR-4906, FR-4916
- [ ] T4903 Acciones de límite `professions`, `professionsDaily`, `mcpDespacho` y `mcpObra` — archivos: `lib/security/rate-limit.ts` — cubre: FR-4907, FR-4908, FR-4912
- [ ] T4904 `TYPICAL_USE.despacho`, `TYPICAL_USE.obra` y la línea `O1` del gasto — archivos: `lib/ai/models.ts`, `lib/ai/spend.ts` — cubre: FR-4913
- [ ] T4905 Espacio de i18n `professions` — archivos: `lib/i18n/server.ts` — cubre: FR-4916
- [ ] T4906 Script `evals:professions` y rutas propias `evals/professions.eval.ts` y `tests/e2e/professions.spec.ts` — archivos: `package.json` — cubre: FR-4914
- [ ] T4907 Etiquetar `049-base` y anotar la enmienda en el plan de la 041 — archivos: `specs/041-pruebame-en-vivo/plan.md`

## Fase 1: preparación

- [ ] T4910 [P] Material extra ficticio de Despacho (pieza P9 con instrucción escondida) y su tipo ampliado, para aprobación del autor (P-4904) — archivos: `content/ailab/professions/despacho/extra-material.ts` — cubre: FR-4901
- [ ] T4911 [P] Frases de ejemplo de Obra con unidades mezcladas, para aprobación del autor — archivos: `content/ailab/professions/obra/phrases.ts` — cubre: FR-4905
- [ ] T4912 [P] Textos de la interfaz — archivos: `content/i18n/{es,en}/professions.json` — cubre: FR-4916

## Fase 2: H1, Despacho, preguntarle al caso (P1)

- [ ] T4920 [US1] Pruebas primero: esquema, guarda de piezas, relaciones, estados y certezas — archivos: `tests/unit/professions/despacho-guard.test.ts` — cubre: FR-4902, FR-4903
- [ ] T4921 [US1] Esquema Zod de la respuesta con los conjuntos cerrados de la A4 — archivos: `lib/ai/professions/despacho/schema.ts` — cubre: FR-4902
- [ ] T4922 [US1] Guarda: piezas que existen; un hecho sin pieza pasa a «solo dicho» — archivos: `lib/ai/professions/despacho/guard.ts` — cubre: FR-4903
- [ ] T4923 [US1] Prompt con el material delimitado y orquestación por el puerto, con un reintento y el tope mensual — archivos: `lib/ai/professions/despacho/prompt.ts`, `lib/ai/professions/despacho/answer.ts` — cubre: FR-4902, FR-4912
- [ ] T4924 [US1] Simulador local con el material más parecido — archivos: `lib/ai/professions/despacho/simulator.ts` — cubre: FR-4917
- [ ] T4925 [US1] Ruta de la demo de Despacho con origen, largo, límites y modo apagado — archivos: `app/api/ailab/professions/despacho/route.ts` — cubre: FR-4912
- [ ] T4926 [US1] Preguntas sugeridas con resultados pregenerados — archivos: `content/ailab/professions/despacho/suggested.ts`, `content/ailab/professions/despacho/pregenerated.json` — cubre: FR-4911
- [ ] T4927 [US1] Interfaz del agente de Despacho con piezas citadas, relación y certeza — archivos: `components/ailab/professions/DespachoAgent.tsx` — cubre: FR-4902, FR-4916

## Fase 3: H2, Despacho, no responde derecho de memoria (P1)

- [ ] T4930 [US2] Pruebas primero: preguntas de derecho, mixtas y falsos positivos; la salida no contiene normas ni plazos — archivos: `tests/unit/professions/despacho-law.test.ts` — cubre: FR-4904
- [ ] T4931 [US2] Clasificador de derecho (reglas y luego el modelo barato) y negativa fija con oferta — archivos: `lib/ai/professions/despacho/law.ts` — cubre: FR-4904
- [ ] T4932 [US2] Separar la parte de derecho en preguntas mixtas — archivos: `lib/ai/professions/despacho/answer.ts` — cubre: FR-4904

## Fase 4: H3, Obra, la bitácora como se habla (P1)

- [ ] T4940 [US3] Pruebas primero: normalización de unidades, esquema, `OBRA_LIMITS` y varias fundidas en una frase — archivos: `tests/unit/professions/obra-extract.test.ts` — cubre: FR-4905
- [ ] T4941 [US3] Normalización de unidades con reglas (cm, mm y m) y lista de conversiones — archivos: `lib/ai/professions/obra/units.ts` — cubre: FR-4905
- [ ] T4942 [US3] Esquema y extractor por el puerto, validado contra la A4 — archivos: `lib/ai/professions/obra/schema.ts`, `lib/ai/professions/obra/extract.ts` — cubre: FR-4905
- [ ] T4943 [US3] Simulador con reglas para las frases de ejemplo — archivos: `lib/ai/professions/obra/simulator.ts` — cubre: FR-4917
- [ ] T4944 [US3] Ruta de la demo de Obra — archivos: `app/api/ailab/professions/obra/route.ts` — cubre: FR-4912
- [ ] T4945 [US3] Interfaz: escribir, revisar, confirmar y recalcular con `useObraPython` (sin cambiarlo) — archivos: `components/ailab/professions/ObraAgent.tsx` — cubre: FR-4906, FR-4916
- [ ] T4946 [US3] Entradas sugeridas pregeneradas — archivos: `content/ailab/professions/obra/suggested.ts`, `content/ailab/professions/obra/pregenerated.json` — cubre: FR-4911

## Fase 5: H4, ver el plugin y conectarlo (P2)

- [ ] T4950 [US4] Pruebas de contrato de los dos MCP sin red — archivos: `tests/unit/professions/mcp-despacho.test.ts`, `tests/unit/professions/mcp-obra.test.ts` — cubre: FR-4907, FR-4908
- [ ] T4951 [US4] Herramientas y servidor de Despacho — archivos: `lib/mcp/servers/despacho/tools.ts`, `lib/mcp/servers/despacho/server.ts`, `app/api/mcp/despacho/route.ts` — cubre: FR-4907
- [ ] T4952 [US4] Herramientas y servidor de Obra, con el estimado pregenerado de la muestra — archivos: `lib/mcp/servers/obra/tools.ts`, `lib/mcp/servers/obra/server.ts`, `app/api/mcp/obra/route.ts`, `content/ailab/professions/obra/sample-estimate.json` — cubre: FR-4908
- [ ] T4953 [US4] Plugin de demostración por oficio en ES y EN, con una prueba de copia fiel como la de la A2 — archivos: `content/ailab/professions/plugins/{despacho,obra}/**`, `lib/ai/professions/plugin-copy.ts`, `tests/unit/professions/plugin-copy.test.ts` — cubre: FR-4909
- [ ] T4954 [US4] Árbol del plugin y línea `claude mcp add` para copiar — archivos: `components/ailab/professions/PluginTree.tsx` — cubre: FR-4909, FR-4910

## Fase 6: H5, la ficha de producto (P3)

- [ ] T4960 [US5] Fichas por oficio con el supuesto de horas marcado — archivos: `content/ailab/professions/sheets.ts` — cubre: FR-4915
- [ ] T4961 [US5] Componente de la ficha, renderizado en el servidor — archivos: `components/ailab/professions/ProductSheet.tsx` — cubre: FR-4915

## Fase final: pulido

- [ ] T4970 Caja de cristal de los dos oficios — archivos: `lib/ai/professions/trace.ts`, `components/ailab/professions/ProfessionTrace.tsx`, `tests/unit/professions/trace.test.ts` — cubre: FR-4913
- [ ] T4971 Contenedor de la tarjeta con selector de oficio y enlace a la A4 «versión sin modelo» — archivos: `components/ailab/professions/ProfessionsStage.tsx` — cubre: FR-4916
- [ ] T4972 Baterías de evals (al menos 20 por oficio), calificador y prueba que falla con fallos de derecho o inyección — archivos: `content/ailab/professions/despacho/evals.ts`, `content/ailab/professions/obra/evals.ts`, `lib/ai/professions/evals/grade.ts`, `tests/unit/professions/evals.test.ts`, `content/ailab/professions/{despacho,obra}/results.json` — cubre: FR-4914
- [ ] T4973 Corredor manual de las baterías — archivos: `evals/professions.eval.ts` — cubre: FR-4914
- [ ] T4974 [P] Estación «Un oficio, un plugin» — archivos: `content/ailab/professions/station.ts` — cubre: FR-4101
- [ ] T4975 [P] Prueba e2e con el simulador en escritorio y 390×844 — archivos: `tests/e2e/professions.spec.ts` — cubre: FR-4916
- [ ] T4976 Capturas del celular (390×844 y WebKit) del AI Lab contra la última vista aprobada, con la A4 sin cambios — cubre: FR-4108
- [ ] T4977 Sección «Cómo quedó» en la spec — archivos: `specs/049-plugins-por-profesion/spec.md`

## Dependencias y orden

- La fase 0 va antes de todo (integrador). La fase 1 va antes de las fases 2 a 6.
- Despacho (fases 2 y 3, en orden) y Obra (fase 4) pueden ir en paralelo: no comparten archivos.
- La fase 5 depende de las fases 2 y 4, porque usa sus datos. La fase 6 puede ir en cualquier momento después de la 1.
- La fase final va al cierre. Al integrar, el integrador registra la demo (`l8-professions.ts`) y la estación, y corre
  una vez las pruebas de la A4.

## Validación final

- [ ] `npx vitest run tests/unit/professions`, `npm run lint` y `npm run typecheck` en verde.
- [ ] `npx playwright test tests/e2e/professions.spec.ts` en verde con el simulador.
- [ ] `npx vitest run tests/unit/x3 tests/unit/x2` en verde: la A4 y la A2 no cambiaron.
- [ ] La primera corrida de `npm run evals:professions` la hace o la autoriza el autor (unos 0,25 USD).
- [ ] Búsqueda de nombres internos, datos reales y precios reales en el diff antes del push (SC-4104).
