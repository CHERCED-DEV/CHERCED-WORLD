# Plan de implementación: 047 — Cotejo, revisor de specs

**Línea**: L6 | **Fecha**: 26 de noviembre de 2026 | **Spec**: [spec.md](./spec.md) | **Base**:
[propuesta 014](../014-gestor-de-specs/propuesta.md) | **Paraguas**: [041](../041-pruebame-en-vivo/spec.md)

## Resumen

Cotejo nace en un repo propio, abierto y con licencia MIT (`CHERCED-DEV/cotejo`), como monorepo de paquetes
pequeños:
- **el núcleo determinista** (`cotejo-core`), que sale primero y con API estable;
- **las capas opcionales:** embeddings y NLI (`cotejo-semantic`) y la trazabilidad contra el repo (`cotejo-trace`);
- **las formas de entrega:** CLI, GitHub Action, skill de Claude Code y servidor MCP local.

El sitio consume los paquetes desde tarballs de los releases de GitHub. Arma la demo A11 en un Worker del navegador y
la 046 usa el núcleo en el servidor. Nada llama a modelos remotos.

## Contexto técnico

- **Lenguaje:** TypeScript estricto. El núcleo corre en Node 20+ y en un Web Worker sin cambios.
- **Dependencias del repo de Cotejo** (no son del sitio):
  - `unified` y `remark-parse` (mdast), para posiciones exactas de línea y columna. En el sitio ya están en el árbol
    por `@mdx-js/loader`;
  - `minisearch` (BM25), como dependencia par de `cotejo-trace`. El sitio ya la tiene (7.2.0);
  - `@huggingface/transformers`, como dependencia par de `cotejo-semantic`. El sitio ya la tiene (4.3.2), así que
    la demo no duplica el motor;
  - el SDK oficial de MCP, solo en el paquete del servidor MCP;
  - YAML solo en la CLI, para leer las reglas. El núcleo recibe objetos.
- **Dependencias nuevas del sitio:** `cotejo-core`, `cotejo-semantic` y `cotejo-trace`, por URL de tarball con versión
  exacta y su hash en el lock. Se justifican porque no existe en la plataforma ni en el repo nada que analice specs,
  y porque la alternativa (copiar el código dentro del sitio) rompe la regla de un repo aparte (P-4106).
- **Almacenamiento:** ninguno en el servidor. La línea base vive en un archivo del repo analizado. La demo no guarda
  nada.
- **Pruebas:**
  - en el repo de Cotejo, Vitest con el corpus sintético como fixture y la métrica como parte de la suite;
  - en el sitio, pruebas de contrato del núcleo y de la demo.
- **Plataforma:** Node 20+ para la CLI, la Action y el MCP; Web Worker del navegador para la demo, con WebGPU cuando
  hay.
- **Metas de rendimiento:** las de SC-4707 y SC-4709. La inferencia nunca corre en el hilo principal.
- **Restricciones:**
  - cero red al analizar;
  - reproducible byte por byte;
  - sin LLM en el camino crítico;
  - la demo no rompe los presupuestos del principio V ni los fps del fondo.

## Verificación de la constitución

| Principio | Cómo se cumple |
|---|---|
| **I. Evolución, no reemplazo** | Es una tarjeta nueva del AI Lab y, cuando haya métricas, un caso nuevo. No toca secciones aprobadas |
| II. Glass sobre movimiento | La tarjeta usa los tokens del laboratorio. El Worker evita bajar los fps del fondo |
| **III. Seguridad real** | La demo no manda la spec a ningún servidor. La CLI, la Action y el MCP solo leen, rechazan rutas fuera de la raíz y no ejecutan nada del repo analizado |
| IV. Contenido como datos | La muestra, su verdad, el índice del sitio y la estación son contenido versionado. El texto de la tarjeta se renderiza en el servidor |
| V. Rendimiento y accesibilidad | Worker, descarga solo con consentimiento, teclado completo, movimiento reducido, resaltado que no depende solo del color |
| VI. Calidad verificable | Prueba de contrato del núcleo en los dos repos, métricas por detector en el CI de Cotejo y el gate de calidad del sitio antes de integrar |
| **VII. Propiedad exclusiva** | En el sitio, la L6 solo toca sus rutas. El repo de Cotejo es suyo entero. Lo compartido entra como enmienda del integrador |
| **VIII. Simplicidad operativa** | Sin servidores, sin bases y sin variables nuevas. Los paquetes vienen de releases de GitHub, sin registro ni cuenta nueva. El CI es el de GitHub Actions, gratis en repos públicos |

No hay violaciones que justificar.

## Rutas propias de la línea

| Dónde | Ruta | Para qué |
|---|---|---|
| Repo nuevo | `CHERCED-DEV/cotejo` (entero) | Paquetes, CLI, Action, skill, MCP, corpus y medición |
| Sitio | `components/ailab/cotejo/**` | Demo A11: carga, hallazgos, caja de cristal y métricas en vivo |
| Sitio | `content/ailab/cotejo/**` | Muestra de 600 líneas, su verdad, índice BM25 del sitio con fecha y estación |
| Sitio | `content/i18n/{es,en}/cotejo.json` | Textos |
| Sitio | `tests/unit/cotejo/**` | Contrato del núcleo y pruebas de la demo |

**Ampliación de rutas que pide la línea:**
- `lib/ailab/cotejo/**`, para el Worker de la demo y su adaptador sobre `lib/ailab/core/worker-runtime.ts`, como hacen
  `lib/ailab/search/meaning.worker.ts` y `lib/ailab/voice/whisper.worker.ts`. Sin esta ruta, el Worker no tiene dónde
  vivir.
- Opcional: `tests/e2e/cotejo.spec.ts`, un solo archivo e2e para la tarjeta.

## Estructura del repo de Cotejo

```text
cotejo/
├── packages/
│   ├── core/        C1: normalización, unidades, reglas, reporte, SARIF, Markdown, resumen, sha256 propio
│   ├── semantic/    C2 embeddings y C3 NLI (dependencia par: @huggingface/transformers)
│   ├── trace/       C4 posiblemente implementado (dependencia par: minisearch)
│   ├── cli/         cotejo analizar | analyze | indexar | linea-base
│   └── mcp/         servidor MCP por stdio: cotejo_analizar, cotejo_resumen
├── action/          GitHub Action (SARIF y resumen en el log)
├── skill/           SKILL.md para Claude Code
├── rules/           reglas y diccionarios ES y EN en YAML (estilo Vale)
├── corpus/          generador en Python con semilla fija, semillas y verdad
└── bench/           medición por detector y por capa
```

- **Monorepo:** con npm workspaces, sin herramientas extra.
- **Releases:** cada etiqueta `vX.Y.Z` dispara un workflow que corre la suite, mide con el corpus sintético y publica
  los tarballs (`npm pack`) como assets del release.

## Enmiendas a archivos compartidos del sitio

Las aplica el integrador antes de arrancar la parte del sitio de la L6, una vez exista el primer release del núcleo.
Se congelan con la etiqueta `047-base-congelada`.

| ID | Archivo | Cambio |
|---|---|---|
| E-4701 | `package.json` y su lock | `cotejo-core`, `cotejo-semantic` y `cotejo-trace` por URL de tarball del release, con versión exacta |
| E-4702 | `content/types.ts` | `'A11'` en `LAB_EXPERIMENT_IDS` |
| E-4703 | `content/ailab/catalog.ts` y `content/i18n/{es,en}/ailab.json` | Tarjeta A11 «Cotejo», `runsIn: 'browser'`, descargas `E5_SMALL` (la constante que ya existe) y dos nuevas: `NLI_ES` (339 MB) y `NLI_EN` (87 MB), las dos de `huggingface.co`. Tema por P-4713 |
| E-4704 | `components/ailab/shell/demo-loader.tsx` | Registro de la demo A11 |
| E-4705 | `.github/workflows/cotejo.yml` (nuevo) | Corre Cotejo sobre las specs que cambian en cada PR y sube el SARIF. Informativo (P-4712) |
| E-4706 | `content/projects.ts` | Caso de estudio de Cotejo, cuando haya métricas reales (P-4711) |
| E-4707 | `content/ailab/route/index.ts` | Sumar `cotejoStation` al registro de estaciones, después de integrada la L1 |

## Contratos que produce

### Núcleo (`cotejo-core`), el que consume la 046

Puro, síncrono y determinista: sin red, sin sistema de archivos y sin reloj dentro del resultado.

```ts
export type Lang = 'es' | 'en'
export type Profile = 'speckit' | 'cherced' | 'breve'
export type Severity = 'error' | 'warning' | 'note'
export type Layer = 'C1' | 'C2' | 'C3' | 'C4'

export type Evidence = { file: string; line: number; column: number; unitId: string | null; fragment: string }

export type Finding = {
  id: string
  rule: string
  family: 'structure' | 'ids' | 'references' | 'glossary' | 'numbers' | 'language' | 'duplicates' | 'value-conflict' | 'polarity-conflict' | 'coverage'
  layers: Layer[]
  severity: Severity
  score: number
  components: Record<string, number | string>
  evidence: Evidence[]
  why: Record<Lang, string>
  howToRefute: Record<Lang, string>
  fingerprint: string
}

export type CotejoReport = {
  schemaVersion: 1
  tool: { name: 'cotejo'; version: string }
  profile: Profile | null
  lang: Lang
  units: number
  findings: Finding[]
  counts: Record<Severity, number>
  reproducibility: { configHash: string; inputHash: string; models: Array<{ id: string; sha256: string }>; onnxRuntime: string | null }
  timingsMs: Record<Layer, number | null>
}

export type RuleSet = { version: string; rules: readonly RuleDefinition[]; dictionaries: Readonly<Record<Lang, Dictionary>> }

export function analyze(
  input: { text: string; path?: string; lang?: Lang; profile?: Profile },
  options?: { rules?: RuleSet; baseline?: readonly string[] },
): CotejoReport
export function toSarif(report: CotejoReport, options?: { max?: number }): SarifLog
export function toMarkdown(report: CotejoReport, lang: Lang): string
export function compactSummary(report: CotejoReport, lang: Lang): string
export function reportHash(report: CotejoReport): string
export const DEFAULT_RULES: RuleSet
export const CORE_VERSION: string
```

- **`timingsMs`** existe para leerlo, pero `reportHash` lo excluye. Así, dos corridas dan el mismo hash aunque tarden
  distinto (FR-4707).
- **Lo que devuelve el perfil `breve`** (FR-4716):
  - hallazgos de familia `coverage` cuando un `C-n` cubre un `R-n` inexistente o un `R-n` no tiene ningún `C-n`;
  - un hallazgo de `structure` si «No incluye» está vacío.
- **Versionado:** semántico. La 046 fija la versión exacta. Un cambio de esquema del reporte sube `schemaVersion`.

### Capas opcionales

- **`cotejo-semantic`:**
  - `semanticCandidates(units, { model, k, threshold })`;
  - `nliRank(candidates, { model, cuts })`;
  - asíncronas, y reciben el modelo ya cargado, para que la demo use la caché de A5.
- **`cotejo-trace`:**
  - `buildIndex(files)`;
  - `possiblyImplemented(units, index, { glossary })` devuelve, por unidad, los 3 archivos más probables con sus
    términos y puntajes.
- **`index`:** el índice del sitio es un JSON que la CLI genera (`cotejo indexar --repo . --salida …`). En el sitio
  se versiona en `content/ailab/cotejo/repo-index.json`, con su fecha.

### Estación de la ruta (consume el contrato de la 042)

`content/ailab/cotejo/station.ts` exporta `cotejoStation: RouteStation` con:
- `id: 'cotejo'`;
- `proof: 2` y `alsoProves: [3, 4]`;
- `minutes: 2`;
- `href: '/{lang}/ai-lab#' + labCardId('A11')`;
- `spec: '047'`.

### Lo que consume

- `lib/ailab/core/worker-runtime.ts` y `worker-protocol.ts`;
- la constante `E5_SMALL` del catálogo;
- `RouteStation` de la 042.

## Decisiones de diseño

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| Determinista primero; los modelos solo proponen u ordenan | Medido en la 014: las reglas con la frase enmascarada dieron 0 falsos positivos donde el coseno dio 354, y resolvieron lo que más duele en 0,23 s | Las contradicciones semánticas casi no se detectan (1 de 10 en el spike); se dicen como límite |
| El núcleo es un paquete propio, puro y síncrono | La 046 y la demo lo usan igual, en el servidor y en el navegador, y se prueba sin dobles | Un SHA-256 propio en TypeScript para no depender de APIs asíncronas del navegador |
| Severidad con la escala de SARIF (`error`, `warning`, `note`) | Se publica tal cual en GitHub Code Scanning, sin traducir escalas | Tres niveles y no más |
| Claves del JSON en inglés; mensajes en ES y EN | Es un paquete abierto para equipos de cualquier país | El reporte para leer va traducido; el JSON no |
| Tarballs en los releases de GitHub, sin npm | No pide cuenta nueva, y el lock fija el hash | Instalar fuera del sitio es menos cómodo que `npm install cotejo`; se revisa en P-4710 |
| Índice del sitio versionado con fecha, no generado en el build | No suma pasos al build de Vercel ni una dependencia de Git en el build | El índice envejece. Se regenera al integrar cada ola y la pantalla dice su fecha |
| Perfil `cherced` además de `speckit` | Las specs de este repo usan un estilo propio más corto, y la demo «contra el propio sitio» no debe ahogarse en falsos «falta sección» | Un perfil más que mantener |
| Capas en paquetes separados | El sitio y la 046 cargan solo el núcleo; la demo carga lo semántico bajo demanda | Tres paquetes que versionar juntos |

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El corpus sintético comparte autor con las reglas y infla la precisión | Alto | Corpus difícil escrito por el autor, más PURE. Los tres se reportan por separado |
| Las contradicciones semánticas son difíciles (1 de 10 en el spike) | Alto | Se presentan como candidatos ordenados para revisión humana, nunca como veredicto |
| El NLI es lento: de 1 a 2 horas para 7.603 candidatos con la CPU saturada | Alto | Es opcional, con los cinco recortes, y se vuelve a medir con la máquina libre antes de prometer tiempos |
| Un cambio del núcleo rompe a la 046 | Medio | Versión exacta en el sitio y la misma prueba de contrato en los dos repos |
| El build de Vercel no baja el tarball | Medio | Es una URL pública de GitHub con hash en el lock. Se prueba en la vista previa antes de integrar |
| La licencia de PURE no permite versionarlo | Bajo | Se descarga al medir. Solo se publican los números |
| La demo baja los fps del fondo o sube el INP | Medio | Worker, la capa C1 sin descarga y la medición de SC-4709 antes de integrar |
| El índice del sitio queda viejo | Bajo | Fecha visible y regeneración al integrar cada ola |

## Validación

**En el repo de Cotejo** (CI propio): la suite de Vitest, la medición con el corpus sintético (tres semillas) y la
prueba de reproducibilidad.

**En el sitio**, solo lo que cambia y sin gastar nada:

```bash
npx vitest run tests/unit/cotejo
```

```bash
npm run lint
```

```bash
npm run typecheck
```

- Si se aprueba la ampliación, un solo archivo e2e (`tests/e2e/cotejo.spec.ts`). Si no, una revisión a mano en
  `next dev`.
- En los dos casos, capturas del celular (390×844 y WebKit) contra la última vista aprobada del AI Lab.

## Seguimiento de complejidad

No aplica: no hay violaciones de la constitución.
