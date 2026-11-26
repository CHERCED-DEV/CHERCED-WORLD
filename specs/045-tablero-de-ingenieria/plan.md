# Plan: 045 — Tablero de ingeniería vivo

**Spec:** [spec.md](./spec.md) | **Fecha:** 26 de noviembre de 2026 | **Línea:** L3, ola 1 | **Rama de la línea:**
`lane/l3-tablero` en `.worktrees/l3-tablero`

## Resumen

Tres fuentes, y cada una se calcula donde existe:

| Fuente | Dónde se calcula | Por qué ahí |
|---|---|---|
| Historia de git y despliegues | En local, con `scripts/engineering-metrics.mjs`, que guarda `content/engineering/history.json` versionado | En el build de Vercel no se puede contar con la historia completa de git, y `gh` no está |
| Specs, requisitos y pruebas del árbol | En el build, leyendo los archivos versionados con `fs` desde un componente de servidor | Están en el árbol del build y así nunca quedan viejos |
| Pruebas del build | En el build, desde el reporte JSON de Vitest que deja el `prebuild` | Es la prueba de que ese despliegue corrió las pruebas |
| Gasto de IA y llamadas al MCP | En el servidor, en `GET /api/engineering/spend` con `unstable_cache` de una hora, y lo pide el navegador | Viven en los contadores de la base. Así la página entera queda estática y el reporte del build no se pierde al regenerarla |

La lógica de derivación es TypeScript puro y probado en `lib/engineering/`. El script solo recolecta: corre `git`, y
`gh` si está, y escribe JSON. Así la lógica se prueba con Vitest sin depender de la historia del repo.

## Contexto técnico

- **Lenguaje:** TypeScript estricto para la página y la derivación. JavaScript ESM sin dependencias para el script, como
  `scripts/guest-mode.mjs`.
- **Dependencias nuevas:** ninguna. Los gráficos son SVG a mano con su tabla, `fs` y `child_process` vienen con Node y
  Zod valida los JSON.
- **Almacenamiento:**
  - `content/engineering/history.json`, versionado, de unos 40 KB con unos 400 commits;
  - `.engineering/vitest.json`, que deja el `prebuild`, no se versiona y entra a `.gitignore`.

  Sin colecciones nuevas en la base.
- **Pruebas:** Vitest para la derivación, los esquemas, la clasificación de estados, la búsqueda de ids y las fuentes
  vacías. Un e2e de la página.
- **Plataforma:** Vercel. La página es estática por idioma, sin `revalidate`: si se regenerara en una función, el
  reporte de Vitest del build no estaría en su paquete. La sección de gasto es una isla cliente que lee un endpoint
  propio con `unstable_cache` de una hora (como la caché de la 035) y `cache-control: public, s-maxage=3600`. Sin
  JavaScript, la sección dice que pide JavaScript.
- **Metas de rendimiento:** principio V con tablas largas, así que la tabla de specs se pagina o se pliega por grupos
  de 10 y no se hidrata entera.
- **Restricciones:** solo archivos versionados (`git ls-files`); sin datos de visitantes; sin URLs de vista previa.

## Verificación de la constitución

| Principio | Cómo se cumple |
|---|---|
| **I. Evolución, no reemplazo** | Página nueva. Nada existente cambia de forma |
| II. Glass sobre movimiento | Tablas y tarjetas con los tokens de glass existentes. Los gráficos no animan con movimiento reducido |
| **III. Seguridad real** | Sin datos de visitantes ni de cuentas. Los commits van sin correos ni nombres. Sin URLs de vista previa. Solo archivos versionados, para que nada de `privado/` llegue a la página |
| IV. Contenido como datos | Todo número sale de un archivo versionado, del build o de un contador. Nada escrito a mano. La página no se llama a sí misma por HTTP |
| V. Rendimiento y accesibilidad | Tablas con encabezados, gráficos con su tabla equivalente, estado no solo por color y SC-4505 |
| VI. Calidad verificable | Pruebas de la derivación, de los esquemas y de las fuentes vacías (SC-4503) |
| **VII. Propiedad exclusiva** | Rutas propias en la tabla de abajo. `package.json`, `.gitignore`, i18n, sitemap y la ruta de la 042 van como enmiendas E-45xx |
| **VIII. Simplicidad operativa** | Sin dependencias, sin variables nuevas (las de Vercel son de sistema), sin infraestructura y sin despliegues extra: el historial se refresca en el push de cada ola |

## Rutas propias de la línea

| Ruta | Para qué |
|---|---|
| `app/[lang]/ingenieria/page.tsx` y `app/[lang]/ingenieria/opengraph-image.tsx` | La página |
| `app/api/engineering/spend/route.ts` | El gasto de IA y las llamadas al MCP, agregados y cacheados una hora. Se suma a las rutas de la L3 que fija la 041: no lo reclama ninguna otra línea |
| `components/engineering/**` | `DeployStrip`, `SpecsTable`, `SpecDetail`, `TestsPanel`, `EvalsPanel`, `SpendPanel`, `BudgetsPanel`, `WeeklyBars` y sus estilos |
| `lib/engineering/history.ts` | Esquema Zod de `history.json` y lectura |
| `lib/engineering/specs.ts` | Leer `specs/`, clasificar estados y sacar los `FR-` |
| `lib/engineering/commits.ts` | Asuntos de commit a specs, días de spec a construida y commits por semana |
| `lib/engineering/tests.ts` | Contar archivos de prueba por tipo y buscar ids en `tests/` |
| `lib/engineering/vitest-report.ts` | Leer el reporte JSON de Vitest |
| `lib/engineering/budgets.ts` | Los presupuestos del principio V y las pruebas que los vigilan |
| `lib/engineering/spend.ts` | Gasto de IA (antes y después de la 043) y llamadas al MCP |
| `lib/engineering/tracked.ts` | La lista de archivos versionados que el tablero puede leer |
| `scripts/engineering-metrics.mjs` | El recolector local |
| `content/engineering/history.json` | La historia tomada en local |
| `content/engineering/evals.ts` | El registro de baterías de evals publicadas |
| `content/engineering/station.ts` | La estación `tablero-en-numeros` para la 042 |
| `content/i18n/{es,en}/engineering.json` | Las etiquetas |
| `tests/unit/engineering/**` | Pruebas unitarias y de contrato |
| `tests/e2e/engineering/engineering.spec.ts` | El e2e. El repo agrupa los e2e en carpetas por área, así que va en `tests/e2e/engineering/` |

## Enmiendas a archivos compartidos

Las aplica el integrador antes de arrancar la línea y se congelan con la etiqueta `045-base`.

| Id | Archivo | Cambio |
|---|---|---|
| E-4501 | `lib/i18n/config.ts` y `lib/i18n/server.ts` | Namespace `engineering` y sus dos cargadores |
| E-4502 | `package.json` | `prebuild` suma el reporte JSON de Vitest en `.engineering/vitest.json`, sin cambiar qué pruebas corren. La opción exacta se verifica con la versión instalada (Vitest 5.0.5). Más un script `metrics:history` que corre `node scripts/engineering-metrics.mjs` |
| E-4503 | `.gitignore` | `.engineering/` |
| E-4504 | `app/sitemap.ts` | `/{lang}/ingenieria` en los dos idiomas |
| E-4505 | `content/ailab/route/index.ts` (después de integrar la L1) | Sumar `content/engineering/station.ts` y, si el autor aprueba P-4502, ponerla como núcleo de la prueba 4 en `coreRoute` |
| E-4506 | `content/engineering/evals.ts` (después de integrar la L3) | Cada línea con modelo suma su batería publicada aquí, una entrada por línea, al integrarse |

## Contratos que produce y consume

**Produce** (se congela con la etiqueta `045-tablero` al integrarse):

```ts
export type PublishedEvals = {
  id: string
  spec: string
  title: Localized
  results: EvalResults
  href: string
}

export const publishedEvals: readonly PublishedEvals[]

export type History = {
  version: 1
  takenAt: string
  head: string
  commits: Array<{ sha: string; date: string; subject: string }>
  specCreated: Record<string, string>
  deployments: { takenAt: string; byEnvironment: Record<string, Array<{ sha: string; date: string; state: string }>> } | null
  measurements: Array<{ budget: 'lcp' | 'cls' | 'inp' | 'a11y'; page: string; value: number; date: string; source: string }>
}
```

- Una línea con modelo cumple SC-4103 de la 041 entregando su `results.json` con el esquema `EvalResults` de la 032 y
  pidiendo la enmienda E-4506.

**Consume:**
- sin modificarlos: `EvalResults` de `lib/ai/evals/grade.ts`, `content/ailab/evals/results.json`, `spendToday` y
  `SPEND_GLOBAL_KEY` de `lib/ai/spend.ts`, `getRepos` de `lib/data`, `rateLimitKey` de `lib/security/rate-limit.ts`,
  `USD_TO_COP` de `lib/ai/pricing.ts`, `formatUsd` de `lib/ai/models.ts` y `Localized` de `content/types.ts`;
- de la 044: el contador global `mcpDaily`;
- de la 043, cuando exista: la función de gasto mensual que exponga `lib/ai/budget/`. Firma propuesta para acordar con la
  L4: `monthlySpend(now: Date): Promise<{ month: string; usd: number; targetUsd: number; capUsd: number; byProvider: Partial<Record<ProviderId, number>> }>`.
  Hasta entonces, la sección usa `spendToday` (FR-4509).

## Decisiones de diseño

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| La historia de git se toma en local y se versiona | En el build de Vercel no se puede contar con la historia completa. Refrescarla en el push de cada ola no suma despliegues del plan gratuito | La historia llega hasta el último push de ola; la página dice hasta cuándo |
| El script recolecta y TypeScript deriva | La lógica se prueba con Vitest y tipos sin depender de un repo real | Hay dos piezas en vez de una |
| Pruebas del build desde el reporte de Vitest del `prebuild` | Es la evidencia más fuerte («este despliegue pasó N pruebas») y ya corre en cada build | Toca `package.json`, que es compartido (E-4502) |
| Ids literales en vez de cobertura de código | Sin dependencia nueva, y muestra trazabilidad del requisito a la prueba, que es lo que se discute en entrevista | No es cobertura por líneas; la página lo dice |
| Gasto en un endpoint cacheado una hora, leído por el navegador | Mantiene la página entera estática, con el reporte del build, y lee la base como mucho una vez por hora | El número puede tener hasta una hora de atraso, y sin JavaScript esa sección no se ve |
| Mediciones de rendimiento solo si ya existen | Nada de corridas extra de Playwright solo para el tablero | La sección puede quedar con «sin medición publicada» |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Un commit sin el número de spec entre paréntesis no cuenta | La página dice que cuenta solo los commits que nombran la spec, y el integrador sigue la convención al integrar cada línea |
| El reporte de Vitest cambia de forma entre versiones | Esquema Zod tolerante (solo totales y estados) y, si no valida, «sin reporte de pruebas en este build» |
| La tabla de 50 specs empeora el INP en el celular | Grupos plegables renderizados en el servidor, sin hidratar la tabla |
| Se cuela un nombre o correo en un asunto de commit | El script solo guarda sha, fecha y asunto; una prueba busca correos y URLs de vista previa en `history.json` (SC-4504) |
| `gh` no está en la máquina del integrador | La sección de despliegues queda sin datos y lo dice; el resto sale igual |

## Validación

Solo lo de esta línea, sin gastar API y sin la suite exhaustiva:

```bash
npx vitest run tests/unit/engineering
```

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npx playwright test tests/e2e/engineering/engineering.spec.ts
```

Más el conteo a mano de SC-4502 el día de la revisión y las capturas de 390×844 y WebKit de la página.

## Seguimiento de complejidad

No aplica: no viola ningún principio.
