# Plan de implementación: 043 — Tres proveedores y arena de modelos

**Línea**: L4 | **Fecha**: 26 de noviembre de 2026 | **Spec**: [spec.md](./spec.md) | **Paraguas**:
[041](../041-pruebame-en-vivo/spec.md)

## Resumen

Un puerto de servidor (`lib/ai/providers/`) da a toda la línea 041 una sola forma de pedirle JSON validado a Gemini,
a Claude o a OpenAI, o un turno con herramientas (`callTools`). Hace cuatro cosas:
- enruta por costo;
- cae al siguiente proveedor si uno falla;
- reserva el gasto en un libro mensual (`lib/ai/budget/`) con techo de 25 USD;
- devuelve qué modelo respondió de verdad, sus tokens, su latencia y su costo.

La arena del AI Lab (tarjeta A10) usa el puerto para comparar los tres proveedores en seis tareas fijas, con
resultados pregenerados por el autor y corridas en vivo con cuenta.

## Contexto técnico

- **Lenguaje:** TypeScript estricto en Next.js 16 y React 19, App Router.
- **Dependencias:**
  - **Nuevas:** `@anthropic-ai/sdk` (SDK oficial de Claude) y `openai` (SDK oficial de OpenAI). Se justifican contra
    `fetch`, que ya da la plataforma:
    - errores tipados (429, 5xx, rechazos) para decidir el fallback sin comparar textos;
    - reintentos y tiempos configurables;
    - tipos de las respuestas, incluido `stop_reason`;
    - salida estructurada documentada.

    Gemini sigue con el `fetch` que ya existe en `lib/ai/generate.ts`. Antes de escribir el adaptador de OpenAI se lee
    la documentación de su SDK: no se adivina su API.
  - **Reutilizadas:**
    - `zod` 4 (ya instalado), con su conversión a JSON Schema;
    - `lib/ai/generate.ts` (`generateJson`, `GeminiError`, `googleReason`);
    - `lib/ai/gemini.ts` (`geminiKey`, `agentMode`);
    - `lib/ai/agent/usage.ts` (`parseUsage`);
    - `lib/ai/evals/grade.ts`;
    - `lib/auth/accounts.ts` (`getAccountState`);
    - `lib/ai/lab/route.ts` (`json`, `PRIVATE`);
    - `lib/security/request.ts` (`requestIpHash`).
- **Almacenamiento:** la MongoDB del sitio, por la capa de datos. Colección nueva `ai_budget` con un documento por mes.
  Sin infraestructura nueva. En local y en pruebas, el repo en memoria.
- **Pruebas:** Vitest con dobles de los tres proveedores y respuestas grabadas. Ninguna prueba llama a una API real.
- **Plataforma:** funciones de Vercel (Node), con un tiempo máximo de 25 s por llamada.
- **Metas de rendimiento:**
  - la tarjeta con lo pregenerado cumple el principio V (LCP de 2,5 s o menos e INP de 200 ms o menos en el perfil
    móvil);
  - la comparación en vivo termina en el tiempo del proveedor más lento, porque las tres van en paralelo.
- **Restricciones:**
  - el principio VIII: dos llaves nuevas con sus cuatro condiciones y ninguna infraestructura que operar;
  - el techo mensual de 25 USD;
  - no tocar `lib/ai/generate.ts` ni los experimentos actuales.

## Verificación de la constitución

| Principio | Cómo se cumple |
|---|---|
| **I. Evolución, no reemplazo** | Es una tarjeta nueva del AI Lab y una tarjeta nueva en el panel de gasto. No cambia rutas ni secciones aprobadas. Los experimentos actuales no migran |
| II. Glass sobre movimiento | La tarjeta usa los tokens de glass del laboratorio, sin valores sueltos |
| **III. Seguridad real** | Las llaves quedan en el servidor. Las rutas revisan el origen, el límite por cuenta y el diario, y validan la entrada con Zod. Los errores borran textos con forma de llave. Si no se puede reservar, el puerto falla cerrado. La entrada libre llega al juez como datos delimitados |
| IV. Contenido como datos | Las tareas, la rúbrica del juez, los modelos, los precios y los resultados pregenerados viven versionados en el repo. La tarjeta se renderiza en el servidor con lo pregenerado |
| V. Rendimiento y accesibilidad | Sin JavaScript pesado para lo pregenerado, tabla con encabezados, teclado completo y columnas apiladas en el celular |
| VI. Calidad verificable | Pruebas de contrato del puerto y del libro, pruebas del enrutamiento, del fallback y del juez. El gate de calidad completo antes de integrar |
| **VII. Propiedad exclusiva** | La L4 solo toca sus rutas (tabla de abajo). Lo compartido entra como enmienda del integrador, antes de arrancar, y se congela con la etiqueta `043-base-congelada` |
| **VIII. Simplicidad operativa** | Dos variables nuevas con sus cuatro condiciones (tabla del README, solo servidor, modo apagado y simulador, tope por visitante más techo mensual más límite en cada consola). Sin servidores, colas ni bases nuevas: una colección más en la Mongo que ya existe. Las dos dependencias nuevas están justificadas arriba |

No hay violaciones que justificar.

## Rutas propias de la línea

| Ruta | Para qué |
|---|---|
| `lib/ai/providers/**` | Puerto, adaptadores, modelos por tarea, enrutador, simulador y consentimiento de servidor |
| `lib/ai/budget/**` | Configuración del techo, reserva y ajuste, resumen del mes |
| `app/api/ailab/arena/**` | `POST /api/ailab/arena` (corrida en vivo) |
| `components/ailab/arena/**` | Tarjeta de la arena, columnas, caja de cristal, tarjeta del tope mensual para el panel |
| `content/ailab/arena/**` | Tareas, rúbrica del juez, resultados pregenerados y estación de la ruta |
| `content/i18n/{es,en}/arena.json` | Textos de la arena |
| `tests/unit/providers/**`, `tests/unit/arena/**` | Pruebas |

**Ampliación de rutas que pide la línea:**
- `components/ai/providers/**`, para el aviso de consentimiento de proveedores y la insignia de proveedor. La 046, la
  048 y la 050 los reutilizan, y no deben vivir dentro de la arena. Si el integrador no la aprueba, quedan en
  `components/ailab/arena/` y las otras líneas los importan de ahí.
- `evals/arena.eval.ts`, la corrida pregenerada. Sigue la convención de `evals/agent.eval.ts` (la 032): es la carpeta
  que lee `vitest.evals.config.ts` para las corridas que gastan.

## Enmiendas a archivos compartidos

Las aplica el integrador antes de arrancar la L4 y se congelan con la etiqueta `043-base-congelada`.

| ID | Archivo | Cambio |
|---|---|---|
| E-4301 | `package.json` y su lock | Dependencias `@anthropic-ai/sdk` y `openai` con versión exacta. Scripts: `"arena:run": "vitest run --config vitest.evals.config.ts evals/arena.eval.ts"`, y `evals:agent` se acota a `evals/agent.eval.ts`, para que correr las evals de Mini Cherced no dispare también la arena ni las corridas de otras líneas |
| E-4302 | `vitest.evals.config.ts` | Cargar de `.env.local` las variables con prefijo `GEMINI_`, `ANTHROPIC_` y `OPENAI_` (hoy solo `GEMINI_`) y pasarlas a `env`, sin imprimirlas. Sirve también para las evals de la 046, la 048, la 049 y la 050 |
| E-4303 | `lib/ai/pricing.ts` | Precios de Claude y de OpenAI en `MODEL_PRICES`, con `validUntil`. `PRICE_SOURCES` por proveedor (URL y fecha de consulta) sin cambiar los precios ni las firmas de Gemini |
| E-4304 | `lib/ai/models.ts` | `TYPICAL_USE.arena` (una comparación) para el panel de gasto |
| E-4305 | `lib/ai/spend.ts` | Línea `arena` en `LINES` |
| E-4306 | `lib/security/rate-limit.ts` | `arena: { limit: 3, windowMs: 24 h }` y `arenaDaily: { limit: 10, windowMs: 24 h }` |
| E-4307 | `lib/data/types.ts`, `lib/data/memory/*`, `lib/data/mongo/*` (`collections.ts`, `indexes.ts`, repo nuevo) y `lib/data/index.ts` | `BudgetRepo` (contrato abajo) y `budget` en `Repos`. Colección `ai_budget` con índice TTL en `expiresAt`, a 400 días |
| E-4308 | `content/types.ts` | `'A10'` en `LAB_EXPERIMENT_IDS` y `'providers'` en `LAB_RUNS_IN` |
| E-4309 | `content/ailab/catalog.ts` y `content/i18n/{es,en}/ailab.json` | Tarjeta A10 «Arena de modelos» / "Model arena", tema `agents`, `runsIn: 'providers'`, límite 3 por día |
| E-4310 | `components/ailab/shell/demo-loader.tsx` y `components/ailab/shell/RunsInBadge.tsx` | Registro de la demo A10 y texto de la insignia «Corre en Google, Anthropic y OpenAI» |
| E-4311 | `lib/ai/evals/grade.ts` | Extraer `gradeExpect(expect, answer)` de `gradeAnswer` sin cambiar su comportamiento. Las pruebas actuales de `tests/unit/evals/` deben seguir pasando |
| E-4312 | `app/[lang]/inbox/(panel)/spend/page.tsx` | Montar la tarjeta del tope mensual que entrega la L4 |
| E-4313 | `README.md` | Filas de `ANTHROPIC_API_KEY` y `OPENAI_API_KEY` en la tabla de variables, con su guía |
| E-4314 | `content/i18n/{es,en}/privacy.json` | Anthropic y OpenAI como proveedores que reciben el texto cuando se usa la arena (o la 046, la 048 y la 050) |
| E-4315 | `content/ailab/route/index.ts` | Sumar `arenaStation` al registro de estaciones, después de integrada la L1 |

## Contratos que produce

### Puerto de modelos (`lib/ai/providers/port.ts`, solo servidor)

El contrato de la 041, con tres campos más que no rompen nada: `data` (el objeto ya validado), `attempts` (para la
caja de cristal) y `line` (quién paga en el libro).

```ts
export type ProviderId = 'gemini' | 'claude' | 'openai' | 'simulator'
export type ModelTask = 'cheap' | 'balanced' | 'strong'
export type BudgetLine = 'arena' | 'gates' | 'kb' | 'professions' | 'pyme'

export type GenerateJsonInput<T> = {
  task: ModelTask
  line: BudgetLine
  system: string
  prompt: string
  schema: z.ZodType<T>
  prefer?: ProviderId
  exclude?: readonly ProviderId[]
  maxOutputTokens?: number
  estimate?: { inputTokens: number; outputTokens: number }
  simulate?: () => T
}

export type ProviderAttempt = {
  provider: ProviderId
  requestedModel: string
  model: string | null
  outcome: 'ok' | 'error' | 'refusal' | 'invalid' | 'skipped'
  reason: string | null
  latencyMs: number
  usage: { inputTokens: number; outputTokens: number } | null
  costUsd: number
}

export type GenerateJsonResult<T> = {
  data: T
  text: string
  provider: ProviderId
  model: string
  usage: { inputTokens: number; outputTokens: number }
  latencyMs: number
  costUsd: number
  attempts: ProviderAttempt[]
}

export function generateJson<T>(input: GenerateJsonInput<T>): Promise<GenerateJsonResult<T>>
export function availableProviders(): ProviderId[]
export function providersMode(): 'live' | 'local' | 'off'
export function assertMonthlyBudget(estimateUsd: number): Promise<void>
export class BudgetExhaustedError extends Error { readonly month: string; readonly capUsd: number }
export class ProvidersUnavailableError extends Error { readonly attempts: ProviderAttempt[] }
```

### Herramientas por turno (`callTools`, en el mismo archivo)

Lo pidió la 050. La 048 y la 049 también pueden usarlo.

```ts
export type PortTool = { name: string; description: string; inputSchema: z.ZodType<unknown> }

export type ToolCall = { id: string; name: string; args: unknown }

export type PortMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; toolCalls: ToolCall[]; native?: NativeTurn }
  | { role: 'tool'; results: Array<{ callId: string; content: string; isError?: boolean }> }

export type NativeTurn = { provider: ProviderId; model: string; content: unknown }

export type CallToolsInput<T> = Omit<GenerateJsonInput<T>, 'prompt'> & {
  messages: readonly PortMessage[]
  tools: readonly PortTool[]
}

export type CallToolsResult<T> = Omit<GenerateJsonResult<T>, 'data'> & {
  data: T | null
  toolCalls: ToolCall[]
  turn: PortMessage & { role: 'assistant' }
}

export function callTools<T>(input: CallToolsInput<T>): Promise<CallToolsResult<T>>
```

- **Qué devuelve un turno:** o llamadas a herramientas (`toolCalls` con algo y `data` en `null`) o la respuesta final
  validada contra `schema` (`toolCalls` vacío).
- **El ciclo:** quien llama ejecuta las herramientas, pide la aprobación humana cuando cambian algo, suma `turn` y los
  resultados (`role: 'tool'`) a `messages` y vuelve a llamar.
- **Validación:** el puerto valida los `args` de cada llamada con el esquema de su herramienta. Una llamada inválida
  vuelve al modelo como error una vez y, si se repite, cuenta como intento fallido.
- **`native`:** es el contenido del turno tal como lo devolvió el proveedor. Si el turno siguiente va al mismo
  proveedor, se manda sin cambios; eso conserva el razonamiento de Claude, como pide su API. Si el fallback cambia de
  proveedor, se usa la forma normalizada y `native` se ignora.
- **Claude:**
  - `tool_choice` automático, sin forzar (forzar da 400 en Opus 5.5 y Sonnet 5.5);
  - `strict: true` en cada herramienta;
  - todos los resultados de llamadas en paralelo en un solo mensaje.
- **Gemini:** `functionDeclarations`, como ya hacen `lib/ai/agent/tools.ts` y `lib/ai/evals/run.ts`. Este caso no
  pasa por `lib/ai/generate.ts`: el adaptador hace su propio pedido con el mismo `GEMINI_API_BASE`.
- **OpenAI:** las llamadas a funciones de su SDK, según su documentación, sin adivinar la API.

### Modo del puerto

- `providersMode()` sigue la regla de `agentMode()`:
  - `live` si hay al menos una llave;
  - `local` si la capa de datos está en memoria (desarrollo sin Mongo);
  - `off` en cualquier otro caso.
- En `local`, responde el simulador con `simulate()`. Si el pedido no lo trae, devuelve un error claro.
- `assertMonthlyBudget` solo mira. La reserva real la hace `generateJson` por dentro, por cada intento.

### Libro mensual (`BudgetRepo`, en la capa de datos)

```ts
export type BudgetMonth = {
  month: string
  totalMicroUsd: number
  byProvider: Partial<Record<'gemini' | 'claude' | 'openai', number>>
  byLine: Partial<Record<BudgetLine, number>>
  warnedAt: Date | null
  cutAt: Date | null
}

export interface BudgetRepo {
  reserve(month: string, microUsd: number, capMicroUsd: number): Promise<{ ok: boolean; totalMicroUsd: number }>
  settle(month: string, reservedMicroUsd: number, actualMicroUsd: number, provider: 'gemini' | 'claude' | 'openai', line: BudgetLine): Promise<BudgetMonth>
  mark(month: string, field: 'warnedAt' | 'cutAt', now: Date): Promise<boolean>
  get(month: string): Promise<BudgetMonth | null>
}
```

### Gasto del mes para otras líneas (`lib/ai/budget/spend.ts`, solo servidor)

La 045 (tablero de ingeniería) lo consume para mostrar el gasto del mes sin datos personales:

```ts
export function monthlySpend(now: Date): Promise<{
  month: string
  usd: number
  targetUsd: number
  capUsd: number
  byProvider: Record<ProviderId, number>
}>
```

- `month` va como `'2026-11'` (UTC).
- `usd` y `byProvider` salen del libro en USD, redondeados a 4 decimales. `simulator` siempre vale 0.
- `targetUsd` y `capUsd` salen de `lib/ai/budget/config.ts` (10 y 25).
- Sin libro del mes, devuelve ceros. Si la capa de datos no responde, lanza: quien lo consume decide qué mostrar.
- No trae desglose por línea ni nada por visitante.

### Libro mensual: reglas de las operaciones

- `reserve` es un `findOneAndUpdate` condicionado a `totalMicroUsd <= cap - microUsd`, con `$inc`. Si la condición
  falla, no reserva.
- `settle` suma la diferencia entre lo real y lo reservado, más el desglose.
- `mark` solo escribe si el campo está vacío. Así el aviso sale una vez por mes.

### Estación de la ruta (consume el contrato de la 042)

`content/ailab/arena/station.ts` exporta `arenaStation: RouteStation` con:
- `id: 'arena'`;
- `proof: 1` y `alsoProves: [3]`;
- `minutes: 2`;
- `href: '/{lang}/ai-lab#' + labCardId('A10')`;
- `spec: '043'`.

### Lo que consume

- `RouteStation` de la 042;
- `getAccountState` de la 038;
- `gradeExpect` (E-4311);
- `MODEL_PRICES` y `PRICE_SOURCES` (E-4303);
- `hitRateLimit` (E-4306);
- `getRepos().budget` (E-4307).

## Decisiones de diseño

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| Reservar antes de llamar y ajustar después, con una actualización condicionada en Mongo | Un contador que solo suma al final se pasa del techo cuando llegan varios pedidos a la vez | Una escritura más por llamada y un costo estimado que puede quedar corto si el modelo razona de más; el ajuste lo corrige en el libro |
| Un modelo sin precio en la tabla no se llama | Sin precio no se puede reservar, y el techo dejaría de ser un techo | Probar un modelo nuevo exige primero poner su precio con fecha |
| El juez siempre es de otro proveedor | Los estudios de LLM-as-judge documentan el sesgo de un modelo a favor de sus propias respuestas (Zheng y otros, 2023, MT-Bench) | Si solo hay un proveedor activo, no hay nota del juez y la pantalla lo dice |
| Lo pregenerado primero y lo en vivo con cuenta | El entrevistador ve todo en dos minutos sin gastar, y el gasto queda atado a una persona con límite | La tarea libre exige entrar con Google |
| Los experimentos actuales no migran | Construir sobre lo construido: cero riesgo para lo que ya funciona y está aprobado | Dos caminos para llamar a Gemini durante un tiempo |
| Sin streaming; herramientas solo por turno (`callTools`) | `generateJson` y `callTools` cubren las cuatro líneas que dependen del puerto con el menor contrato posible. El ciclo y la aprobación humana quedan en quien llama, que es donde se decide qué acción se aprueba | La arena muestra cada columna completa, no palabra por palabra, y cada agente escribe su propio ciclo corto |
| Mes en UTC | Es como facturan los proveedores, y evita dos relojes | El corte es a las 7 p. m. del último día en Colombia |
| SDK oficial para Claude y OpenAI | Errores tipados para decidir el fallback y salida estructurada documentada | Dos dependencias más en las funciones del servidor; se mide el arranque en frío |

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Los SDK suben el tiempo de arranque en frío de las funciones | Medio | Se importan solo en las rutas que los usan (adaptador cargado bajo demanda) y se mide en la vista previa |
| La API de Claude cambia: `temperature` da 400 desde la versión `2026-10-21` y Opus 5.5 no permite apagar el razonamiento | Medio | El puerto no expone `temperature` y controla el gasto con el esfuerzo por tarea. Hay pruebas con respuestas grabadas |
| Los modelos y precios de OpenAI no se conocen hoy | Medio | Se eligen al implementar con su fecha (P-4301). Sin precio, no se llaman |
| El razonamiento de Claude hace que el costo real pase al estimado | Bajo | El ajuste lo corrige en el libro. La estimación de cada tarea se recalibra con la primera corrida pregenerada |
| Una llave queda en un mensaje de error o en una traza | Alto | Se borran los patrones de llave de los tres proveedores en todo mensaje que sale del adaptador. Hay una prueba con llaves falsas |
| La arena se lee como un benchmark | Bajo | Aviso fijo: «seis tareas, no es un benchmark», y la fecha de cada corrida |
| El autor no crea la colección `ai_budget` | Medio | Sin la colección, el puerto falla cerrado en producción y la arena queda en lo pregenerado. El panel lo dice |

## Validación

Solo pruebas de lo que cambia, sin la suite exhaustiva y sin gastar API real:

```bash
npx vitest run tests/unit/providers tests/unit/arena tests/unit/evals
```

```bash
npm run lint
```

```bash
npm run typecheck
```

- No hay archivo e2e propio en las rutas de la L4. La tarjeta se revisa a mano en `next dev` con el simulador y en el
  celular (390×844 y WebKit) contra la última vista aprobada del AI Lab.
- `npm run arena:run` gasta API real: lo corre el autor, nunca una prueba ni un agente sin su permiso.

## Seguimiento de complejidad

No aplica: no hay violaciones de la constitución.
