# 041 — Plan de la línea: cómo se orquestan las diez specs

**Rama del upstream:** `claude/cherced-world-upstream-spec-acd0fd`, que se entrega a `dev` · **Fecha:** 26 de noviembre
de 2026 · **Spec:** [spec.md](./spec.md)

## Resumen

Diez specs hijas (042 a 051), cada una con su propio `spec.md`, `plan.md` y `tasks.md`. Cada una es una línea de trabajo
que corre como subagente en su propio worktree y le reporta a la sesión principal, que orquesta e integra (entrevista,
pregunta 9). El autor aprueba spec por spec (pregunta 10). Una línea arranca solo con su spec aprobada y sus
dependencias integradas.

Este plan cubre lo que no le pertenece a ninguna spec hija:
- el modelo de trabajo por líneas;
- las rutas exclusivas;
- la base de cada ola y los contratos que se congelan;
- el orden de integración, la entrega a `dev` y los riesgos de la línea completa.

## Contexto técnico

- **Stack:** Next.js 16, React 19 con App Router y TypeScript estricto, en el proyecto de Vercel que ya existe.
- **Datos:** el MongoDB existente, solo desde la capa de datos del servidor. En pruebas, el repo en memoria; nunca la
  base de producción.
- **Modelos:** Gemini (la llave ya existe), Claude y OpenAI (dos llaves nuevas de la 043), detrás de un puerto común.
  Además, modelos en el navegador donde ya se usan (ONNX Runtime Web, transformers.js).
- **MCP:** Streamable HTTP sin estado en route handlers de Next.js (044, 048, 049). Ningún servidor propio.
- **Pruebas:** Vitest para lo que cambia, lint, typecheck y, si hay interfaz, un solo archivo e2e de Playwright con
  máximo 2 workers. Nunca la suite exhaustiva. Ninguna prueba gasta API real: se usan simuladores y dobles.
- **Restricciones:**
  - no hay infraestructura nueva que operar;
  - el despliegue es un push;
  - los presupuestos del principio V se mantienen;
  - las secciones aprobadas no se tocan.

## Verificación de la constitución

| Principio | Cómo se cumple en la línea |
|---|---|
| **I. Evolución, no reemplazo** | Todo es aditivo y en rutas nuevas (`/ai-lab/ruta`, `/mcp`, `/ingenieria`, tarjetas nuevas del AI Lab). Las rutas existentes no cambian. Las entradas nuevas son enlaces de texto en lugares existentes, sin rehacer secciones aprobadas (FR-4108, P-4102) |
| II. Glass sobre movimiento | Las interfaces nuevas usan los tokens de glass existentes. Ningún valor suelto |
| **III. Seguridad real** | Las llaves quedan en el servidor. Los MCP son de solo lectura sobre datos públicos. Toda entrada pública se valida y tiene límite. Las acciones de agentes piden aprobación humana. Cada agente lleva evals de red team (FR-4105, FR-4109) |
| IV. Contenido como datos | Las baterías de evals, las estaciones, los documentos ficticios y los catálogos son contenido versionado, en ES y EN |
| V. Rendimiento y accesibilidad | Cada línea revisa teclado, lector de pantalla y celular. Lo pesado va en Worker o con descarga consentida (047) |
| VI. Calidad verificable | Cada historia tiene pruebas de sus escenarios críticos. Los contratos compartidos (estación, MCP, puerto de modelos) tienen prueba de contrato |
| **VII. Líneas con propiedad exclusiva** | Rutas disjuntas por línea (tabla de abajo). Los archivos compartidos son de la base de cada ola y se congelan con una etiqueta antes de arrancar las líneas. Un cambio posterior es una enmienda registrada |
| **VIII. Simplicidad operativa** | Cero servidores, colas o bases nuevas. Dos llaves nuevas con sus cuatro condiciones. El techo mensual total de 25 USD va en la capa de datos existente (043). Cada dependencia nueva se justifica en el plan de su spec |

Hay una enmienda MINOR propuesta, que no es requisito para arrancar la ola 1:
[enmienda-constitucion.md](./enmienda-constitucion.md).

## Modelo de trabajo por líneas

1. **Base de la ola (Fn).** La hace la sesión principal antes de lanzar las líneas de la ola:
   1. aplica las enmiendas a archivos compartidos que piden las specs aprobadas de esa ola;
   2. corre lint, typecheck y las pruebas de lo tocado;
   3. hace commit y pone la etiqueta `041-base-olaN`. Ese es el contrato congelado.
2. **Worktree por línea.** La sesión principal lo crea antes de lanzar la línea:
   1. `git worktree add -b lane/0NN-<slug> .worktrees/LN-<slug> 041-base-olaN`;
   2. el junction de `node_modules` al del checkout principal se crea antes de que arranque el subagente.

   El brief de cada línea dice en su primera línea: «tu `node_modules` es un junction al del principal: nunca corras
   `npm ci` ni `npm install`». Una dependencia nueva se pide así: la línea corre `npm install <pkg>@<ver> --save-exact
   --package-lock-only` y la principal la instala en la carpeta compartida con `--no-save`.
3. **Subagente en segundo plano.** Trabaja solo dentro de su worktree y de sus rutas:
   - hace commit de avance en su rama al terminar cada fase de su `tasks.md`, para que el límite semanal no se lleve el
     trabajo;
   - no hace push;
   - al terminar, reporta a este chat: qué hizo, pruebas corridas con su resultado, lo que quedó pendiente y lo que
     necesita del autor.
4. **Puertos e2e propios:** L1 3141, L2 3142, L3 3143, L4 3144, L5 3145, L6 3146, L7 3147, L8 3148, L9 3149 y L10 3150. Nunca dos
   corridas de Playwright en el mismo checkout. Cada línea apaga su servidor al verificar.
5. **Paralelismo:** máximo tres líneas a la vez (P-4103). Si una se corta por el límite semanal, se retoma desde su
   último commit con el mismo brief.
6. **Integración.**
   1. La sesión principal integra cada línea en `integracion-041`, en el orden de [tasks.md](./tasks.md).
   2. Revisa el diff: solo rutas de la línea y nombres prohibidos en cero (SC-4104).
   3. Corre lint, typecheck, las pruebas unitarias y `next build` una vez por ola.
   4. Suma la estación de la línea al registro de la ruta (042).
7. **Entrega a `dev`:**
   - un push por ola integrada, sin force: `git fetch`, rebase sobre `origin/dev`, pruebas de lo que cambió y push;
   - cada push a `dev` es un despliegue del plan gratuito de Vercel;
   - `main` solo con confirmación explícita del autor.
8. **Limpieza.** Al integrar una ola se borran sus worktrees:
   1. primero el junction, con `cmd /c rmdir <wt>\node_modules`;
   2. luego la carpeta, con `cmd /c rmdir /s /q <wt>`;
   3. después `git worktree prune` y se borra la rama local.

   Nunca `Remove-Item -Recurse` sobre un worktree con junction.
9. **Sin preguntas entre tareas.** Aprobada una spec, su línea sigue su `tasks.md` de corrido. Solo para cuando dos
   reglas del autor chocan, o cuando una tarea necesita una acción suya; esas se juntan y se listan al final.

## Rutas exclusivas por línea

| Línea | Spec | Rutas propias |
|---|---|---|
| L1 | 042 | `app/[lang]/ai-lab/ruta/**`, `components/ailab/route/**`, `content/ailab/route/**`, `lib/ailab/route/**`, `content/i18n/{es,en}/route.json`, `tests/unit/route/**`, `tests/e2e/route/**` |
| L2 | 044 | `app/api/mcp/route.ts`, `lib/mcp/core/**`, `lib/mcp/servers/portafolio/**`, `app/[lang]/mcp/**`, `components/mcp/**`, `content/mcp/**`, `content/i18n/{es,en}/mcp.json`, `tests/unit/mcp/**`, `tests/e2e/mcp/**` |
| L3 | 045 | `app/[lang]/ingenieria/**`, `app/api/engineering/spend/route.ts`, `components/engineering/**`, `lib/engineering/**`, `scripts/engineering-metrics.mjs`, `content/engineering/**`, `content/i18n/{es,en}/engineering.json`, `tests/unit/engineering/**`, `tests/e2e/engineering/**` |
| L4 | 043 | `lib/ai/providers/**`, `lib/ai/budget/**`, `components/ai/providers/**`, `app/api/ailab/arena/**`, `components/ailab/arena/**`, `content/ailab/arena/**`, `content/i18n/{es,en}/arena.json`, `tests/unit/providers/**`, `tests/unit/arena/**`, `evals/arena.eval.ts` |
| L6 | 047 | El repo externo nuevo `CHERCED-DEV/cotejo` y, en el sitio, `lib/ailab/cotejo/**`, `components/ailab/cotejo/**`, `content/ailab/cotejo/**`, `content/i18n/{es,en}/cotejo.json`, `tests/unit/cotejo/**`, `tests/e2e/cotejo.spec.ts` |
| L5 | 046 | `lib/ai/gates/**`, `app/api/ailab/gates/**`, `components/ailab/gates/**`, `content/ailab/gates/**`, `content/i18n/{es,en}/gates.json`, `tests/unit/gates/**`, `evals/gates.eval.ts` |
| L7 | 048 | `lib/ai/kb/**`, `lib/mcp/servers/empresa/**`, `app/api/mcp/empresa/route.ts`, `app/api/ailab/kb/**`, `components/ailab/kb/**`, `content/ailab/kb/**`, `content/i18n/{es,en}/kb.json`, `tests/unit/kb/**`, `tests/e2e/kb.spec.ts`, `evals/kb.eval.ts` |
| L8 | 049 | `lib/ai/professions/**`, `lib/mcp/servers/{despacho,obra}/**`, `app/api/mcp/{despacho,obra}/route.ts`, `app/api/ailab/professions/**`, `components/ailab/professions/**`, `content/ailab/professions/**`, `content/i18n/{es,en}/professions.json`, `tests/unit/professions/**`, `tests/e2e/professions.spec.ts`, `evals/professions.eval.ts` |
| L9 | 050 | `lib/ai/pyme/**`, `app/api/ailab/pyme/**`, `components/ailab/pyme/**`, `content/ailab/pyme/**`, `content/i18n/{es,en}/pyme.json`, `tests/unit/pyme/**`, `tests/e2e/pyme.spec.ts`, `evals/pyme.eval.ts` |
| L10 | 051 | Fase A: el repo externo nuevo `CHERCED-DEV/forja` (en local, `C:\Users\HITMA\Desktop\forja`). Fase B: `app/api/mcp/kit/route.ts`, `lib/mcp/servers/kit/**`, `app/[lang]/kit/**`, `components/kit/**`, `content/kit/**`, `content/i18n/{es,en}/kit.json`, `tests/unit/kit/**`, `tests/e2e/kit/**` |

**Archivos compartidos.** Son de la base de cada ola y solo la sesión principal los toca, como enmienda registrada:
- `content/ailab/catalog.ts` y `content/i18n/{es,en}/ailab.json`;
- el cargador de i18n y `content/types.ts`;
- `lib/security/rate-limit.ts`, `lib/ai/spend.ts`, `lib/ai/models.ts` y `lib/ai/pricing.ts`;
- `README.md`, `package.json` y su lock;
- la página y la entrada del AI Lab, y la ventana «Para reclutadores»;
- sitemap y SEO, `next.config.*`, el proxy y los workflows existentes;
- el registro de estaciones `content/ailab/route/index.ts`, una vez integrada la L1;
- los archivos de specs anteriores, como `content/ailab/showcases/*.ts`.

## Contratos que se congelan

| Contrato | Lo produce | Lo consumen | Se congela en |
|---|---|---|---|
| `RouteStation` y su registro (`content/ailab/route/`) | 042 | Todas | `041-base-ola1` el tipo; cada línea entrega su archivo de estación |
| `createMcpHandler` y `McpTool` (`lib/mcp/core/`) | 044 | 048, 049, 051 | Al integrar la 044 (antes de la ola 3). Cada servidor pasa sus `limits`: la acción por visitante es propia (`mcpEmpresa`, `mcpDespacho`, `mcpObra`, `mcpKit`) y el tope diario se comparte (`mcpDaily`) |
| Puerto de modelos y `assertMonthlyBudget` (`lib/ai/providers/`, `lib/ai/budget/`) | 043 | 046, 048, 049, 050 | Al integrar la 043 (antes de la 046 y de la ola 3) |
| Núcleo determinista de Cotejo (paquete) | 047 | 046, 051 | Al publicar la primera versión del paquete |
| `monthlySpend(now)`, el gasto del mes por proveedor sin datos personales (`lib/ai/budget/`) | 043 | 045 | Al integrar la 043. Hasta entonces, la 045 muestra el gasto de `lib/ai/spend.ts` |

Las firmas finales están en el `plan.md` de cada spec que produce el contrato.

## Enmiendas de la base por ola

Las lista cada spec en su `plan.md`, en «Enmiendas a archivos compartidos». La base solo aplica las de las specs
aprobadas.

- **F1, antes de la ola 1:** las de 042, 044 y 045. Las tres tocan i18n, sitemap y la página del AI Lab, así que van
  juntas en una sola base:
  - los namespaces `route`, `mcp` y `engineering` en `lib/i18n/config.ts` y `lib/i18n/server.ts`;
  - el `export` de `clock` en `lib/ai/agent/interview.ts`, sin cambiar su comportamiento;
  - las acciones `mcp`, `mcpMatch` y `mcpDaily` en `lib/security/rate-limit.ts`;
  - el reporte JSON de Vitest en el `prebuild` y el script `metrics:history` en `package.json`, si se aprueba P-4503;
  - `.engineering/` en `.gitignore`;
  - el enlace de texto a la ruta en `components/site/home/RecruitersBlock.tsx`, si se aprueba P-4102;
  - el acceso a la ruta y a `/mcp` en `components/ailab/shell/LabPage.tsx`, en una sola línea;
  - `/ai-lab/ruta`, `/mcp` e `/ingenieria` en `app/sitemap.ts`;
  - la pastilla «Volver a la ruta» en `app/[lang]/layout.tsx`, solo si se aprueba P-4204;
  - la sección «MCP público» del `README.md`.

  Después de integrar la L1, se suman las estaciones de la 044 y la 045 al registro de la ruta. Después de integrar la
  L3, cada línea con modelo suma su batería de evals a `content/engineering/evals.ts`. El detalle exacto, con sus ids
  E-42xx, E-44xx y E-45xx, está en el `plan.md` de cada spec.
- **F2, antes de la ola 2:** las de 043, 047 y 046 (E-4301 a E-4315, E-4701 a E-4707 y E-4601 a E-4607):
  - en `package.json`:
    - `@anthropic-ai/sdk` y `openai`, cada uno justificado en el plan de la 043;
    - los scripts `arena:run` y `evals:gates`;
    - `evals:agent` acotado a `evals/agent.eval.ts`, para que correr las evals de Mini Cherced no dispare la arena ni
      las de otras líneas;
    - los paquetes de Cotejo por URL de su release;
  - los prefijos `GEMINI_`, `ANTHROPIC_` y `OPENAI_` en `vitest.evals.config.ts`;
  - en `lib/ai/pricing.ts`, los precios por proveedor con su fuente y su fecha;
  - el consumo típico y las líneas de gasto `arena` y `gates`;
  - las acciones `arena`, `arenaDaily`, `gates` y `gatesDaily`;
  - en la capa de datos, `BudgetRepo` en memoria y en Mongo, con la colección `ai_budget` en la base existente y un TTL
    de 400 días. Es el libro del techo mensual: `RateLimitRepo.hit` solo suma de a uno y no sirve para llevar dólares;
  - en `content/types.ts`, los ids `A10` (arena), `A11` (Cotejo) y `A12` (046), y `LAB_RUNS_IN` con `providers`;
  - el catálogo, `ailab.json`, `demo-loader.tsx` y `RunsInBadge.tsx`;
  - `gradeExpect` extraído de `lib/ai/evals/grade.ts`, sin cambiar `gradeAnswer`;
  - la tarjeta del techo mensual en la página de gasto del panel;
  - el README, con las dos llaves;
  - `privacy.json`, con Anthropic y OpenAI;
  - el workflow informativo `.github/workflows/cotejo.yml` y el caso de Cotejo en `content/projects.ts`.
- **F3, antes de la ola 3:** las de 048, 049 y 050:
  - los ids `K1` (048), `O1` (049) y `B1` (050) en `LAB_EXPERIMENT_IDS` de `content/types.ts`, con sus entradas en
    `content/ailab/catalog.ts` y sus textos en `ailab.json`;
  - sus acciones en `lib/security/rate-limit.ts`, su consumo típico en `lib/ai/models.ts` y sus líneas en
    `lib/ai/spend.ts`;
  - los namespaces `kb`, `professions` y `pyme` en el cargador de i18n;
  - los scripts `evals:kb`, `evals:professions` y `evals:pyme` en `package.json`.

  Al integrar cada una: su archivo de demo en `components/ailab/shell/demos/` y su import en el índice del registro de
  demos, su estación en el registro de la ruta y, la 048, la mención de su MCP en el `README.md`.
- **Fase B de la 051, al cerrar P-4105:** E-5101 a E-5108 de su plan:
  - el namespace `kit` y las acciones `mcpKit` y `mcpKitCheck`;
  - `forja-core` por tarball;
  - la tarjeta A13 y `/kit` en el sitemap;
  - la fila del README, la estación y la entrada de evals en el tablero.

  Su fase A no toca archivos compartidos.

## Llaves nuevas (043)

| Variable | Para qué | Quién la crea | Entornos | Tope |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | Claude en el puerto de modelos, la arena y los revisores de la 046 | El autor, en la consola de Anthropic | Production, Preview (Sensitive) | 5 USD en la consola sin recarga automática (P-4309), más el tope por visitante y el techo mensual de la línea |
| `OPENAI_API_KEY` | OpenAI en el puerto de modelos y la arena | El autor, en la plataforma de OpenAI | Production, Preview (Sensitive) | Igual |

Sin ellas, el sitio compila y funciona: el proveedor no aparece y la arena compara los que haya. En local hay simulador.
Nunca se leen sus valores.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Alcance de diez specs | Alto | Aprobación spec por spec, olas por dependencia, tareas cortas y una entrega por línea |
| El límite semanal corta una línea a la mitad | Alto | Máximo tres líneas a la vez, commit por fase y briefs que se pueden retomar |
| Dos líneas tocan el mismo archivo | Alto | Rutas exclusivas, archivos compartidos solo en la base y revisión del diff al integrar |
| `npm ci` a través del junction vacía el `node_modules` principal | Alto | Junction antes de lanzar la línea y la regla en la primera línea del brief |
| Gasto de API por encima del techo | Medio | Tope por visitante, techo mensual con corte (043), límite en cada consola y pregenerado |
| Nombres del proyecto de referencia en el repo público | Alto | FR-4107, lista privada de nombres prohibidos y búsqueda en el diff antes de cada push |
| Despliegues del plan gratuito de Vercel | Medio | Un push por ola integrada |
| Lo nuevo amontona secciones aprobadas | Medio | FR-4108 y capturas del celular antes de cada vista previa |
| Precios o modelos de Claude y OpenAI cambian | Bajo | Tabla de precios versionada con fecha de consulta; se revisa al integrar la 043 |

## Validación de la línea

- Por línea: el comando de validación de su `plan.md`, que corre solo las pruebas de lo que cambia.
- Por ola, en la integración:
  - `npm run lint`, `npm run typecheck`, `npx vitest run` y `npx next build`;
  - los archivos e2e de las líneas de la ola, con 2 workers;
  - la búsqueda de nombres prohibidos en el diff.
- Antes de cada vista previa: capturas del celular (390×844 y WebKit) de las páginas tocadas, contra la última vista
  aprobada.
