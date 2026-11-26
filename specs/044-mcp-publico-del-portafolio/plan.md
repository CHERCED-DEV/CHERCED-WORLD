# Plan: 044 — MCP público del portafolio

**Spec:** [spec.md](./spec.md) | **Fecha:** 26 de noviembre de 2026 | **Línea:** L2, ola 1 | **Rama de la línea:**
`lane/l2-mcp` en `.worktrees/l2-mcp`

## Resumen

Un route handler de Next.js en `app/api/mcp/route.ts` atiende JSON-RPC por Streamable HTTP, sin sesión y con
respuestas JSON. La lógica del protocolo vive en `lib/mcp/core/`, reutilizable por las líneas 048 y 049. Las
herramientas del portafolio viven en `lib/mcp/servers/portafolio/` y solo leen el índice público y el contenido
versionado, que ya existen. El encaje con una vacante reusa el simulador determinista de la 029. La página
`/{lang}/mcp` lee el catálogo con `tools/list` y trae un probador en el navegador.

## Contexto técnico

- **Lenguaje:** TypeScript estricto en el runtime Node de las funciones de Vercel (`export const runtime = 'nodejs'`),
  porque el límite por IP usa el driver de MongoDB.
- **Dependencias nuevas:** ninguna en v1 (P-4401):
  - el protocolo que hace falta es un subconjunto chico: seis métodos, sin sesión, sin SSE y sin lotes;
  - Zod 4 (ya en `package.json`) valida las entradas y genera el JSON Schema con `z.toJSONSchema`;
  - el índice ya existe (`buildSearchIndex`) y el buscador también (`createGlassBox`).
- **Alternativa evaluada:** el SDK oficial de TypeScript del protocolo. Se descarta para v1 porque agrega una
  dependencia y una capa de transporte pensada para sesiones y SSE que aquí no se usan. Queda como salida si un
  cliente principal no conecta (P-4401), sin cambiar el contrato `createMcpHandler`.
- **Almacenamiento:** ninguno nuevo. El límite por IP usa el repositorio `rateLimits` que ya existe (`getRepos()`).
- **Pruebas:** Vitest para el protocolo, las herramientas, la guarda de privacidad (por imports) y la batería de
  filtración. Un e2e de la página con el probador.
- **Plataforma:** Vercel, función con el índice en memoria del módulo (se arma una vez por instancia y por idioma).
- **Metas de rendimiento:** `tools/call` por debajo de 300 ms en p95 sin arranque en frío (SC-4404). La página cumple
  el principio V.
- **Restricciones:** solo lectura, sin datos personales, sin modelo y sin infraestructura nueva.

## Verificación de la constitución

| Principio | Cómo se cumple |
|---|---|
| **I. Evolución, no reemplazo** | Ruta API nueva y página nueva. Nada existente cambia de forma |
| II. Glass sobre movimiento | La página usa los tokens de glass y los componentes del AI Lab |
| **III. Seguridad real** | Entrada validada en el servidor con Zod; límite por IP y global; cuerpo de 64 KB como máximo; sin cookies ni credenciales; solo información pública (FR-4406), con una prueba de imports y una batería de filtración que rompen el build si algo privado se cuela |
| IV. Contenido como datos | Las herramientas leen el índice y `content/`, la única fuente de verdad. La página renderiza el catálogo en el servidor |
| V. Rendimiento y accesibilidad | El probador se opera con teclado y anuncia sus resultados; el JSON se lee con contraste AA |
| VI. Calidad verificable | Pruebas del protocolo (contrato), de cada herramienta, de la guarda de imports y de filtración. El contrato `lib/mcp/core` tiene pruebas propias, porque lo consumen la 048 y la 049 |
| **VII. Propiedad exclusiva** | Rutas propias en la tabla de abajo. Las acciones de límite, el namespace de i18n, el sitemap y el acceso desde el AI Lab van como enmiendas E-44xx |
| **VIII. Simplicidad operativa** | Sin dependencias nuevas, sin variables de entorno, sin infraestructura y sin costo de modelos |

## Rutas propias de la línea

| Ruta | Para qué |
|---|---|
| `app/api/mcp/route.ts` | `POST`, `GET` (405), `DELETE` (405) y `OPTIONS` (CORS) |
| `lib/mcp/core/handler.ts` | `createMcpHandler`: lectura del cuerpo, JSON-RPC, despacho y límites |
| `lib/mcp/core/protocol.ts` | Versiones aceptadas con su fecha de consulta, códigos de error y formas de los mensajes |
| `lib/mcp/core/types.ts` | `McpTool`, `McpPrompt`, `McpContext` y `McpToolResult` |
| `lib/mcp/core/schema.ts` | Zod a JSON Schema para `inputSchema` y `outputSchema` |
| `lib/mcp/core/limit.ts` | El único punto que toca la base: el límite por IP y el global |
| `lib/mcp/servers/portafolio/index.ts` | El servidor: nombre, versión, instrucciones, herramientas y prompts |
| `lib/mcp/servers/portafolio/tools/*.ts` | Una herramienta por archivo |
| `lib/mcp/servers/portafolio/prompts.ts` | `interview_camilo` y `fit_for_role` |
| `lib/mcp/servers/portafolio/sources.ts` | URL absoluta y título de cada fuente |
| `app/[lang]/mcp/page.tsx` y `app/[lang]/mcp/opengraph-image.tsx` | La página |
| `components/mcp/**` | `McpConnect`, `McpCatalog`, `McpTester` y sus estilos |
| `content/mcp/clients.ts` | Pasos por cliente, con la fecha en que se probó cada uno |
| `content/mcp/station.ts` | La estación `mcp-en-tu-agente` para la ruta de la 042 |
| `content/mcp/leak-battery.ts` | La batería de filtración |
| `content/i18n/{es,en}/mcp.json` | Las etiquetas de la página |
| `tests/unit/mcp/**` | Pruebas unitarias, de contrato y de filtración |
| `tests/e2e/mcp/mcp.spec.ts` | El e2e de la página. El repo agrupa los e2e en carpetas por área, así que va en `tests/e2e/mcp/` |

## Enmiendas a archivos compartidos

Las aplica el integrador antes de arrancar la línea y se congelan con la etiqueta `044-base`.

| Id | Archivo | Cambio |
|---|---|---|
| E-4401 | `lib/security/rate-limit.ts` | `mcp: { limit: 60, windowMs: 10 * MINUTE }`, `mcpMatch: { limit: 10, windowMs: 60 * MINUTE }` y `mcpDaily: { limit: 3000, windowMs: 24 * 60 * MINUTE }` |
| E-4402 | `lib/i18n/config.ts` y `lib/i18n/server.ts` | Namespace `mcp` y sus dos cargadores |
| E-4403 | `app/sitemap.ts` | `/{lang}/mcp` en los dos idiomas |
| E-4404 | `components/ailab/shell/LabPage.tsx` | Un enlace de texto a `/{lang}/mcp` junto al acceso a la ruta de la 042 (misma línea, sin otra forma nueva) |
| E-4405 | `content/ailab/route/index.ts` (después de integrar la L1) | Sumar `content/mcp/station.ts` a `routeStations` |
| E-4406 | `README.md` | Una sección corta «MCP público» con la URL y el enlace a la página. Sin variables nuevas |

## Contratos que produce y consume

**Produce** (se congela con la etiqueta `044-mcp` al integrarse; lo consumen la 048 y la 049):

```ts
export type McpContext = {
  lang: Locale
  origin: string
  requestId: string | number
  protocolVersion: string
  signal: AbortSignal
}

export type McpSource = { title: string; url: string }

export type McpToolResult<O> = { text: string; structured?: O; sources: McpSource[] }

export type McpTool<I, O> = {
  name: string
  title: string
  description: string
  inputSchema: z.ZodType<I>
  outputSchema?: z.ZodType<O>
  readOnly: true
  limit?: RateLimitAction
  handler: (args: I, ctx: McpContext) => Promise<McpToolResult<O>>
}

export type McpPrompt = {
  name: string
  title: string
  description: string
  arguments: Array<{ name: string; description: string; required: boolean }>
  render: (args: Record<string, string>, ctx: McpContext) => Array<{ role: 'user' | 'assistant'; text: string }>
}

export function createMcpHandler(options: {
  name: string
  version: string
  instructions: string
  tools: ReadonlyArray<McpTool<unknown, unknown>>
  prompts?: ReadonlyArray<McpPrompt>
  limits: { visitor: RateLimitAction; daily: RateLimitAction }
}): { POST: (request: Request) => Promise<Response>; GET: () => Response; DELETE: () => Response; OPTIONS: () => Response }
```

- `readOnly: true` es un tipo literal: una herramienta que escribe no compila. Una línea futura que necesite escribir
  pide una enmienda del contrato, con su revisión de seguridad.
- `handler` lanza `McpToolError(message)` para un `isError: true` controlado. Cualquier otra excepción se registra con
  `logServerError` sin argumentos y vuelve como un error genérico.
- `limit` es opcional por herramienta (`mcpMatch` para el encaje). Se cuenta además del límite del servidor.
- `sources` vacío solo en errores. La prueba de contrato lo exige.

**Consume** (sin modificarlos): `buildSearchIndex` de `lib/search/build-index.ts`, `SearchIndex` y los facts de
`lib/search/types.ts`, `createGlassBox` de `lib/ailab/search/glassbox.ts`, `simulateMatch` de
`lib/ai/match/simulator.ts`, `VACANCY_MIN` y `VACANCY_MAX` de `lib/ai/match/config.ts`, `featuredPitches` de
`content/pitches.ts`, `hitRateLimit` y `RateLimitAction` de `lib/security/rate-limit.ts`, `requestIpHash` de
`lib/security/request.ts`, `logServerError` de `lib/security/log.ts`, y `routeStations` de la 042 si ya está integrada.

## Decisiones de diseño

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| Sin sesión, respuesta JSON y sin SSE | Una función serverless no guarda estado entre llamadas. Ninguna herramienta necesita streaming ni notificaciones del servidor | No hay notificaciones ni progreso. Si una herramienta tardara, no se podría avisar a mitad |
| Núcleo propio en vez del SDK | El subconjunto es chico y el repo ya tiene Zod. En la entrevista se puede explicar cada mensaje del protocolo | Hay que seguir las revisiones del protocolo a mano; la constante de versiones lleva su fecha de consulta |
| Encaje determinista, sin modelo | Cero costo y cero riesgo de inventar evidencia. Ya está probado en la 029 | El análisis es más pobre que el de Gemini; la respuesta lo dice y enlaza al A6 |
| Nombres de herramientas en inglés | Los clientes los muestran y los modelos los eligen mejor | El público hispanohablante ve nombres en inglés; las descripciones y el contenido siguen el idioma pedido |
| Guarda de privacidad por imports, además de la batería | Una prueba que falla si `lib/mcp/servers/**` importa `lib/data` (salvo `lib/mcp/core/limit.ts`) corta la filtración antes de que exista | Una herramienta que algún día necesite la base pide una enmienda |
| CORS abierto sin credenciales | Los probadores del protocolo en el navegador necesitan CORS, y no hay cookies ni datos privados que proteger | Cualquier página puede llamar al servidor; el límite por IP lo acota |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Un cliente principal exige SSE o sesión | Prueba con los tres clientes de SC-4401 antes de integrar. Si falla, P-4401 cambia el núcleo por el SDK detrás del mismo contrato |
| El protocolo saca una revisión nueva | La constante de versiones tiene fecha. Al responder, el servidor negocia la versión más reciente que soporta |
| Abuso o scraping del MCP | Límite por IP, tope global diario y 503 si la base no responde |
| Filtración de algo privado por el índice | FR-4406, la guarda de imports, la batería de filtración en cada build y los `LEAKS` de la 032 |
| El índice crece y la respuesta se vuelve enorme | Límite de 10 resultados por búsqueda y recortes de 220 caracteres, como `GLASS_FRAGMENT_MAX` |
| Arranque en frío lento | El índice se arma de forma perezosa una vez por instancia; SC-4404 no cuenta el arranque en frío y la página lo explica |

## Validación

Solo lo de esta línea, sin gastar API y sin la suite exhaustiva:

```bash
npx vitest run tests/unit/mcp
```

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npx playwright test tests/e2e/mcp/mcp.spec.ts
```

Más la prueba manual de conexión de SC-4401 contra la vista previa de Vercel, con la fecha de cada cliente anotada en
`content/mcp/clients.ts`.

## Seguimiento de complejidad

No aplica: no viola ningún principio.
