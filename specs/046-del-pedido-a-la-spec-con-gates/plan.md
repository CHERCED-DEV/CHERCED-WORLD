# Plan de implementación: 046 — Del pedido a la spec, con gates y humano en el bucle

**Línea**: L5 | **Fecha**: 26 de noviembre de 2026 | **Spec**: [spec.md](./spec.md) | **Paraguas**:
[041](../041-pruebame-en-vivo/spec.md)

## Resumen

Un orquestador de servidor (`lib/ai/gates/`) encadena siete pasos sobre el puerto de la 043 y el núcleo de Cotejo de
la 047:
1. redactar;
2. chequear;
3. revisar;
4. verificar;
5. corregir;
6. recomendar;
7. esperar la decisión humana.

La regla de parada y la recomendación son funciones puras del servidor; ningún texto del modelo decide. La tarjeta
A12 del AI Lab reproduce corridas grabadas sin costo y, con cuenta, corre pedidos propios en vivo con su caja de
cristal.

## Contexto técnico

- **Lenguaje:** TypeScript estricto en Next.js 16 y React 19.
- **Dependencias nuevas:** ninguna propia.
  - Consume `cotejo-core`, que entra al `package.json` por la enmienda E-4701 de la 047.
  - Consume el puerto de la 043, que trae sus SDK con la E-4301.
  - Reusa `zod`, `getAccountState` (038), `hitRateLimit`, `requestIpHash` y `json` / `PRIVATE` de
    `lib/ai/lab/route.ts`.
- **Almacenamiento:** ninguno propio. Los contadores van en `rate_limits` y el gasto en el libro de la 043. Las
  corridas grabadas son contenido versionado.
- **Pruebas:** Vitest con dobles del puerto que registran proveedor, tarea y tokens por paso. Ninguna llama a una API
  real.
- **Plataforma:** una función de Vercel por corrida. Cada paso llama al puerto con su tiempo máximo de 25 s, y la
  corrida le devuelve al navegador cada paso a medida que termina. El transporte (por ejemplo `ReadableStream` de
  líneas JSON) se decide al implementar, sin dependencias nuevas.
- **Metas de rendimiento:**
  - la tarjeta con lo grabado cumple el principio V;
  - los chequeos deterministas, en 50 ms o menos (SC-4606).
- **Restricciones:**
  - nadie revisa lo de su propio proveedor;
  - tope de 0,05 USD por corrida;
  - techo mensual de la 043;
  - nada se guarda.

## Verificación de la constitución

| Principio | Cómo se cumple |
|---|---|
| **I. Evolución, no reemplazo** | Es una tarjeta nueva del AI Lab. La A7 de la 025 sigue igual |
| II. Glass sobre movimiento | Usa los tokens del laboratorio. Con movimiento reducido, los pasos aparecen sin animación |
| **III. Seguridad real** | Las llaves quedan en el puerto, en el servidor. La ruta revisa el origen, la cuenta, los límites y el largo, y valida con Zod. El pedido viaja como datos delimitados. La recomendación es una regla del servidor. No se visitan URLs |
| IV. Contenido como datos | La rúbrica, los pedidos de ejemplo, las corridas grabadas y la batería viven versionados. La tarjeta se renderiza en el servidor |
| V. Rendimiento y accesibilidad | Lista de pasos con `aria-live`, teclado completo, gravedad con texto además del color y pasos apilados en el celular |
| VI. Calidad verificable | Pruebas de contrato de `SpecBreve` y `revision.json`, pruebas del orquestador, de la regla de parada y de la elección de proveedores. Gate de calidad antes de integrar |
| **VII. Propiedad exclusiva** | La L5 solo toca sus rutas. Arranca cuando están congelados el puerto de la 043 (`043-puerto-congelado`) y el núcleo de la 047 (`047-base-congelada`) |
| **VIII. Simplicidad operativa** | Sin variables nuevas, sin colecciones nuevas y sin dependencias propias. Topes por cuenta y diario, tope por corrida y el techo mensual de la 043 |

No hay violaciones que justificar.

## Rutas propias de la línea

| Ruta | Para qué |
|---|---|
| `lib/ai/gates/**` | Orquestador, esquemas, prompts, unión de hallazgos, regla de parada, recomendación, armado de `revision.json` y simulador |
| `app/api/ailab/gates/**` | `POST /api/ailab/gates` (corrida en vivo) y `POST /api/ailab/gates/changes` (ronda pedida por el humano) |
| `components/ailab/gates/**` | Tarjeta A12: pedido, pasos, hallazgos, decisión, caja de cristal y descargas |
| `content/ailab/gates/**` | Rúbrica, pedidos de ejemplo, corridas grabadas, batería de evals, resultados y estación |
| `content/i18n/{es,en}/gates.json` | Textos |
| `tests/unit/gates/**` | Pruebas |

**Ampliación de rutas que pide la línea:** `evals/gates.eval.ts`, la corrida de la batería que gasta. Sigue la
convención de `evals/agent.eval.ts` y la configuración de evals que enmienda la 043 (E-4302).

## Enmiendas a archivos compartidos

Las aplica el integrador antes de arrancar la L5 y se congelan con la etiqueta `046-base-congelada`.

| ID | Archivo | Cambio |
|---|---|---|
| E-4601 | `package.json` | Script `"evals:gates": "vitest run --config vitest.evals.config.ts evals/gates.eval.ts"` |
| E-4602 | `lib/security/rate-limit.ts` | `gates: { limit: 2, windowMs: 24 h }` (por cuenta) y `gatesDaily: { limit: 6, windowMs: 24 h }` |
| E-4603 | `lib/ai/models.ts` y `lib/ai/spend.ts` | `TYPICAL_USE.gates` (una corrida) y la línea `gates` del panel de gasto |
| E-4604 | `content/types.ts` | `'A12'` en `LAB_EXPERIMENT_IDS` |
| E-4605 | `content/ailab/catalog.ts` y `content/i18n/{es,en}/ailab.json` | Tarjeta A12 «Del pedido a la spec» / "From request to spec", tema `agents`, `runsIn: 'providers'` (de la E-4308 de la 043), límite 2 por día |
| E-4606 | `components/ailab/shell/demo-loader.tsx` | Registro de la demo A12 |
| E-4607 | `content/ailab/route/index.ts` | Sumar `gatesStation` al registro de estaciones |

## Contratos que produce

### Spec breve y hallazgos (`lib/ai/gates/schema.ts`)

```ts
export const specBreve = z.object({
  title: z.string().min(3).max(120),
  problem: z.string().min(10).max(600),
  includes: z.array(z.string().max(200)).min(1).max(8),
  excludes: z.array(z.string().max(200)).min(1).max(8),
  requirements: z.array(z.object({ id: z.string().regex(/^R-\d{1,2}$/), text: z.string().max(300) })).min(1).max(12),
  criteria: z.array(z.object({
    id: z.string().regex(/^C-\d{1,2}$/),
    covers: z.array(z.string().regex(/^R-\d{1,2}$/)).min(1),
    given: z.string().max(200), when: z.string().max(200), then: z.string().max(200),
  })).min(1).max(16),
  questions: z.array(z.object({ id: z.string().regex(/^Q-\d{1,2}$/), question: z.string().max(200), byDefault: z.string().max(200) })).max(6),
})

export const RUBRIC_CRITERIA = ['verificable', 'acotada', 'completa', 'clara', 'honesta'] as const
export const GRAVITIES = ['bloqueante', 'importante', 'menor'] as const

export const reviewFinding = z.object({
  criterion: z.enum(RUBRIC_CRITERIA),
  gravity: z.enum(GRAVITIES),
  where: z.string().regex(/^(R-\d{1,2}|C-\d{1,2}|Q-\d{1,2}|title|problem|includes|excludes)$/),
  problem: z.string().max(300),
  fix: z.string().max(300),
  confidence: z.number().min(0).max(1),
})

export type Verification = 'se-sostiene' | 'se-cae' | 'no-se-sabe'
export type Recommendation = 'lista' | 'con-reservas' | 'no-lista'
export type StopReason = 'limpia' | 'dos-rondas' | 'empeoro' | 'tope-corrida' | 'sin-presupuesto' | 'revision-no-disponible' | 'no-es-software'
```

### Orquestador (`lib/ai/gates/run.ts`, solo servidor)

```ts
export type GateStep = {
  kind: 'redactar' | 'chequear' | 'revisar' | 'verificar' | 'corregir'
  round: 1 | 2 | 3
  provider: ProviderId | 'deterministic'
  model: string | null
  attempts: ProviderAttempt[]
  inputTokens: number
  outputTokens: number
  latencyMs: number
  costUsd: number
}

export type GateRun = {
  schemaVersion: 1
  request: { text: string; lang: 'es' | 'en'; source: 'ejemplo' | 'propio' }
  rounds: Array<{ spec: SpecBreve; findings: MergedFinding[] }>
  steps: GateStep[]
  recommendation: Recommendation
  stop: StopReason
  totalUsd: number
}

export function runGate(request: GateRun['request'], deps: { port: Port; core: typeof import('cotejo-core'); onStep: (step: GateStep) => void }): Promise<GateRun>
export function shouldStop(state: { round: number; findings: MergedFinding[]; previousBlockers: number | null; spentUsd: number; nextEstimateUsd: number; budgetOk: boolean }): StopReason | null
export function recommend(findings: readonly MergedFinding[]): Recommendation
export function pickReviewers(available: readonly ProviderId[], writer: ProviderId): ProviderId[]
export function needsVerification(finding: MergedFinding): boolean
```

- `shouldStop`, `recommend`, `pickReviewers` y `needsVerification` son funciones puras con sus pruebas por caso.
- `Port` es el tipo del módulo del puerto de la 043. En las pruebas se inyecta un doble.

### Archivo `revision.json`

`GateRun` más la decisión humana: `{ decision: 'aprobar' | 'pedir-cambios' | 'rechazar', comment: string | null, at: string }`.
Lleva un esquema versionado y su prueba de contrato.

### Estación de la ruta (consume el contrato de la 042)

`content/ailab/gates/station.ts` exporta `gatesStation: RouteStation` con:
- `id: 'gates'`;
- `proof: 4` y `alsoProves: [1]`;
- `minutes: 3`;
- `href: '/{lang}/ai-lab#' + labCardId('A12')`;
- `spec: '046'`.

### Lo que consume

- de la 043: `generateJson`, `exclude`, `attempts`, `availableProviders`, `BudgetExhaustedError`,
  `ProvidersConsent` y el modo del puerto;
- de la 047: `analyze` con el perfil `breve` y `toMarkdown`;
- de la 042: `RouteStation` y el mecanismo para reportar al acta (P-4605);
- de la 038: `getAccountState`.

## Decisiones de diseño

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| Nadie revisa lo de su propio proveedor | Los estudios de LLM-as-judge documentan que un modelo tiende a preferir lo suyo | Con un solo proveedor activo no hay revisión, y la corrida lo dice |
| Chequeos deterministas antes de cualquier revisor, con una corrección gratis | Lo mecánico (cobertura entre requisitos y criterios, palabras vagas, «no incluye» vacío) no necesita modelo y es más barato corregirlo antes | Un paso más en pantalla |
| Verificar solo lo bloqueante y lo dudoso | Un hallazgo bloqueante falso cuesta una ronda y la confianza del entrevistador; verificarlo todo duplica el costo | Un hallazgo importante con alta confianza de un solo revisor no se verifica |
| Regla de parada propia: limpia, dos rondas, empeoró, tope de corrida o sin presupuesto | Es fácil de explicar en una frase, y cada caso tiene su prueba. Cortar cuando empeora evita gastar en una corrida que no mejora | No busca la «mejor» spec posible; busca una que una persona pueda decidir |
| La recomendación es una regla del servidor sobre los hallazgos | Una inyección dentro del pedido no puede «aprobar»: el modelo no escribe la recomendación | Sin matices: tres valores |
| El sistema recomienda y la persona decide | Es la prueba de humano en el bucle que pidió el autor | El entrevistador tiene que pulsar un botón más |
| Corridas grabadas sin cuenta | El entrevistador ve todo en 3 minutos sin gastar | Lo grabado no reacciona a su pedido |
| No guardar nada | Menos datos personales y nada que limpiar | El autor no ve qué piden los entrevistadores. La 038 podría sumarlo con consentimiento después |

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Los revisores inventan hallazgos | Medio | El verificador para lo bloqueante y lo dudoso, el filtro de lugares inexistentes y la métrica de bloqueos falsos en specs limpias |
| Los revisores no ven defectos reales | Medio | Batería de defectos sembrados con meta (SC-4603), y la rúbrica con ejemplos de qué sí y qué no |
| Inyección en el pedido | Alto | Datos delimitados, la recomendación por regla del servidor y 6 casos de red team (SC-4604) |
| Una corrida tarda demasiado para una función de Vercel | Medio | Cada paso tiene su tiempo máximo, la corrida para con el tope y los pasos llegan al navegador a medida que terminan |
| El costo real pasa el estimado por el razonamiento de los modelos | Bajo | El tope cuenta el estimado del paso siguiente, el libro de la 043 ajusta al costo real y la estimación se recalibra con las evals |
| Se parece a una herramienta ajena | Medio | Vocabulario, rúbrica, gravedades y regla de parada propios, con sus fuentes generales citadas. Antes de entregar se busca en el diff la lista de nombres prohibidos de la carpeta privada de la 041 |
| La 047 o la 043 se atrasan | Medio | La L5 no arranca sin sus etiquetas. Mientras tanto, el simulador y las corridas grabadas se pueden preparar con dobles |

## Validación

Solo lo que cambia, sin gastar API real:

```bash
npx vitest run tests/unit/gates
```

```bash
npm run lint
```

```bash
npm run typecheck
```

- No hay archivo e2e propio en las rutas de la L5. La tarjeta se revisa a mano en `next dev` con el simulador y las
  corridas grabadas.
- Se toman capturas del celular (390×844 y WebKit) contra la última vista aprobada del AI Lab.
- `npm run evals:gates` gasta: lo corre el autor, con su permiso.

## Seguimiento de complejidad

No aplica: no hay violaciones de la constitución.
