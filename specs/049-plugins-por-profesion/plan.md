# Plan de implementación: 049 — Plugins por profesión

**Línea**: L8, ola 3 | **Fecha**: 26 de noviembre de 2026 | **Spec**: [spec.md](./spec.md)

## Resumen

La 049 suma una tarjeta nueva, `O1`, que reusa sin tocarlos los datos y el motor de la A4:
- `DESPACHO_CASE`;
- `OBRA_LOG`, `OBRA_PRICES` y `OBRA_LIMITS`;
- `estimate.py` con `useObraPython`.

Encima pone:
- **Despacho:** un agente con salida estructurada, una guarda de citas y una clasificación de preguntas de derecho.
- **Obra:** un extractor de bitácora con esquema y validación. El cálculo lo sigue haciendo Python en el navegador.
- **Dos MCP de solo lectura y sin modelo:** `/api/mcp/despacho` y `/api/mcp/obra`, con el núcleo de la 044.
- **Un plugin de demostración por oficio**, mostrado como en la A2, más una ficha de producto.

## Contexto técnico

- **Lenguaje**: TypeScript estricto. Python solo el que ya existe (`lib/ailab/pyodide/estimate.py`).
- **Dependencias**: ninguna nueva.
  - `zod` para los esquemas.
  - El puerto de la 043 para el modelo.
  - El núcleo de la 044 para el MCP.
  - `createSearcher` (`lib/search/searcher.ts`) para `buscar_en_el_caso`.
  - Pyodide y numpy, que ya descarga la A4 con permiso.
- **Almacenamiento**: todo es contenido versionado: material extra, pregenerados, plugin de demostración, fichas y
  resultados de evals. Los límites usan `RateLimitRepo`. No hay colecciones nuevas.
- **Pruebas**:
  - Vitest para guardas, clasificador de derecho, extractor, contratos MCP, copia fiel del plugin y baterías.
  - Un archivo e2e con el simulador.
  - Sin llamadas reales.
- **Plataforma**: funciones de Vercel (Node), con `maxDuration` de 60 s.
- **Metas de rendimiento**:
  - Sugeridas en menos de 1 s.
  - Libres en menos de 7 s p95.
  - El estimado de Obra en menos de 1 s con Pyodide ya cargado, como hoy en la A4.
- **Restricciones**:
  - FR-4102: todo ficticio y precios de ejemplo.
  - La tarjeta A4 y sus componentes no cambian (FR-4916).
  - Sin gastar API en pruebas (FR-4110).

## Verificación de la constitución

| Principio | Cómo se cumple |
|---|---|
| **I. Evolución** | Es una tarjeta nueva. La A4 queda tal cual y solo recibe un enlace desde la `O1` |
| II. Glass sobre movimiento | Usa los tokens del AI Lab y respeta el movimiento reducido |
| **III. Seguridad** | Valida origen, largo y límites en el servidor. Solo contenido ficticio público. Guardas contra citas inventadas y contra respuestas de derecho. El material va como datos delimitados. Los MCP son de solo lectura y tienen límite por IP |
| IV. Contenido como datos | Fichas, plugin y pregenerados son contenido tipado y bilingüe. Las fichas se renderizan en el servidor |
| V. Rendimiento y accesibilidad | Carga diferida de la demo. Teclado y lector de pantalla. Estados con texto además del color |
| VI. Calidad | Prueba de copia fiel del plugin (como la de la A2), contratos MCP, guardas y baterías |
| **VII. Líneas exclusivas** | Solo toca sus rutas. Importa sin cambiar `content/ailab/showcases/*`, `lib/ailab/pyodide/*` y `components/ailab/showcases/use-obra-python.ts`; cambiarlos sería una enmienda |
| **VIII. Simplicidad** | Una sola implementación del cálculo (Python), sin dependencias, sin colecciones y sin llaves nuevas. MCP sin modelo. Pregenerado |

## Rutas propias de la línea

| Ruta | Qué va |
|---|---|
| `content/ailab/professions/**` | `despacho/{extra-material.ts,suggested.ts,pregenerated.json,evals.ts,results.json}`, `obra/{phrases.ts,suggested.ts,pregenerated.json,sample-estimate.json,evals.ts,results.json}`, `plugins/{despacho,obra}/**` (el plugin de demostración en ES y EN), `sheets.ts` (fichas) y `station.ts` |
| `lib/ai/professions/**` | `despacho/{schema.ts,guard.ts,law.ts,prompt.ts,answer.ts,simulator.ts}`, `obra/{schema.ts,units.ts,extract.ts,simulator.ts}`, `trace.ts`, `evals/grade.ts` y `plugin-copy.ts` |
| `lib/mcp/servers/despacho/**` y `lib/mcp/servers/obra/**` | `tools.ts` y `server.ts` de cada uno |
| `app/api/mcp/despacho/route.ts` y `app/api/mcp/obra/route.ts` | Los endpoints MCP |
| `app/api/ailab/professions/**` | `despacho/route.ts` y `obra/route.ts` |
| `components/ailab/professions/**` | `ProfessionsStage.tsx`, `DespachoAgent.tsx`, `ObraAgent.tsx`, `PluginTree.tsx`, `ProductSheet.tsx`, `ProfessionTrace.tsx` y sus estilos |
| `content/i18n/{es,en}/professions.json` | Los textos de la interfaz |
| `tests/unit/professions/**` | Las pruebas |

## Enmiendas a archivos compartidos

Las aplica el integrador y se congelan con la etiqueta `049-base`.

**Antes de arrancar la línea:**

1. `content/types.ts`: sumar `'O1'` a `LAB_EXPERIMENT_IDS`.
2. `content/ailab/catalog.ts` y `content/i18n/{es,en}/ailab.json`: entrada `O1` en el tema `agents` (estado
   `experiment`, flujo, tarjetas de decisión, privacidad y las mismas descargas de la A4: `PYODIDE_CORE` y
   `PYODIDE_NUMPY`), con sus textos `ailab.o1.*`.
3. `lib/security/rate-limit.ts`: acciones `professions` (5 por 24 h), `professionsDaily` (10 por 24 h, global),
   `mcpDespacho` y `mcpObra` (60 por hora cada una), si el núcleo de la 044 no trae claves por servidor.
4. `lib/ai/models.ts`: `TYPICAL_USE.despacho` (7.000 de entrada y 800 de salida) y `TYPICAL_USE.obra` (1.500 y 400), con
   el modelo barato por defecto del puerto.
5. `lib/ai/spend.ts`: línea `O1` con la acción `professionsDaily` y el uso `despacho`, que es el más caro.
6. El cargador de i18n: espacio `professions`.
7. `package.json`: script `evals:professions` con
   `vitest run --config vitest.evals.config.ts evals/professions.eval.ts`. Pasan a ser rutas propias
   `evals/professions.eval.ts` y `tests/e2e/professions.spec.ts`.

**Al integrar la línea:**

1. `components/ailab/shell/demos/l8-professions.ts` y su import en `components/ailab/shell/demos/index.ts`:
   `O1: labDemo(() => import('@/components/ailab/professions/ProfessionsStage'))`.
2. `content/ailab/route/index.ts`: sumar la estación de `content/ailab/professions/station.ts`.

No se cambia la A4. Si la `O1` necesita algo de `useObraPython` que hoy no expone, se pide como enmienda aparte, con la
línea de la A4 como dueña.

## Contratos

**Consume:**

| Contrato | De | Uso |
|---|---|---|
| `generateJson`, `assertMonthlyBudget` y `BudgetExhaustedError` | 043 | Respuestas de Despacho, clasificación de derecho y extracción de Obra |
| `createMcpHandler` y `McpTool` | 044 | Los dos endpoints MCP |
| `RouteStation` | 042 | La estación |
| `DESPACHO_CASE`, `DESPACHO_RELATIONS`, `DESPACHO_FACT_STATUSES` y `DESPACHO_CERTAINTIES` | Existente, `content/ailab/showcases/despacho.ts` | El caso y sus conjuntos cerrados |
| `OBRA_LOG`, `OBRA_PRICES`, `OBRA_LIMITS`, `OBRA_KINDS` y `ObraEntry` | Existente, `content/ailab/showcases/obra.ts` | La bitácora, los precios de ejemplo y la validación |
| `useObraPython` y `estimate.py` | Existentes, `components/ailab/showcases/use-obra-python.ts` y `lib/ailab/pyodide/` | El cálculo en el navegador |
| `createSearcher` | Existente, `lib/search/searcher.ts` | `buscar_en_el_caso` |
| `absoluteUrl` | Existente, `lib/site-url.ts` | La línea para conectar el MCP |

**Produce:**

- `DespachoAnswer`:
  ```
  {
    text,
    citations: { piece, relation }[],
    facts: { id, status }[],
    dates: { text, certainty }[],
    missing: string[],
    dropped,
    lawRefusal: boolean,
    trace,
    usage,
    costUsd,
    provider,
    model
  }
  ```
- `ObraProposal`:
  ```
  {
    source,
    entries: ObraEntry[],
    conversions: string[],
    errors: { field, value, min, max }[],
    status
  }
  ```
- Las herramientas MCP de FR-4907 y FR-4908.

**Estación:** la 049 declara `proof: 2`, sin `alsoProves`.

## Decisiones de diseño

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| El cálculo de Obra solo en Python, en el navegador | Una sola implementación, la misma que ya prueba la A4, y el modelo nunca toca números de costo | El MCP de Obra no calcula entradas nuevas; solo da el estimado pregenerado de la muestra |
| La clasificación de derecho va antes de responder, con reglas y después el modelo barato | Una pregunta de derecho no llega nunca al prompt de respuesta | Algún falso positivo («¿qué fecha es segura?») recibe la negativa; la oferta de tarea lo compensa |
| Material extra propio (P9) en vez de cambiar `DESPACHO_CASE` | No toca datos de otra línea ni su prueba | Los tipos de la A4 solo conocen P1 a P8; la 049 define su tipo ampliado en su carpeta |
| El plugin de demostración es un plugin nuevo, no el del autor | El contenido real de sus plugins es de sus usuarios | Se ve el patrón, no el producto real |
| MCP sin modelo | Costo cero por cliente externo | El cliente usa su propio modelo, y las reglas del oficio viajan en las descripciones de las herramientas y en las skills |

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El modelo responde derecho a pesar de todo | Alto | Clasificación previa, negativa fija, regla «no contiene normas ni plazos» en la guarda de salida y casos que bloquean (FR-4914) |
| Error de unidades en Obra | Alto | Normalización con reglas antes del esquema, `OBRA_LIMITS`, conversión mostrada y confirmación del visitante |
| Alguien lee la ficha como promesa de horas reales | Medio | El supuesto se marca en pantalla y en la ficha (P-4902) |
| El cambio de la A4 rompe la `O1` | Medio | La `O1` solo importa contratos públicos de la A4, y una prueba de contrato los cubre |
| Pyodide sin permiso | Bajo | La entrada queda validada y el estimado pendiente, como en la A4 |

## Validación

- `npx vitest run tests/unit/professions`.
- `npm run lint` y `npm run typecheck`.
- `npx playwright test tests/e2e/professions.spec.ts` con el simulador, en escritorio y 390×844.
- Sin corridas reales de evals sin permiso del autor. Nunca la suite exhaustiva.
- Las pruebas existentes de la A4 (`tests/unit/x3/despacho-data.test.ts`, `obra-data.test.ts`, `obra-engine.test.ts` y
  `obra-python.test.ts`) se corren una vez al integrar, para confirmar que no cambió nada.

## Seguimiento de complejidad

Sin violaciones de la constitución.
