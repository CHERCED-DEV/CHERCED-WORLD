# Contrato X0: base del laboratorio de IA de la 003

**Dueño**: X0 · **Estado**: congelado en el tag `x0-frozen` · **Base**: [contracts-p0.md de la
004](../004-contenido-presente/contracts-p0.md), [contracts-m0.md de la 006](../006-movil-vivo/contracts-m0.md),
[contracts-q0.md de la 005](../005-blog/contracts-q0.md), [spec.md](./spec.md) y [plan.md](./plan.md)

**Tag**: `x0-frozen` apunta al último commit de `lane/X0`, el que agrega este documento, con `npm run verify`,
`npm run test:fast` (1420 unitarias, 84 de ellas de x0, y 58 de humo) y las e2e de x0, p0 y p6 en verde (102 pasan; las
105 saltadas son de otro proyecto). `npm audit` solo reporta las 8 moderadas que ya estaban.

Todo lo de la 001, la 002, la 004, la 005 y la 006 sigue vigente. X0 agrega la página `/[lang]/ai-lab`, el formato de
tarjeta, el consentimiento, el almacenamiento, el harness de workers, el catálogo y las enmiendas A-701 a A-708. Las
lanes X1 a X4 programan contra este documento. Si falta algo, se pide como enmienda a X0.

## 1. Tipos (`content/types.ts`, A-702)

| Tipo | Forma | Notas |
|---|---|---|
| `LAB_THEMES`, `LabTheme` | `'voice' \| 'architecture' \| 'agents' \| 'games'` | En el orden de la página. |
| `LAB_STATUSES`, `LabStatus` | `'stable' \| 'beta' \| 'experiment'` | |
| `LAB_EXPERIMENT_IDS`, `LabExperimentId` | `'V1' \| 'V2' \| 'V3' \| 'V4' \| 'A2' \| 'A3' \| 'A5' \| 'R1' \| 'A4' \| 'J1' \| 'J2'` | En el orden de las lanes: X1, X2, X3 y X4. `isLabExperimentId(value)`. |
| `LAB_HOSTS`, `LabHost` | `'huggingface.co' \| 'cdn.jsdelivr.net'` | Los dos únicos servidores de descarga. |
| `LabDownload` | `{ resource, bytes, host, default?: true }` | **D-X1**: `default` marca la descarga que pide "Probar" (§4.2). |
| `LabCode` | `{ snippet, lang, repoPath: string \| null }` | |
| `LabExperiment` | `{ id, theme, title, summary, status, runsIn: 'browser', downloads, privacy, flow: Localized[], adrCards: AdrCard[], code: LabCode \| null }` | **D-X2**: suma `flow` (el diagrama pequeño) y `code` acepta `null`. |

## 2. Catálogo (`content/ailab/catalog.ts`, T704)

| Export | Forma |
|---|---|
| `labCatalog` | Los 11 experimentos, en el orden de `LAB_EXPERIMENT_IDS`. |
| `labExperiment(id)` | El experimento; lanza si no existe. |
| `labThemes(catalog?)` | `{ theme, experiments }[]` en el orden de `LAB_THEMES`: voz (V1 a V4), arquitectura (R1), agentes (A2, A3, A5 y A4) y juegos (J1 y J2). |
| `defaultDownload(experiment)` | La descarga con `default`, o `null`. |
| `labRepoHref(repoPath)` | `https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main/{repoPath}`. También `LAB_REPO_URL` y `LAB_REPO_BRANCH`. |
| `WHISPER_TINY`, `WHISPER_BASE`, `WHISPER_SMALL`, `E5_SMALL`, `PYODIDE_CORE`, `PYODIDE_NUMPY` | Las descargas, para que X1, X2 y X3 pidan el consentimiento con el mismo recurso y el mismo peso que muestra la tarjeta. |

- `title`, `summary` y `privacy` salen de `ailab.json` (`ailab.<id>.title`, `.summary` y `.privacy`): una sola fuente.
  `flow` y `adrCards` son `Localized` en el catálogo, como los casos del portafolio.
- **Pesos** (research §2 a §4, decimales): Whisper tiny 41 MB, base 77 MB y small 249 MB (int8, `huggingface.co`);
  multilingual-e5-small 118 MB; Pyodide 0.29.0 12 MB y numpy 3,1 MB (`cdn.jsdelivr.net`).
- **Por defecto**: V1 pide base al probar (R-701) y V4, tiny (R-702). A5 (e5) y A4 (Pyodide) no tienen `default`: su
  descarga es opcional y la pide la demo cuando el visitante la elige.
- **Estados** (propuesta, revisión del autor): V1, V2, V3, A5 y A4 `beta`; A2, A3 y R1 `stable`; V4, J1 y J2
  `experiment`.
- **Decisiones**: salen de R-701 a R-706, la spec, el catálogo y el research, sin datos nuevos. Pendientes de revisión
  del autor (T704).
- **Código**: V1, V4, A5, J1 y J2 muestran un fragmento real de la base en la que se apoyan (consentimiento, paleta,
  búsqueda, pausa del worker y estado con versión). V2, V3, A2, A3, R1 y A4 van con `code: null` y la tarjeta no pinta
  "El código". **Cada lane reemplaza el `code` de sus experimentos por un fragmento de su propio código** (§12):
  `tests/unit/x0/catalog.test.ts` exige que el fragmento exista tal cual en `repoPath`.

## 3. Copy (`content/i18n/{es,en}/ailab.json`, A-701)

`'ailab'` está en `namespaces` y en el cargador de `lib/i18n/server.ts`; la paridad la cuida
`tests/unit/l0/i18n-parity.test.ts` y el uso, `tests/unit/p7/i18n-usage.test.ts`.

| Grupo | Claves |
|---|---|
| Copy base de la spec (palabra por palabra) | `ailab.title`, `.intro`, `.plugins`, `.privacy`, `.runsIn.browser`, `.consent.{title,body,accept,cancel}`, `.clear`, `.noscript`, y título y resumen de V1, V4, R1, A2, J1 y J2 |
| Página | `ailab.meta.description`, `.privacy.more`, `.theme.{voice,architecture,agents,games}`, `.themes.label` |
| Tarjeta | `ailab.status.{label,stable,beta,experiment}`, `.part.{try,how,code,privacy}`, `.how.{flow,decisions}`, `.code.{file,repo}`, `.downloads.{title,none,item,optional}` |
| Probar | `ailab.try.{open,label,close,loading,failed,soon}`, `.consent.{clearHint,declined,granted,revoke,revoked}` |
| Borrar | `ailab.clear.{hint,done,partial}` |
| Compartido con las demos | `ailab.worker.{evicted,paused}`, `ailab.storage.unavailable` |
| Por experimento | `ailab.<id>.{title,summary,privacy}` para los 11. El título y el resumen de V2, V3, A3, A4 y A5 se escribieron con el texto del catálogo y la spec, sin datos nuevos |

- Las tarjetas Decisión · Por qué · Trade-off usan `project.adr.{decision,why,tradeoff}` de `site`, y el botón de copiar
  código, `code.{copy,copied,copyError}` de `blog`.
- **Marcadores**: `ailab.consent.body` lleva `{resource}`, `{size}` y `{host}`; `ailab.consent.granted`, `{resource}`;
  `ailab.downloads.item`, `{resource}`, `{size}` y `{host}`; `ailab.try.label`, `{title}`; `ailab.code.file`, `{path}`.
- Las claves de cada experimento van agrupadas por lane: X1 (V1 a V4), X2 (A2, A3 y A5), X3 (R1 y A4) y X4 (J1 y J2).
  `common` suma `nav.aiLab` ("AI Lab" en los dos idiomas) para el footer y el título de la página.

## 4. Página y tarjeta (`components/ailab/shell/`, T705, T706)

### 4.1 Página

- `app/[lang]/ai-lab/page.tsx`: renderizada en el servidor y estática, con `pageMetadata({ path: '/ai-lab', title:
  nav.aiLab, description: ailab.meta.description, ogImageFile: true })` y `BackgroundIntensity value="subtle"`. El fondo
  animado no cambia.
- `app/[lang]/ai-lab/opengraph-image.tsx`: la plantilla de la 004 con "AI LAB" y la descripción (`aiLabOg(lang)` en
  `components/ailab/shell/og.ts`). Queda en `/{lang}/ai-lab/opengraph-image/og`.
- `LabPage({ lang })` (Server, async) arma `LabPageView`: `h1` "AI LAB", intro, la línea de privacidad con enlace a
  `/{lang}/privacy`, los accesos a los cuatro temas (`#ailab-<tema>`), el botón de borrar (§6), una `section` por tema con
  su `h2` y sus tarjetas, y un único `ConsentDialog`. El texto de los plugins por profesión abre el tema de agentes. En
  `lg` la grilla es de dos columnas; una tarjeta sola o con la demo abierta ocupa las dos.

### 4.2 Tarjeta

```tsx
<LabCard lang="es" experiment="V1" />
<LabCard lang="es" experiment="R1" demo={…} how={…} code={…} />
```

| Pieza | Props | Notas |
|---|---|---|
| `LabCard` (Server, async) | `{ lang, experiment: LabExperimentId \| LabExperiment, demo?, how?, code? }` | Carga sus diccionarios y pinta `LabCardView`. |
| `LabCardView` (Server, síncrona) | `{ lang, experiment, labels, tryLabels, copy, demo?, how?, code? }` | Para pruebas con `renderToStaticMarkup` (envuelta en `ToastProvider`). Los labels salen de `labCardLabels`, `labTryLabels` y `labDemoCopy` (`labels.ts`). |
| `StatusBadge`, `RunsInBadge` | `{ status, label, prefix }`, `{ runsIn, label }` | El estado se lee "Estado: Beta". |

Orden de la tarjeta, que es un `article#lab-<id>` con `aria-labelledby` (cristal `standard` con borde, grano, profundidad,
luz, barrido y `float={1}`; en `< md` queda sólida por el presupuesto de la 006):

1. `h3` con el título, el estado y "Corre en tu navegador".
2. El resumen y la línea de privacidad del experimento.
3. **Pruébalo** (`h4`): qué descarga, con peso y servidor (o "No descarga nada."); la ranura `demo` o, si no viene,
   `LabTry`; y el aviso sin JS (`ailab.noscript`), que solo se ve con `:root:not([data-js])`.
4. **Cómo funciona** (`details`): la ranura `how` o el recorrido de tres pasos más las tarjetas ADR.
5. **El código** (`details`, solo si hay código): la ranura `code` o el fragmento con `CodeBlock` del blog y el enlace
   al archivo en GitHub.

### 4.3 `LabTry` y el registro de demos (FR-304)

- "Probar" (`button[data-cw-lab-open]`, nombre accesible "Probar {título}", descrito por la lista de descargas):
  1. Si el experimento tiene una descarga `default`, llama `requestDownload` con ella. Si el visitante dice "Ahora no",
     la tarjeta lo explica (`[data-cw-lab-declined]`, `role="status"`) y "Probar" sigue ahí.
  2. Monta la demo dentro de `[data-cw-lab-stage]` (región con foco) con `consent` en `true` si hubo descarga aceptada.
  3. "Cerrar la demo" la desmonta (sus workers se terminan, §7) y devuelve el foco a "Probar".
- Con permiso en la sesión, la tarjeta dice "Diste permiso para descargar {resource} en esta sesión." y ofrece
  "Retirar el permiso", que lo borra, cierra la demo si dependía de él y lo confirma con un toast.
- "Borrar lo que el laboratorio guardó" cierra todas las demos abiertas.
- Sin demo registrada se ve "La demo está en el taller…" (`[data-cw-lab-soon]`). Si la demo no carga, "No pude cargar
  la demo…" con un botón para reintentar.
- **Registro**: `labDemos` (`components/ailab/shell/demos/index.ts`) une un archivo por lane. En `x0-frozen` los cuatro
  están vacíos:

```ts
// components/ailab/shell/demos/x1-voice.ts (de X1 desde x0-frozen)
import { labDemo } from '../demo-loader'
import type { LabDemoRegistry } from '../types'

export const x1Demos: LabDemoRegistry = {
  V1: labDemo(() => import('@/components/ailab/voice/Transcriber')),
}
```

`labDemo(load)` envuelve `next/dynamic` con `ssr: false` y el "Cargando la demo…" del shell. `load` devuelve el módulo
con `default` o el componente (`import('…').then((mod) => mod.Transcriber)`). El código de la demo se descarga solo al
pulsar "Probar".

```ts
type LabDemoProps = {
  lang: Locale
  experiment: LabExperimentId
  consent: boolean
  downloads: LabDownload[]
  t: (key: string, vars?: Record<string, string | number>) => string
}
```

`t` resuelve las claves `ailab.<id>.*` del experimento más `ailab.worker.*` y `ailab.storage.unavailable`; otra clave
lanza `MissingTranslationError`.

## 5. Consentimiento (`lib/ailab/core/consent.ts`, T707, FR-310, FR-311)

```ts
const ok = await requestDownload({ experiment: 'V1', resource: WHISPER_SMALL.resource, bytes: WHISPER_SMALL.bytes, host: WHISPER_SMALL.host })
if (!ok) return
```

| Export | Forma |
|---|---|
| `requestDownload(request)` | `Promise<boolean>`. Si ya hay permiso en la sesión, `true` sin preguntar. Si no, abre el diálogo y guarda el sí. Sin diálogo montado, `false`: nunca se descarga sin preguntar. Dos pedidos iguales comparten la respuesta; pedidos distintos esperan su turno (un diálogo a la vez). Lanza `TypeError` si el experimento no existe, el recurso está vacío, `bytes` no es un entero positivo o el servidor no está en `LAB_HOSTS`. |
| `toDownloadRequest(experiment, download)` | De `LabDownload` al pedido. |
| `hasConsent`, `consentedResources(experiment)`, `consentedKeys()` | Lectura. |
| `grantConsent`, `withdrawConsent(experiment, resource?)`, `clearConsent()` | Escritura; sin `resource` retira todo el experimento. |
| `onConsentChange(listener)` | Devuelve la baja. |
| `setConsentPresenter(present)` | Lo usa `ConsentDialog`. `setConsentStorage(storage)` es para pruebas. |

- Vale por experimento y por recurso, y por sesión: `sessionStorage['cw-ailab-consent']` = JSON de `experiment:resource`.
  Con el almacenamiento bloqueado, el permiso vive en memoria hasta recargar.
- `ConsentDialog`: `Dialog mobileSheet` (hoja abajo en `< md`, centrado desde `md`) con "Antes de descargar", el cuerpo
  `ailab.consent.body` (qué, cuánto pesa con `formatBytes`, de qué servidor y que queda en el navegador), la nota de cómo
  borrarlo y los botones "Ahora no" (`[data-cw-lab-consent-cancel]`, primero en el orden del foco) y "Descargar y
  probar" (`[data-cw-lab-consent-accept]`). Esc y tocar fuera cuentan como "Ahora no".
- `formatBytes(bytes, lang)` (`lib/ailab/core/format.ts`): "77 MB", "3,1 MB" / "3.1 MB", "512 kB".

## 6. Almacenamiento (`lib/ailab/core/store.ts`, T709, FR-312, FR-313)

| Export | Forma |
|---|---|
| `labStore.get<T>(key, { version? })` | `T \| null`. Con `version`, un valor cuya `version` no coincide se borra y devuelve `null`. |
| `labStore.set(key, value)` | `true` si quedó en IndexedDB; `false` si quedó solo en memoria (modo privado): muestra entonces `ailab.storage.unavailable`. |
| `labStore.delete(key)`, `labStore.clear()`, `labStore.persistent()` | |
| `clearAll()` | `{ database, caches, complete }`. Cierra la conexión, borra la base `cw-ailab`, las cachés `transformers-cache` y `cw-ailab*`, la memoria y el consentimiento, y avisa con `onLabCleared`. |
| `onLabCleared(listener)`, `isLabCache(name)`, `LAB_DB_NAME`, `LAB_DB_VERSION`, `LAB_DB_STORE`, `LAB_CACHE_PREFIXES` | `setLabStorageEnv(env)` es para pruebas. |

- IndexedDB `cw-ailab`, versión 1, store `games`. Claves sugeridas: `J1:rival` y `J2:clone`, con
  `{ version, mode, weights, curve, updatedAt }` (plan, modelo de datos). Los valores pasan por el clon estructurado:
  `Float32Array` sirve.
- Nada se abre al cargar la página: la base se crea la primera vez que una demo guarda algo.
- Una caché propia de una lane debe llamarse `cw-ailab-<algo>` para que el botón la borre. La caché HTTP del navegador
  (Pyodide, los `.wasm` de ONNX Runtime) no se puede borrar desde JS.
- `LabClearButton` (`[data-cw-lab-clear]`, solo con JS) llama `clearAll()` y confirma con un toast:
  `ailab.clear.done` o, si algo no se pudo borrar, `ailab.clear.partial`.

## 7. Workers (`lib/ailab/core/worker*.ts`, T708, FR-330, R-706)

```ts
// lib/ailab/voice/whisper.worker.ts: el único lugar donde se importa @huggingface/transformers
import { serveLabWorker } from '@/lib/ailab/core/worker-runtime'

serveLabWorker<Input, Output, Progress>(async (input, { signal, progress, checkpoint }) => {
  progress({ loaded: 0.5 })
  await checkpoint()
  return output
})
```

```tsx
// En la demo (Client Component)
const worker = useLabWorker<Input, Output, Progress>(
  () => new Worker(new URL('../../../lib/ailab/voice/whisper.worker.ts', import.meta.url), { type: 'module' }),
  { experiment: 'V1', onEvict: () => setNotice(t('ailab.worker.evicted')) },
)
const text = await worker().call(input, { signal, onProgress })
```

| Export | Forma |
|---|---|
| `createLabWorker(source, { experiment, onEvict?, onPause? }, env?)` | `LabWorker`. `source` es la fábrica `() => new Worker(new URL(…, import.meta.url), { type: 'module' })` (el bundler necesita ese patrón literal) o una URL. |
| `LabWorker.call(payload, { signal?, onProgress?, transfer? })` | `Promise<Out>`. Abortar manda `cancel` y rechaza con `AbortError`; un error del worker llega con su `name` y su `message`. |
| `LabWorker.state`, `LabWorker.terminate()` | `'running' \| 'paused' \| 'terminated'`. |
| `useLabWorker(source, options)` (`use-lab-worker.ts`) | Devuelve un getter: crea el worker al primer uso, lo recrea si lo desalojaron y lo termina al desmontar. |
| `serveLabWorker(handler, scope?)` (`worker-runtime.ts`) | El lado del worker. `handler(payload, { signal, paused, progress, checkpoint })`. Devuelve `transfer(value, [buffers])` para transferir. |
| `MAX_ACTIVE_WORKERS` (2), `activeLabWorkers()`, `terminateLabWorkers(experiment?)`, `LabWorkerError` (`reason`: `evicted`, `terminated` o `crashed`) | |

- **Pausa**: con `visibilitychange` el harness manda `pause` y `resume`; `checkpoint()` espera mientras está en pausa y
  lanza `AbortError` si cancelaron. Llama `checkpoint()` entre pasos (cada lote de entrenamiento, cada fragmento de
  audio). Un worker que nace con la pestaña oculta nace en pausa.
- **Límites**: uno por experimento (crear otro termina el anterior) y dos vivos como máximo: el tercero desaloja al
  menos usado, que recibe `onEvict` y ve sus llamadas rechazadas con `LabWorkerError('evicted')`.
- Si el worker se cae (`error`), lo pendiente se rechaza con `crashed` y el lugar se libera.
- **Verificado en el build** con un worker de prueba (sin commit): Turbopack empaqueta
  `new Worker(new URL('./x.worker.ts', import.meta.url), { type: 'module' })` como `turbopack-worker-*.js`, y
  `useLabWorker` con `serveLabWorker` devuelve el resultado en la página de producción. `new URL` necesita una ruta
  relativa: el alias `@/` no sirve ahí.
- Los mensajes llevan `cw` (`call`, `cancel`, `pause`, `resume`, `progress`, `result`, `error`); el protocolo está en
  `worker-protocol.ts`. Las pruebas usan dobles conectados al runtime real (`tests/unit/x0/worker.test.ts`); ningún
  modelo se descarga en CI.

## 8. Paleta (`components/experience/palette-model.ts`, A-703, FR-451)

| Export | Forma |
|---|---|
| `buildCommands(labels, context)` | `context.aiLab` (opcional) suma `action:ai-lab`, "Abrir el AI Lab" / "Open the AI Lab", en el grupo **Páginas**. Aparece con la paleta vacía y al buscar "laboratorio", "ai lab" o "experimentos". El modo `>` sigue con los siete comandos que fijan las pruebas de P6 (D-X4). |
| `runPaletteCommand(id)` | `boolean`. Ejecuta el comando del registro con ese id, sin abrir la paleta: páginas (`page:blog`, `page:portfolio`…), acciones (`action:theme`, `action:lang`, `action:cv`, `action:now`, `action:ai-lab`…) y extensiones. `false` si no hay corredor montado o el id no existe. |
| `findPaletteCommand(id)` | El `PaletteItem` o `null`, para mostrar qué se va a ejecutar. |
| `PaletteCommandId` | La unión de ids conocidos. |
| `executePaletteCommand(command, effects)`, `registerPaletteRunner(runner)` | El único switch que ejecuta un comando: lo usan la paleta y el corredor que monta `ExperienceClient` en todas las páginas. |

`action:theme` alterna el tema (como en la paleta). Si V4 necesita "tema claro" y "tema oscuro" por separado, es una
enmienda a A-703.

## 9. Enmiendas que tocan piezas de otras specs

| ID | Qué cambió | Dónde |
|---|---|---|
| A-704 | `AdrCards` vive en `components/ui/AdrCards.tsx` (`{ cards, labels, className?, cardClassName?, columns?: 1 \| 2 }`, más `AdrCardView` y `AdrLabels`). El caso de estudio lo importa desde ahí y conserva en `components/site/portfolio/AdrCards.module.scss` solo el apilado sticky de `< md`. Marcado igual (`data-cw-adr-cards`, `data-cw-adr`, `data-cw-adr-field`). | `components/ui/`, `components/site/portfolio/` |
| A-705 | Footer: enlace "AI Lab" a `/{lang}/ai-lab` (`[data-cw-footer-ai-lab]`), junto a "Ahora". `ShellLabels` suma `aiLab`. | `components/shell/` |
| A-706 | Privacidad: sección "El laboratorio de IA" / "The AI Lab"; `updatedAt` pasa a `2026-11-05`. | `content/site.ts` |
| A-707 | `/ai-lab` en `PUBLIC_PATHS` del sitemap, en ES y EN. | `app/sitemap.ts` |
| A-708 | `@huggingface/transformers` `4.3.2`, versión exacta. `.npmrc` fija `onnxruntime-node-install=skip` (D-X5). | `package.json`, `package-lock.json`, `.npmrc` |

El menú principal **no cambia**: P-3h sigue abierta y T717 bloqueada. Se llega por la paleta y el footer (FR-301).

## 10. Atributos `data-cw-*` nuevos

`data-cw-ailab`, `data-cw-ailab-privacy`, `data-cw-ailab-theme`, `data-cw-ailab-theme-link`, `data-cw-lab-card`,
`data-cw-lab-theme`, `data-cw-lab-status`, `data-cw-lab-runs`, `data-cw-lab-privacy`, `data-cw-lab-part` (`try`, `how`,
`code`), `data-cw-lab-downloads`, `data-cw-lab-download` (`default` u `optional`, con `data-bytes`),
`data-cw-lab-noscript`, `data-cw-lab-try` (con `data-phase`: `idle`, `asking`, `declined` u `open`), `data-cw-lab-open`,
`data-cw-lab-stage`, `data-cw-lab-close`, `data-cw-lab-loading`, `data-cw-lab-soon`, `data-cw-lab-failed`,
`data-cw-lab-declined`, `data-cw-lab-granted`, `data-cw-lab-revoke`, `data-cw-lab-flow`, `data-cw-lab-code`,
`data-cw-lab-repo`, `data-cw-lab-clear`, `data-cw-lab-consent`, `data-cw-lab-consent-text`, `data-cw-lab-consent-accept`,
`data-cw-lab-consent-cancel` y `data-cw-footer-ai-lab`.

## 11. Contratos entre lanes (los del plan, ya con su forma final)

| Contrato | Proveedor | Consumidores | Forma |
|---|---|---|---|
| Tarjeta | X0 | X1 a X4 | `<LabCard lang experiment={id} demo? how? code? />`; la demo entra por `labDemo(() => import(…))` en el archivo de la lane (§4.3) |
| Consentimiento | X0 | X1, X2 y X3 | `await requestDownload({ experiment, resource, bytes, host })` (§5) |
| Workers | X0 | X1 a X4 | `useLabWorker(() => new Worker(new URL(…, import.meta.url), { type: 'module' }), { experiment })` y `serveLabWorker` (§7) |
| Almacenamiento | X0 | X1 y X4 | `labStore.get(key, { version })`, `set`, `delete`, `clear`, `clearAll()` y `onLabCleared` (§6) |
| Comandos de voz | 004 vía A-703 | X1 | `runPaletteCommand(id)` y `findPaletteCommand(id)` (§8) |

## 12. Para X1 a X4

Cada lane toca, además de sus rutas, **solo su parte** de tres archivos de X0 (D-X3): su archivo en
`components/ailab/shell/demos/`, el bloque de sus experimentos en `ailab.json` (ES y EN) y la entrada de sus experimentos
en `content/ailab/catalog.ts` (el `code`, el estado y, si hace falta, las descargas). Así los merges no chocan.

- **X1 (voz)**: `demos/x1-voice.ts`. V1 ya pide `WHISPER_BASE` al probar; para tiny o small, llama `requestDownload` con
  `WHISPER_TINY` o `WHISPER_SMALL` antes de cargarlos. T723 fija el modelo por defecto moviendo `default` en el catálogo.
  V4 pide `WHISPER_TINY` y usa `runPaletteCommand`: el corredor se registra cuando la página queda en reposo, así que
  antes de eso devuelve `false` (D-X6). Avisa la voz en línea de V2 y V3 antes de reproducir (FR-321).
  `@huggingface/transformers` va solo dentro de `*.worker.ts`; X1 es la primera lane que lo empaqueta de verdad.
- **X2 (plugins y búsqueda)**: `demos/x2-plugins.ts`. A2 y A3 no descargan nada. A5 abre en BM25 y pide `E5_SMALL`
  solo si el visitante elige "por significado"; si T730 no cumple R-703, quita `E5_SMALL` de A5 y la segunda tarjeta ADR.
- **X3 (sagas y vitrinas)**: `demos/x3-saga.ts`. R1 no descarga nada. Obra pide `PYODIDE_CORE` y `PYODIDE_NUMPY` antes
  de cargar Pyodide; Despacho no pide nada.
- **X4 (juegos)**: `demos/x4-games.ts`. Guarda con `labStore` y `version`, escucha `onLabCleared` para reiniciar al rival
  y muestra `ailab.storage.unavailable` cuando `set` devuelve `false`. El entrenamiento usa `checkpoint()`.
- **Todas**: el texto de la demo va en `ailab.<id>.*` y se pide con `t('ailab.<id>.…')` literal (así lo encuentra la prueba
  de uso de p7). La demo se monta dentro de la tarjeta: nada de `h1` ni `h2`, y nada `fixed` sin sumar
  `--cw-dock-space`. Nada sale del navegador (FR-320): X5 lo audita.

## 13. Desviaciones del plan

| ID | Qué | Por qué |
|---|---|---|
| D-X1 | `LabDownload` suma `default?: true` | El escenario 3 de US1 pide el diálogo al pulsar "Probar", pero A5 y A4 descargan solo una parte opcional. `default` dice qué descarga pide "Probar"; las demás las pide la demo |
| D-X2 | `LabExperiment` suma `flow` y `code` acepta `null` | El "diagrama pequeño" de la tarjeta necesita datos; y un fragmento "real" no puede existir antes del código de su lane |
| D-X3 | Tres puntos de enganche compartidos: un archivo de demos por lane, el bloque de cada lane en `ailab.json` y su entrada en el catálogo | Las e2e de cada lane necesitan su demo en la página real, y T723 ya hace que X1 edite el catálogo. Con un archivo y un bloque por lane, los merges no chocan. **Lo aprueba el orquestador** |
| D-X4 | "Abrir el AI Lab" va en el grupo Páginas, no como comando `>` ni como extensión | Las e2e congeladas de P6 fijan los siete comandos de `>`; una extensión registrada en todas las páginas los rompía. Sigue saliendo con la paleta vacía y al buscarlo |
| D-X5 | `.npmrc` con `onnxruntime-node-install=skip` | `@huggingface/transformers` trae `onnxruntime-node`, que en Linux x64 (el build de Vercel) descarga los binarios de CUDA desde NuGet en cada instalación. El laboratorio solo usa `onnxruntime-web`. npm 11 avisa "Unknown project config" y dice que dejará de leerlo en su próxima versión mayor: revisar al pasar a npm 12 |
| D-X6 | `runPaletteCommand` necesitó tocar `CommandPalette.tsx` y `ExperienceClient.tsx` además de `palette-model.ts` | Ejecutar un comando fuera de la paleta exige un corredor montado en todas las páginas; el switch quedó en un solo lugar (`executePaletteCommand`). `ExperienceClient` carga `palette-model` con `import()` en reposo, como la paleta: importarlo directo metía minisearch en el bundle de todas las páginas y las primeras e2e de p6 en frío no alcanzaban a cargar el índice |
| D-X7 | `tests/contract/signatures.ts` y `tests/unit/p7/i18n-usage.test.ts` cambian una línea cada una | A-701 cambia la unión de `Namespace`; `palette.action.aiLab` ya tiene uso y la prueba de p7 pide sacarla de sus excepciones |
| D-X8 | Las demos de X0 no existen: "Probar" monta "La demo está en el taller" | Es lo que hay en `x0-frozen`; cada lane registra la suya |

## 14. Pruebas que protegen este contrato

| Prueba | Qué cuida |
|---|---|
| `tests/unit/x0/consent.test.ts` | Sin diálogo no descarga; pregunta con recurso, peso y servidor; sesión; "Ahora no"; un diálogo a la vez; retirar; almacenamiento bloqueado; pedidos mal formados |
| `tests/unit/x0/store.test.ts` | IndexedDB `cw-ailab`/`games`, versión, respaldo en memoria y `clearAll` completo y parcial |
| `tests/unit/x0/worker.test.ts` | Mensajes, progreso, `AbortSignal`, pausa, dos vivos, uno por experimento, terminación, caída, errores y `transfer` |
| `tests/unit/x0/catalog.test.ts` | Copy base de la spec palabra por palabra, los 11 y sus temas, pesos, servidores, `default`, fragmentos reales y nada confidencial |
| `tests/unit/x0/palette.test.ts` | "Abrir el AI Lab" en Páginas y fuera de `>`, `runPaletteCommand` y el switch único |
| `tests/unit/x0/shell.test.ts` | Tarjeta y página renderizadas, ranuras, copy de cada demo, cuerpo del consentimiento, `formatBytes` y OG |
| `tests/unit/x0/deps.test.ts` | Versión exacta, `@huggingface/transformers` solo en `*.worker.ts` y `.npmrc` |
| `tests/e2e/x0/ai-lab.spec.ts` | ES y EN; 0 descargas pesadas al cargar (SC-301); sin JS; consentimiento (cancelar, Esc, aceptar, retirar, en inglés); sin descargas; teclado; borrar; footer; axe en claro y oscuro; hoja en móvil y sin desbordes; sitemap y OG |

## 15. Impacto en pruebas de otras lanes

| Prueba | Qué pasa | Estado |
|---|---|---|
| `tests/contract/signatures.ts` | La unión de `Namespace` suma `'ailab'` (A-701) | Ajustada en X0 (D-X7) |
| `tests/unit/p7/i18n-usage.test.ts` | `palette.action.aiLab` sale de `KEPT` porque ya se usa | Ajustada en X0 (D-X7) |
| `tests/unit/p4/mobile.test.ts`, `case-evidence.test.ts` y las e2e de p4 | Siguen leyendo `components/site/portfolio/AdrCards.module.scss` y el mismo marcado | Sin cambios, en verde |
| `tests/e2e/p6/palette.spec.ts` | El modo `>` no cambia (D-X4) | En verde |
| `tests/e2e/l3` (privacidad, recorre el sitemap) | Verá `/es/ai-lab` y `/en/ai-lab` | La página no tiene datos personales |
| `tests/e2e/integration/support/pages.ts` | `PUBLIC_PAGES` no incluye `/ai-lab` | X5 la suma (T762, T763) |
