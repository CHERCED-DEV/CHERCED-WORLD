# Plan de implementación: 050 — Agente de operaciones para una pyme

**Línea**: L9, ola 3 | **Fecha**: 26 de noviembre de 2026 | **Spec**: [spec.md](./spec.md)

## Resumen

La 050 construye un agente con herramientas sobre el negocio ficticio Girasol de Papel.

- **El servidor no guarda estado.** Cada turno recibe la conversación y el estado de la sesión, y devuelve la
  respuesta, las acciones pendientes y la traza.
- **Precios:** los calcula siempre el servidor desde el catálogo. Una guarda reemplaza cualquier cifra del modelo que
  no coincida con la última cotización.
- **Acciones:** las de tipo `proponer_*` quedan pendientes. El dueño (el entrevistador en ese papel) las aprueba en un
  tablero, y el servidor las vuelve a validar antes de confirmarlas.
- **Demo:** la tarjeta `B1` del AI Lab, con caja de cristal, guion pregenerado y modo fuera de horario.

## Contexto técnico

- **Lenguaje**: TypeScript estricto, Next.js 16 con App Router y React 19.
- **Dependencias**: ninguna nueva. `zod` para las herramientas y las salidas, y el puerto de la 043 para el modelo.
- **Almacenamiento**:
  - Catálogo, reglas, agenda base, guion pregenerado y resultados de evals son contenido versionado.
  - El estado de la sesión vive en la memoria de la página.
  - No hay colecciones ni almacenamiento del navegador.
  - Los límites usan `RateLimitRepo`.
- **Pruebas**:
  - Vitest para cotización, reglas de descuento, disponibilidad, guarda de cifras, ciclo de acciones, revalidación al
    aprobar, enmascarado y batería.
  - Un archivo e2e con el simulador.
  - Sin llamadas reales.
- **Plataforma**: funciones de Vercel (Node), con `maxDuration` de 60 s.
- **Metas de rendimiento**:
  - Turno en menos de 6 s p95.
  - Aprobación (sin modelo) en menos de 300 ms.
- **Restricciones**:
  - Sin canales reales (FR-5008 y «No incluye»).
  - FR-4102: todo ficticio.
  - FR-4109: aprobación humana de toda acción.
  - FR-4110: sin gastar API en pruebas.

## Verificación de la constitución

| Principio | Cómo se cumple |
|---|---|
| **I. Evolución** | Es una tarjeta nueva y una ruta nueva de API. No toca secciones aprobadas |
| II. Glass sobre movimiento | Usa los tokens del AI Lab y respeta el movimiento reducido |
| **III. Seguridad** | Valida origen, largo, turnos y límites en el servidor. Las reglas viven en el sistema y no se cambian desde el chat. Toda acción pasa por aprobación humana, con revalidación en el servidor sin confiar en el navegador. La agenda nunca devuelve datos de otros clientes. La traza enmascara teléfonos y correos. No se guarda nada |
| IV. Contenido como datos | El negocio está tipado y es bilingüe. El estado de la demo vive en memoria, no en el almacenamiento del navegador |
| V. Rendimiento y accesibilidad | Carga diferida. El cambio de papel es accesible y anuncia su estado. Teclado y lector de pantalla |
| VI. Calidad | Pruebas primero en cotización, reglas, guarda de cifras, ciclo de acciones y revalidación. La batería bloquea si fallan descuentos, fugas o acciones sin aprobación |
| **VII. Líneas exclusivas** | Solo toca sus rutas propias. Lo compartido entra como enmienda del integrador |
| **VIII. Simplicidad** | Sin estado en el servidor, sin colecciones, sin canales reales, sin dependencias ni llaves nuevas. Un solo agente |

## Rutas propias de la línea

| Ruta | Qué va |
|---|---|
| `content/ailab/pyme/**` | `business.ts` (negocio, zonas, franjas, horario y reglas), `catalog.ts`, `agenda.ts` (base con reservas ficticias), `faq.ts`, `script.ts` (guion pregenerado), `station.ts` y `evals/{battery.ts,results.json}` |
| `lib/ai/pyme/**` | `quote.ts`, `discounts.ts`, `availability.ts`, `tools.ts` (esquemas y ejecución), `actions.ts` (pendientes y revalidación), `money-guard.ts`, `mask.ts`, `prompt.ts`, `turn.ts` (ciclo de hasta 3 pasos), `simulator.ts`, `trace.ts` y `evals/grade.ts` |
| `app/api/ailab/pyme/**` | `turn/route.ts` (un turno) y `approve/route.ts` (aprobar o rechazar, sin modelo) |
| `components/ailab/pyme/**` | `PymeStage.tsx`, `CustomerChat.tsx`, `QuoteCard.tsx`, `OwnerBoard.tsx`, `RoleSwitch.tsx`, `PymeTrace.tsx` y sus estilos |
| `content/i18n/{es,en}/pyme.json` | Los textos de la interfaz |
| `tests/unit/pyme/**` | Las pruebas |

## Enmiendas a archivos compartidos

Las aplica el integrador y se congelan con la etiqueta `050-base`.

**Antes de arrancar la línea:**

1. `content/types.ts`: sumar `'B1'` a `LAB_EXPERIMENT_IDS`.
2. `content/ailab/catalog.ts` y `content/i18n/{es,en}/ailab.json`: entrada `B1` en el tema `agents` (estado
   `experiment`, sesión de unos 3 minutos con tope, flujo, tarjetas de decisión y privacidad), con sus textos
   `ailab.b1.*`.
3. `lib/security/rate-limit.ts`: acciones `pymeTurn` (24 por 24 h por visitante) y `pymeTurnDaily` (30 por 24 h,
   global). La aprobación no tiene límite propio porque no gasta modelo; la cubre el límite general por IP de la ruta.
4. `lib/ai/models.ts`: `TYPICAL_USE.pymeTurn`, con 3.750 de entrada y 375 de salida y el modelo barato por defecto del
   puerto.
5. `lib/ai/spend.ts`: línea `B1` con la acción `pymeTurnDaily` y el uso `pymeTurn`.
6. El cargador de i18n: espacio `pyme`.
7. `package.json`: script `evals:pyme` con `vitest run --config vitest.evals.config.ts evals/pyme.eval.ts`. Pasan a ser
   rutas propias `evals/pyme.eval.ts` y `tests/e2e/pyme.spec.ts`.

**Al integrar la línea:**

1. `components/ailab/shell/demos/l9-pyme.ts` y su import en `components/ailab/shell/demos/index.ts`:
   `B1: labDemo(() => import('@/components/ailab/pyme/PymeStage'))`.
2. `content/ailab/route/index.ts`: sumar la estación de `content/ailab/pyme/station.ts`.

## Contratos

**Consume:**

| Contrato | De | Uso |
|---|---|---|
| `generateJson`, `assertMonthlyBudget`, `BudgetExhaustedError` y `ProviderId` | 043 | Cada paso del ciclo; el tope mensual; el proveedor y el modelo en la traza |
| Llamadas a herramientas nativas, si el puerto las ofrece | 043 (P-5004) | El ciclo de herramientas. Si no las ofrece, ciclo propio con JSON `{ tool, args } \| { reply }` validado |
| `RouteStation` | 042 | La estación |
| `hitRateLimit` y `requestIpHash` | Existentes, `lib/security/` | Los límites |

**Produce:**

- `PymeTurnRequest`:
  ```
  {
    lang,
    afterHours,
    messages: { role: 'cliente' | 'agente', text }[],
    session: {
      confirmed: AccionConfirmada[],
      pending: AccionPendiente[],
      quotes: Cotizacion[]
    }
  }
  ```
- `PymeTurnReply`:
  ```
  {
    reply,
    quote?: Cotizacion,
    newPending: AccionPendiente[],
    trace,
    usage,
    costUsd,
    provider,
    model
  }
  ```
- `PymeApproveRequest`: `{ action, decision: 'aprobar' | 'rechazar', motivo?, session }`.
- `PymeApproveReply`: `{ ok, action, reason? }`. El servidor revalida con la agenda base y `session.confirmed`.

**Estación:** la 050 declara `proof: 1` y `alsoProves: [2]`, con el campo opcional que se sumó al contrato de la 042.

**Ajuste pedido al puerto de la 043 (P-5004):** que `generateJson` acepte `tools` (nombre, descripción y esquema) y
devuelva `toolCalls` normalizados entre los tres proveedores, o que lo diga explícitamente para que la 050 arme su ciclo.

## Decisiones de diseño

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| El servidor no guarda estado y revalida al aprobar | No hay colección nueva, nada que limpiar y cero datos guardados. La revalidación impide aprobar algo inválido aunque el navegador mande cualquier cosa | Cada turno manda la conversación entera; los tokens crecen por eso, y por eso hay un máximo de 10 mensajes |
| El dinero lo calcula el servidor y una guarda reemplaza cifras del modelo | El error más caro de un bot de ventas es un precio mal dicho | Las respuestas con cifras se ven como tarjeta y no como texto libre |
| La agenda solo devuelve franjas libres | La herramienta no puede filtrar lo que no tiene | El agente no puede decir «esa franja la tiene otra persona»; solo dice «no está libre» |
| Las acciones siempre pendientes, incluso fuera de horario | La aprobación humana es la regla (FR-4109) y lo que se quiere mostrar | La demo pide un paso más; el modo fuera de horario lo cuenta como valor |
| Guion pregenerado como respaldo | La demo funciona sin llaves o con el tope agotado (FR-4106) | El guion es fijo |

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El modelo dice «ya quedó» con la acción pendiente | Alto | Guarda de frases sobre la respuesta con acciones pendientes, la instrucción fija y casos que bloquean (FR-5014) |
| Un descuento por presión del cliente | Alto | `proponer_descuento` solo acepta reglas del catálogo; el total sale de `quote.ts`; casos de red team |
| Fuga de datos de la agenda ficticia | Medio | La herramienta no los devuelve; la guarda de salida busca los nombres de la agenda; casos que bloquean |
| Los tokens crecen con la conversación | Medio | Máximo de 10 mensajes, instrucción y catálogo compactos, y el costo por turno visible en la traza |
| El puerto de la 043 no trae herramientas para los tres proveedores | Medio | Ciclo propio con JSON validado (P-5004), probado con dobles |
| El visitante escribe datos reales | Bajo | Aviso de usar datos inventados, nada se guarda y la traza enmascara |

## Validación

- `npx vitest run tests/unit/pyme`.
- `npm run lint` y `npm run typecheck`.
- `npx playwright test tests/e2e/pyme.spec.ts` con el simulador: cotizar, trampa, pendiente, aprobar como dueño y
  traza, en escritorio y 390×844.
- Sin corridas reales de evals sin permiso del autor. Nunca la suite exhaustiva.

## Seguimiento de complejidad

Sin violaciones de la constitución.
