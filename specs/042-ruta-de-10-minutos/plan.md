# Plan: 042 — Ruta de 10 minutos

**Spec:** [spec.md](./spec.md) | **Fecha:** 26 de noviembre de 2026 | **Línea:** L1, ola 1 | **Rama de la línea:**
`lane/l1-ruta` en `.worktrees/l1-ruta`

## Resumen

Una página del AI Lab con cuatro estaciones núcleo, el reloj, las marcas, las notas y el acta, todo en el navegador y
sin endpoint nuevo. El contenido de las estaciones es contenido tipado y versionado (`content/ailab/route/`), así que
se renderiza en el servidor. El avance vive en `sessionStorage`. La línea también produce el contrato
`RouteStation` y su registro, que usan las líneas 043 a 050.

## Contexto técnico

- **Lenguaje:** TypeScript estricto, Next.js 16 con App Router y React 19, como el resto del sitio.
- **Dependencias nuevas:** ninguna. El reloj es un `setInterval` con `requestAnimationFrame` de respaldo, el acta es un
  `Blob` con `URL.createObjectURL` (como la 030) y la validación del registro usa Zod 4, que ya está en
  `package.json`.
- **Almacenamiento:** `sessionStorage` de la pestaña para el avance. Ni base ni cookies.
- **Pruebas:** Vitest para el contrato del registro, el armado del acta, el muestreo de «Rómpelo» y el estado del
  avance. Un archivo Playwright para el recorrido de punta a punta en escritorio y en 390×844.
- **Plataforma:** Vercel, la misma página estática por idioma (`generateStaticParams`) con una isla cliente.
- **Metas de rendimiento:** las del principio V para una página pública: LCP ≤ 2,5 s, CLS ≤ 0,1 e INP ≤ 200 ms en
  perfil móvil de gama media. La isla cliente pesa menos de 15 KB comprimidos.
- **Restricciones:** no tocar secciones aprobadas (FR-4108 de la 041); las entradas van como enmiendas de la base.

## Verificación de la constitución

| Principio | Cómo se cumple |
|---|---|
| **I. Evolución, no reemplazo** | Ruta nueva, aditiva, dentro del AI Lab. Las rutas existentes no cambian. La ventana «Para reclutadores» y el AI Lab ganan un enlace cada uno, sin cambiar de forma |
| II. Glass sobre movimiento | Las estaciones usan los tokens de glass existentes y la pastilla también. El reloj no anima con movimiento reducido |
| **III. Seguridad real** | No hay endpoint nuevo. Notas y marcas no salen del navegador. El acta se arma en el cliente con datos del propio visitante |
| IV. Contenido como datos | Estaciones en `content/ailab/route/`, tipadas, en ES y EN, renderizadas en el servidor. `sessionStorage` guarda solo el avance del visitante, nunca contenido |
| V. Rendimiento y accesibilidad | Página liviana. Reloj anunciado solo al cambiar de estación, controles nativos y estado no solo por color. Prueba de a11y con axe en el e2e de la línea |
| VI. Calidad verificable | Prueba de contrato del registro (FR-4209), unitarias del acta y del avance, un e2e |
| **VII. Propiedad exclusiva** | Rutas propias en la tabla de abajo. Lo que toca archivos compartidos va como enmienda E-42xx, la aplica el integrador antes de arrancar y se congela con la etiqueta `042-base` |
| **VIII. Simplicidad operativa** | Sin dependencias, sin variables de entorno, sin infraestructura y sin costo propio |

## Rutas propias de la línea

| Ruta | Para qué |
|---|---|
| `app/[lang]/ai-lab/ruta/page.tsx` | La página |
| `app/[lang]/ai-lab/ruta/opengraph-image.tsx` | Imagen para compartir la ruta |
| `components/ailab/route/**` | `RouteView`, `StationCard`, `RouteClock`, `RouteActaButton`, `BreakIt`, `RouteReturnPill` y sus estilos |
| `content/ailab/route/stations.ts` | El tipo `RouteStation` y el esquema Zod |
| `content/ailab/route/index.ts` | El registro `routeStations` y `coreRoute` |
| `content/ailab/route/core.ts` | Las seis estaciones de esta línea (cuatro núcleo y dos extra) |
| `content/ailab/route/recorded-trace.json` | La traza grabada de respaldo (P-4206) |
| `lib/ailab/route/progress.ts` | Leer y escribir el avance en `sessionStorage`, con su versión |
| `lib/ailab/route/acta.ts` | El Markdown del acta |
| `lib/ailab/route/break-it.ts` | El muestreo de casos `refusal` |
| `content/i18n/{es,en}/route.json` | Las etiquetas de la interfaz |
| `tests/unit/route/**` | Pruebas unitarias y de contrato |
| `tests/e2e/route/route.spec.ts` | El e2e. El repo agrupa los e2e en carpetas por área (`tests/e2e/<área>/`), así que va en `tests/e2e/route/` y no en la raíz |

## Enmiendas a archivos compartidos

Las aplica el integrador en la rama base antes de arrancar la línea y se congelan con la etiqueta `042-base`.

| Id | Archivo | Cambio |
|---|---|---|
| E-4201 | `lib/i18n/config.ts` y `lib/i18n/server.ts` | Namespace `route` y sus dos cargadores |
| E-4202 | `components/site/home/RecruitersBlock.tsx` | Un enlace de texto «Pruébame en 10 minutos» junto a los pitches. Nada más cambia en la ventana |
| E-4203 | `components/ailab/shell/LabPage.tsx` | Un acceso de una línea al inicio del AI Lab, antes de los temas |
| E-4204 | `lib/ai/agent/interview.ts` | Sacar `clock` (hoy privado) a un `export` para que el acta de la ruta use el mismo formato de duración. Sin cambio de comportamiento |
| E-4205 | `app/sitemap.ts` | La URL de la ruta en los dos idiomas |
| E-4206 | `app/[lang]/layout.tsx`, o el que monte la interfaz común | Montar `RouteReturnPill`, que no pinta nada sin una ruta activa (P-4204) |

Si el autor rechaza P-4204, E-4206 no se aplica y la US4 queda solo con las dos entradas.

## Contratos que produce y consume

**Produce** (se congela con la etiqueta `042-estaciones` al integrarse la línea):

```ts
export type RouteProof = 1 | 2 | 3 | 4

export type RouteStation = {
  id: string
  proof: RouteProof
  alsoProves?: readonly RouteProof[]
  title: Localized
  minutes: number
  steps: Localized[]
  href: string
  evidence: string[]
  spec: string
}

export const routeStationSchema: z.ZodType<RouteStation>

export const routeStations: readonly RouteStation[]

export const coreRoute: Readonly<Record<RouteProof, string>>
```

- `proof` es la prueba principal y decide dónde aparece la estación. `alsoProves` lista las otras pruebas que también
  demuestra (por ejemplo, la 034 prueba la 1 y la 3). Se ve como etiqueta y cuenta en el acta, pero no mueve la
  estación ni alarga la ruta núcleo. No puede repetir `proof`. Lo pidieron la 048, la 049 y la 050.
- `href` es una ruta interna sin idioma (`/ai-lab#lab-v5`); la página le pone el prefijo `/{lang}`. Una URL absoluta
  solo se acepta si es de `github.com/CHERCED-DEV/`.
- `evidence` son ids cortos de lo que conviene llevarse (`trace-json`, `interview-acta`, `match-coverage`,
  `github-lines`, `spec-link`, `commit-links`, `mcp-call`, `metrics-link`), con su texto en `route.json`.
- Cada línea entrega su estación como un archivo propio (por ejemplo `content/mcp/station.ts` en la 044) y el
  integrador la suma a `routeStations` como enmienda de una línea.

**Consume** (sin modificarlos): `EVAL_BATTERY` y `EvalCase` de `content/ailab/evals/battery.ts`, `EvalResults` de
`lib/ai/evals/grade.ts`, `content/ailab/evals/results.json`, `Localized` de `content/types.ts`, `TracePanel` de
`components/ailab/agent/TracePanel.tsx` (para pintar la traza grabada) y `clock` de `lib/ai/agent/interview.ts`
(después de E-4204).

## Decisiones de diseño

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| La ruta enlaza a las experiencias, no las incrusta | Incrustar Mini Cherced o el encaje pediría cambiar componentes de otras specs y cargar todo en una página | El entrevistador sale y vuelve; por eso existe la pastilla |
| El avance en `sessionStorage`, no en la base | Cero datos del entrevistador en el servidor, cero endpoint nuevo y cero costo | Si cierra la pestaña, pierde el avance |
| El entrevistador marca; la ruta no adivina | Leer resultados de otras experiencias pediría acoplarlas a la ruta | El acta tiene la evidencia que él decidió llevarse, no una automática |
| Ruta núcleo fija y «Más pruebas» aparte | Mantener la promesa de 10 minutos aunque las olas 2 y 3 sumen estaciones | Lo más nuevo queda un clic más lejos |
| «Rómpelo» reusa la batería de la 032 | Una sola fuente de casos de red team; si cambia la batería, cambia la ruta | No hay ataques pensados solo para la ruta |
| Traza grabada marcada como grabada | Que la prueba 1 no dependa de tener cupo o llave ese día | Una traza grabada convence menos que una en vivo; por eso dice que es grabada |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Amontonar la ventana «Para reclutadores» o el AI Lab (memoria del 7 de noviembre de 2026) | Un solo enlace de texto en cada uno, capturas del celular antes y después, y SC-4204 |
| Las estaciones envejecen cuando cambia una experiencia | La prueba de contrato valida que cada `href` interno exista en las rutas de la app y en el catálogo |
| La pastilla tapa contenido en el celular | Posición fija abajo a la izquierda, lejos del botón «Back to top» y del menú flotante; prueba visual en 390×844 |
| El cupo de prueba de Mini Cherced se acaba un día con varias entrevistas | Traza grabada de respaldo (FR-4212) y el aviso para entrar con cuenta |
| La ruta núcleo pasa de 10 minutos al sumar pasos | FR-4209 la mide en la prueba de contrato |

## Validación

Solo lo de esta línea, sin gastar API y sin la suite exhaustiva:

```bash
npx vitest run tests/unit/route
```

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npx playwright test tests/e2e/route/route.spec.ts
```

Más las capturas de 390×844 y WebKit de la ventana «Para reclutadores», del inicio del AI Lab y de la ruta, contra la
última vista aprobada.

## Seguimiento de complejidad

No aplica: no viola ningún principio.
