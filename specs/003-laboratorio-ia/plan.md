# Implementation Plan: Laboratorio de IA (AI Lab)

**Branch**: `003-laboratorio-ia` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: [spec.md](./spec.md), [idea.md](./idea.md), [research.md](./research.md) y [catalogo.md](./catalogo.md)

**Alcance de este plan**: solo lo que no depende del camino B ni de un [confirmar]:

- la página y la tarjeta;
- la ola 1 (V1, V4, A2, A3 y R1);
- los juegos J1 y J2;
- las partes A de la ola 2 (A5, A4, V2 y V3).

Las historias HC-1 a HC-6 quedan fuera hasta que el autor resuelva su pregunta.

## Summary

Una página `/[lang]/ai-lab` con tarjetas de un mismo formato y once experimentos que corren completos en el navegador:

- **Voz**: un transcriptor con Whisper y navegación por voz sobre la paleta del sitio; texto a voz y lectura de posts
  con la voz del navegador.
- **Agentes y plugins**: el explorador de un plugin de ejemplo, un generador de `SKILL.md` y una búsqueda con caja de
  cristal.
- **Arquitectura que se toca**: un simulador de sagas.
- **Vitrinas**: dos, con datos inventados, una con Python en Pyodide.
- **Juegos**: dos de tenis de mesa contra una red pequeña que aprende por refuerzo o por imitación.

Cada descarga pide consentimiento y muestra su peso. Toda inferencia y todo entrenamiento corren en Web Workers. Nada
de lo que hace el visitante sale de su equipo.

## Technical Context

**Language/Version**: TypeScript 5.9 (estricto) sobre Node.js 22. Python solo en el navegador, con Pyodide.

**Primary Dependencies**: las de hoy, más una nueva y dos recursos en tiempo de ejecución:

| Pieza | Para qué | Justificación (principio VIII) |
|---|---|---|
| `@huggingface/transformers` (npm, nueva; P-3k) | Whisper (V1, V4) y embeddings opcionales (A5), con ONNX Runtime Web | La plataforma no trae reconocimiento de voz local. La Web Speech API manda el audio a un servicio del navegador (research §2). Se importa solo dentro de los workers, y nunca entra al bundle de la página |
| Pyodide 0.29.0 (jsDelivr, versión fija; no es dependencia npm) | Obra (A4) | "Python en pequeño" sin servidor (research §3). Se carga en un worker solo con consentimiento |
| Pesos de los modelos (Hugging Face) | Whisper y e5-small | Pasan de 100 MB, así que no van en `public/`, y no piden cuenta |
| Red neuronal propia en TypeScript (sin dependencia) | J1 y J2 | Una red de dos capas con aprendizaje por refuerzo y por imitación cabe en pocos cientos de líneas. TensorFlow.js pesa más de 1 MB para eso |
| `minisearch` (ya existe) | A5 en modo palabras | El índice de búsqueda del sitio ya lo usa y su puntaje es de la familia BM25 |
| Web Speech API (navegador) | V2 y V3 | Sin descargas. La tarjeta avisa cuando la voz se genera en línea |

**Storage**: nada nuevo en el servidor. En el navegador:
- la caché de modelos de transformers.js (Cache Storage);
- el estado de los juegos en IndexedDB (`cw-ailab`, store `games`, con versión);
- el consentimiento de la sesión en `sessionStorage`.

Todo se borra con un botón (FR-312).

**Testing**: Vitest 5 para la lógica pura: SRT, `SKILL.md`, saga, física del juego, red neuronal y comandos de voz.
Playwright 1.64 con axe para la página, el consentimiento, el teclado, sin JS y movimiento reducido. Las pruebas con
modelos reales usan dobles de los workers, para no descargar pesos en CI.

**Target Platform**: el proyecto de Vercel que ya existe. WebGPU es opcional: sin WebGPU, WASM.

**Project Type**: aplicación web en un solo proyecto Next.js.

**Performance Goals**: SC-301 a SC-303 de la spec, más SC-204 y SC-205 de la 002.

**Constraints**:
- 0 bytes de modelos antes del consentimiento.
- Workers para todo lo pesado.
- Sin servidor, cuentas, llaves ni variables.

**Scale/Scope**: 1 página × 2 idiomas, 11 experimentos y unos 10 workers en total, como máximo 2 activos a la vez.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Verificación | Estado |
|---|---|---|
| I. Evolución, no reemplazo | Ruta nueva `/[lang]/ai-lab`, aditiva. Usa el cristal, los tokens y el mapa cerebral como lenguaje visual. El menú no cambia mientras P-3h siga abierta | ✅ |
| II. Glass sobre movimiento | Juegos y animaciones con movimiento reducido y pausa con la pestaña oculta. El canvas del juego es una instancia por tarjeta y se libera al cerrarla. El fondo no cambia (D1) | ✅ |
| III. Seguridad real | Sin entradas públicas nuevas: todo corre en el cliente. V4 solo ejecuta comandos del registro de la paleta, nunca texto libre. Los archivos generados (`.srt`, `SKILL.md`) se crean en el navegador | ✅ |
| IV. Contenido como datos | El catálogo, las vitrinas y el plugin de ejemplo viven en `content/ailab/`. En el navegador solo quedan la caché de modelos de terceros, el progreso del juego (equivalente a los easter eggs descubiertos) y el consentimiento. Nada de eso es contenido del sitio | ✅ (interpretación registrada) |
| V. Rendimiento y accesibilidad | Carga diferida por tarjeta, workers y consentimiento con peso. Alternativas en texto para voz y juego. Pruebas de axe y de fps | ✅ |
| VI. Calidad verificable | `npm run verify` y e2e por lane. Pruebas unitarias de toda la lógica pura. La suite completa 3 veces en verde al cerrar | ✅ |
| VII. Propiedad exclusiva | 6 lanes con rutas disjuntas. Lo que toca a la 004 entra como enmienda A-7xx | ✅ |
| VIII. Simplicidad operativa | Una dependencia nueva justificada (P-3k). Dos CDN públicos sin cuenta. Sin servidor ni variables | ✅ con P-3k |

## Project Structure

### Documentation (this feature)

```text
specs/003-laboratorio-ia/
├── idea.md, research.md, catalogo.md
├── spec.md
├── plan.md      # este archivo (incluye el modelo de datos)
└── tasks.md
```

### Source Code (repository root)

```text
app/[lang]/ai-lab/page.tsx, opengraph-image.tsx (nuevos)               X0
components/ailab/shell/** (LabPage, LabCard, ConsentDialog, badges)    X0
lib/ailab/core/** (workers, descargas, consentimiento, almacenamiento) X0
content/ailab/catalog.ts, content/i18n/{es,en}/ailab.json (nuevos)     X0
components/ailab/voice/**, lib/ailab/voice/**                          X1
components/ailab/plugins/**, components/ailab/search/**                X2
lib/ailab/skill/**, lib/ailab/search/**, content/ailab/plugin-example/** X2
components/ailab/saga/**, components/ailab/showcases/**                X3
lib/ailab/saga/**, lib/ailab/pyodide/**, content/ailab/showcases/**    X3
components/ailab/games/**, lib/ailab/games/**                          X4
tests/unit/x0..x4/**, tests/e2e/x0..x4/**                              cada lane la suya
tests/e2e/x5/**                                                        X5
```

Las enmiendas de abajo los tocan, con X0 como ejecutora: `package.json`, `lib/i18n/config.ts`, `content/types.ts`,
`content/site.ts` (privacidad), `app/sitemap.ts`, `components/shell/SiteFooter.tsx`,
`components/experience/palette-model.ts` y el traslado de las tarjetas ADR.

## Lanes

| Lane | Alcance | Historias / requisitos | Depende de | Puerto e2e |
|---|---|---|---|---|
| **X0** Foundation del laboratorio | Página, tarjeta, consentimiento, almacenamiento, harness de workers, catálogo, namespace `ailab`, enmiendas A-701 a A-708 y OG | US1, FR-301 a FR-313, FR-322, FR-330, FR-370 a FR-372 | 004 integrada | 3130 |
| **X1** Voz | V1, V4, V2 y V3 | US2, US5, US10, FR-350, FR-351, FR-359 | `x0-frozen` | 3131 |
| **X2** Plugins y búsqueda | A2, A3 y A5 | US3, US8, FR-352, FR-353, FR-357 | `x0-frozen` | 3132 |
| **X3** Simulaciones y vitrinas | R1 y A4 | US4, US9, FR-354, FR-358 | `x0-frozen` | 3133 |
| **X4** Juegos | J1 y J2 | US6, US7, FR-355, FR-356, FR-341, FR-332 | `x0-frozen` | 3134 |
| **X5** QA del laboratorio | Red (0 bytes antes del consentimiento y nada sale del equipo), fps, axe, responsive, teclado y movimiento reducido | SC-301 a SC-307 | `x0-frozen` (corre completa al integrar) | 3135 |

**Orden de integración**: X0 → X3 → X2 → X1 → X4 → X5. Van primero los que no descargan nada, para que la página
salga útil cuanto antes.

**Relación con otras specs**:
- La 003 se implementa **después de integrar la 004**: usa su registro de comandos, las tarjetas ADR, la plantilla OG
  y el footer.
- Con la 005 no comparte rutas.
- El motor de V3 (X1) desbloquea la tarea T628 de la 005 cuando el autor elija el camino A para P-505.

### Contratos entre lanes (se congelan con `x0-frozen`)

| Contrato | Proveedor | Consumidores | Forma |
|---|---|---|---|
| Tarjeta | X0 | X1 a X4 | `<LabCard experiment={id}>` con ranuras `demo`, `how` y `code`. La demo se importa con `next/dynamic` y `ssr: false` |
| Consentimiento | X0 | X1, X2 y X3 | `await requestDownload({ experiment, resource, bytes, host })` resuelve `true` o `false`. Registra el consentimiento de la sesión |
| Workers | X0 | X1 a X4 | `createLabWorker(url)`: pausa con `visibilitychange`, cancelación con `AbortSignal` y mensajes con tipo |
| Almacenamiento | X0 | X1 y X4 | `labStore.get/set/clear`, con IndexedDB, versión y `clearAll()` para FR-312 |
| Comandos de voz | 004 (paleta) vía A-703 | X1 | `runPaletteCommand(id)` del registro de la 004 |

## Enmiendas (A-7xx; X0 las ejecuta)

| ID | Cambio | Dueño original |
|---|---|---|
| A-701 | `namespaces` suma `'ailab'` en `lib/i18n/config.ts` | R0 / 004 P0 |
| A-702 | Tipos `LabExperiment`, `LabDownload` y `LabTheme` en `content/types.ts` (modelo de datos abajo) | 004 P0 |
| A-703 | La paleta registra "Abrir el AI Lab" y expone `runPaletteCommand(id)` para V4 | 004 P6 (`components/experience/**`) |
| A-704 | `AdrCards` pasa de `components/site/portfolio/` a `components/ui/`, y el caso de estudio lo importa desde ahí | 004 P4 |
| A-705 | El footer enlaza a `/ai-lab` | 004 P0 (`components/shell/**`) |
| A-706 | La política de privacidad suma la sección del laboratorio (FR-322) | 004 P0 (`content/site.ts`) |
| A-707 | `/ai-lab` en `PUBLIC_PATHS` de `app/sitemap.ts` | 004 P0 |
| A-708 | `@huggingface/transformers` en `package.json`, con la justificación de arriba y la aprobación del orquestador (P-3k) | Foundation |

## Modelo de datos

```ts
export type LabTheme = 'voice' | 'architecture' | 'agents' | 'games'

export type LabStatus = 'stable' | 'beta' | 'experiment'

export type LabDownload = { resource: string; bytes: number; host: 'huggingface.co' | 'cdn.jsdelivr.net' }

export type LabExperiment = {
  id: 'V1' | 'V2' | 'V3' | 'V4' | 'A2' | 'A3' | 'A4' | 'A5' | 'R1' | 'J1' | 'J2'
  theme: LabTheme
  title: Localized
  summary: Localized
  status: LabStatus
  runsIn: 'browser'
  downloads: LabDownload[]
  privacy: Localized
  adrCards: AdrCard[]
  code: { snippet: string; lang: string; repoPath: string | null }
}
```

- **Catálogo**: `content/ailab/catalog.ts` lleva los 11 experimentos del alcance. `runsIn` es siempre `'browser'` en
  este plan; `'server'` llega solo con HC-1.
- **Pesos**: salen de research §2 a §4 y se verifican al implementar.
  - Whisper: tiny ≈ 41 MB, base ≈ 77 MB y small ≈ 249 MB, en int8.
  - Pyodide: núcleo ≈ 12 MB más numpy ≈ 3,1 MB.
  - e5-small: ≈ 118 MB.
- **Estado de juego** en IndexedDB:
  - `{ version: 1, mode: 'rival' | 'clone', weights: Float32Array[], curve: number[], updatedAt }`;
  - una versión distinta se descarta.
- **Consentimiento** en `sessionStorage`: `cw-ailab-consent` = lista de `experiment:resource`.
- **Comandos de voz**: `content/ailab/voice-commands.ts`, con `{ phrases: Localized<string[]>, command: PaletteCommandId }`.

## Decisiones técnicas

| ID | Decisión | Alternativa descartada |
|---|---|---|
| R-701 | **Modelo de V1**: el por defecto se fija midiendo SC-303. La hipótesis es base para ES y EN, con tiny de respaldo. Small se ofrece como "más preciso", con su peso | Small por defecto: 249 MB es mucho para una primera prueba en móvil |
| R-702 | **V4** usa el modelo de V1 (tiny) y un emparejador de frases contra `voice-commands.ts`, sin modelo de lenguaje | Web Speech API: manda el audio a un servicio |
| R-703 | **A5 en modo palabras** usa el índice que ya existe (minisearch) y muestra el puntaje y el texto del fragmento. **El modo por significado** precalcula los vectores en el build solo si la medición de T730 da menos de 60 s extra y sin descargar el modelo en cada build. Si no, el modo se cae y queda BM25 | Vectores generados a mano y versionados: exigen un paso manual en cada cambio de contenido (principio VIII) |
| R-704 | **J1 y J2**: física determinista en el hilo principal con `requestAnimationFrame` y a lo sumo 60 Hz. **J1**: la red (2 capas de 16 neuronas) aprende por refuerzo (REINFORCE con línea base) en un worker. **J2**: la misma red se ajusta por imitación sobre pares estado → movimiento del jugador. Los pesos viajan al hilo principal cada N rallies | TensorFlow.js: más de 1 MB para una red de este tamaño |
| R-705 | **Pyodide** se carga desde jsDelivr con la versión fija, dentro de un worker de módulo, con `loadPackage('numpy')` | Autoalojarlo en `public/`: suma unos 15 MB al repo |
| R-706 | **Workers**: cada experimento tiene uno solo, y como máximo dos corren a la vez. Se pausan con la pestaña oculta y se terminan al cerrar la tarjeta | Un pool compartido: más difícil de liberar y de probar |
| R-707 | **CSP**: hoy no hay. Si se agrega en otra spec, debe permitir `wasm-unsafe-eval`, `worker-src blob:` y los dos CDN | — |

## Complexity Tracking

| Elemento | Por qué hace falta | Alternativa más simple descartada |
|---|---|---|
| Dependencia `@huggingface/transformers` | Reconocimiento de voz local para V1 y V4, la app 1 que pidió el autor | Web Speech API: no cumple "nada sale del dispositivo". Queda como respaldo si P-3k dice que no |
| Dos CDN en tiempo de ejecución | Pesos y Pyodide no caben en el repo | Ninguna sin servidor propio, y eso sería camino B |
