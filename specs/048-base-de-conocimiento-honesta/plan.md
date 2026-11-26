# Plan de implementación: 048 — Base de conocimiento honesta

**Línea**: L7, ola 3 | **Fecha**: 26 de noviembre de 2026 | **Spec**: [spec.md](./spec.md)

## Resumen

La 048 construye un agente con fuentes sobre el corpus ficticio de Rodamundo, más su MCP de solo lectura.

- **Búsqueda:** el buscador del sitio (MiniSearch, ya instalado) sobre fragmentos armados al compilar.
- **Respuesta:** el modelo responde por el puerto de la 043 con salida estructurada. Después, el servidor aplica dos
  guardas deterministas: la de citas y la de confianza.
- **MCP:** `/api/mcp/empresa` reusa el núcleo de la 044 y no llama modelos.
- **Demo:** la tarjeta `K1` del AI Lab, con caja de cristal, preguntas sugeridas pregeneradas y una comparación con un
  chatbot ingenuo.

## Contexto técnico

- **Lenguaje**: TypeScript estricto, Next.js 16 con App Router y React 19.
- **Dependencias**: ninguna nueva.
  - Búsqueda: `minisearch`, por `createSearcher` de `lib/search/searcher.ts`.
  - Esquemas: `zod`.
  - Markdown del corpus: lo que ya usa el sitio para contenido.
  - Modelo: el puerto de la 043.
  - MCP: el núcleo de la 044.
- **Almacenamiento**:
  - El corpus, las respuestas pregeneradas y los resultados de evals son contenido versionado en el repo.
  - Los límites usan el repositorio de límites que ya existe en Mongo (`RateLimitRepo`).
  - No hay colecciones nuevas.
- **Pruebas**:
  - Vitest para guardas, confianza, índice, contrato MCP y batería.
  - Un archivo e2e de Playwright para la tarjeta, con el simulador.
  - Sin llamadas reales.
- **Plataforma**: funciones de Vercel (Node), con `maxDuration` de 60 s como la 029.
- **Metas de rendimiento**:
  - Pregunta sugerida en menos de 1 s.
  - Pregunta libre en menos de 6 s p95.
  - Índice de búsqueda de menos de 300 KB, armado al compilar y cargado una vez por instancia.
- **Restricciones**:
  - Principio VIII: sin infraestructura nueva y con el tope de la 043.
  - FR-4102: todo ficticio.
  - FR-4110: sin gastar API en pruebas.

## Verificación de la constitución

| Principio | Cómo se cumple |
|---|---|
| **I. Evolución** | Es una tarjeta nueva del AI Lab y una ruta nueva de API. No cambia rutas ni secciones aprobadas |
| II. Glass sobre movimiento | Usa los tokens de glass del AI Lab y respeta `prefers-reduced-motion` |
| **III. Seguridad** | Valida origen y largo en el servidor, con límites por visitante, diario y por IP en el MCP. Solo usa contenido ficticio público. Los fragmentos van como datos delimitados. La guarda de citas evita respuestas sin fuente. No expone instrucciones del sistema |
| IV. Contenido como datos | El corpus está tipado y versionado, en ES y EN con paridad. El texto de la tarjeta se renderiza en el servidor |
| V. Rendimiento y accesibilidad | La demo se carga en diferido, como las demás (`labDemo`). Funciona con teclado y lector de pantalla, y la confianza va con texto además del color |
| VI. Calidad | Pruebas de guardas, de contrato MCP y de la batería, más el gate de lint, tipos, pruebas y build |
| **VII. Líneas exclusivas** | Solo toca sus rutas propias (tabla abajo). Lo compartido entra como enmienda del integrador |
| **VIII. Simplicidad** | Sin dependencias, sin base vectorial, sin colecciones y sin llaves nuevas. Lo caro se pregenera. Usa el tope mensual de la 043 |

## Rutas propias de la línea

| Ruta | Qué va |
|---|---|
| `content/ailab/kb/**` | El corpus `corpus/{es,en}/*.md`, `documents.ts` (metadatos), `suggested.ts`, `pregenerated/{es,en}.json`, `naive.ts`, `station.ts` y `evals/{battery.ts,results.json}` |
| `lib/ai/kb/**` | `fragments.ts`, `index.ts` (buscador), `guard.ts` (citas), `confidence.ts`, `prompt.ts`, `answer.ts` (orquesta), `injection.ts` (detector), `simulator.ts`, `trace.ts` y `evals/grade.ts` |
| `lib/mcp/servers/empresa/**` | `tools.ts` y `server.ts`, con `createMcpHandler` de la 044 |
| `app/api/mcp/empresa/route.ts` | El endpoint MCP |
| `app/api/ailab/kb/**` | `route.ts`: la pregunta de la demo |
| `components/ailab/kb/**` | `KbStage.tsx`, `SourceCard.tsx`, `ConfidenceBadge.tsx`, `KbTrace.tsx`, `NaiveCompare.tsx`, `McpConnect.tsx` y sus estilos |
| `content/i18n/{es,en}/kb.json` | Los textos de la interfaz |
| `tests/unit/kb/**` | Las pruebas unitarias y de contrato |

## Enmiendas a archivos compartidos

Las aplica el integrador y se congelan con la etiqueta `048-base`.

**Antes de arrancar la línea:**

1. `content/types.ts`: sumar `'K1'` a `LAB_EXPERIMENT_IDS` y, si la 043 no lo hizo, el valor de `LAB_RUNS_IN` para
   proveedores.
2. `content/ailab/catalog.ts` y `content/i18n/{es,en}/ailab.json`: entrada `K1` en el tema `agents`, con estado
   `experiment`, flujo, tarjetas de decisión y privacidad (`ailab.k1.*`).
3. `lib/security/rate-limit.ts`: acciones `kb` (10 por 24 h), `kbDaily` (20 por 24 h, clave global) y `mcpEmpresa` (60
   por hora), si el núcleo de la 044 no trae sus propias claves por servidor.
4. `lib/ai/models.ts`: `TYPICAL_USE.kb`, con el modelo barato por defecto del puerto (hoy `gemini-3.8-flash`), 3.000 de
   entrada y 400 de salida.
5. `lib/ai/spend.ts`: línea `K1` con la acción `kbDaily` y el uso `kb`.
6. El cargador de i18n (`lib/i18n/server.ts` y lo que corresponda del lado del cliente): registrar el espacio `kb`.
7. `package.json`: script `evals:kb` con `vitest run --config vitest.evals.config.ts evals/kb.eval.ts`, más la ruta
   nueva `evals/kb.eval.ts` como propia de la línea. Si la 043 no amplió `vitest.evals.config.ts` para cargar las llaves
   de los tres proveedores, se hace aquí.

**Al integrar la línea:**

1. `components/ailab/shell/demos/l7-kb.ts` y su import en `components/ailab/shell/demos/index.ts`: registrar
   `K1: labDemo(() => import('@/components/ailab/kb/KbStage'))`.
2. `content/ailab/route/index.ts`: sumar la estación de `content/ailab/kb/station.ts`.
3. `README.md`: mencionar el MCP de la empresa en la sección del AI Lab. No hay variables nuevas.

## Contratos

**Consume:**

| Contrato | De | Uso |
|---|---|---|
| `generateJson`, `assertMonthlyBudget`, `BudgetExhaustedError` y `ProviderId` | 043, `lib/ai/providers/port.ts` | Respuesta estructurada, tope mensual y proveedor y modelo en la traza |
| `createMcpHandler` y `McpTool` | 044, `lib/mcp/core/` | El endpoint `/api/mcp/empresa` |
| `RouteStation` | 042, `content/ailab/route/stations.ts` | La estación |
| `createSearcher` | Existente, `lib/search/searcher.ts` | El índice de fragmentos |
| `hitRateLimit` y `requestIpHash` | Existentes, `lib/security/` | Los límites |
| `percentile` y `clipAnswer` | Existentes, `lib/ai/evals/grade.ts` | Resumen de la corrida de evals (solo se importan) |

**Produce:**

- `KbAnswer`, en `lib/ai/kb/answer.ts`:
  ```
  {
    text,
    citations: { fragmentId, quote, docTitle, href }[],
    dropped: { fragmentId, reason }[],
    confidence: 'alta' | 'media' | 'baja' | 'sin_evidencia',
    cause,
    notFound: string[],
    trace,
    usage,
    costUsd,
    provider,
    model
  }
  ```
- Las herramientas del MCP:
  - `listar_documentos()`;
  - `buscar_en_documentos({ consulta, idioma?, limite? ≤ 8 })` → `{ fragmentos: [{ id, titulo, extracto, puntaje }], confianza: { nivel, causa, avisos } }`;
  - `leer_fragmento({ id })` → `{ id, documento, version, vigente, texto }`.

**Estación:** la 048 declara `proof: 2` y `alsoProves: [1]`. El campo opcional `alsoProves` se sumó al contrato de la
042 para las estaciones que prueban más de una cosa.

## Decisiones de diseño

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| La confianza la calcula el servidor con reglas | El modelo no se pone su propia nota; se puede auditar y probar | Las reglas son gruesas: una buena respuesta con una sola cita queda en «media» |
| Guarda de citas literal, sin tildes ni mayúsculas | Una cita que no está en el texto es la forma más común de inventar con fuente | Se descartan paráfrasis honestas; por eso el prompt pide citar frases exactas y cortas |
| Búsqueda léxica con el buscador del sitio, sin embeddings | No hay dependencias nuevas, todo corre en milisegundos y es determinista para las evals | Falla con sinónimos lejanos. El corpus se titula bien y las evals miden si alcanza (P-4801) |
| El MCP no llama modelos | Costo cero por cliente externo y nada que abusar con tokens | El cliente arma su propia respuesta y la honestidad depende de su modelo; por eso el bloque de confianza viaja en cada búsqueda |
| Las preguntas sugeridas se pregeneran | Costo cero por visita y respuesta instantánea (FR-4106) | Si cambia el corpus, hay que regenerarlas; una prueba compara su huella con la del corpus |
| Comparación con un chatbot ingenuo pregenerada | Se ve el riesgo sin pagarlo en cada visita | No es en vivo; se etiqueta como pregenerada |

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La búsqueda léxica trae fragmentos pobres y la confianza queda baja casi siempre | Medio | Corpus con títulos y palabras clave; medir con las evals; P-4801 |
| El modelo parafrasea y la guarda descarta todas sus citas | Medio | El prompt pide citas exactas y cortas, con un reintento si todas se descartan; medir la tasa de descarte en la batería |
| Inyección dentro de un documento | Alto | Fragmentos delimitados, instrucción fija, detector en la traza, casos de inyección que bloquean (FR-4814) |
| Las respuestas pregeneradas quedan desfasadas | Bajo | Prueba de huella del corpus contra las pregeneradas |
| Abuso del MCP | Bajo | Solo lectura, sin modelo, límite por IP y respuestas cacheables |
| La 043 o la 044 cambian su contrato | Medio | La línea arranca solo con las etiquetas de la 043 y la 044 congeladas; dobles de prueba para los dos |

## Validación

- `npx vitest run tests/unit/kb`.
- `npm run lint` y `npm run typecheck`.
- Un solo archivo e2e, `tests/e2e/kb.spec.ts`, con el simulador: una pregunta normal, una trampa y la caja de cristal,
  en escritorio y en 390×844. Es enmienda de ruta: `tests/e2e/kb.spec.ts` pasa a ser propio de la línea.
- Una prueba de contrato del MCP con `tools/list` y `tools/call` sin red.
- Ninguna corrida real de evals sin permiso del autor. Nunca la suite exhaustiva.

## Seguimiento de complejidad

Sin violaciones de la constitución.
