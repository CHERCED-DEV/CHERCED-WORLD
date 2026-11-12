import { synergosFacts } from './synergos'
import type { ArchitectureTopic, FactoryMilestone, Locale, Localized, SynergosPattern, SynergosSource } from './types'

export const SYNERGOS_ARCHITECTURE_PATH = '/synergos/arquitectura'
export const SYNERGOS_ARCHITECTURE_UPDATED = '2026-11-07'

export const SYNERGOS_SOURCE_REVISIONS = { 'Synergos.CMS': '7c43a179', 'Synergos.UI': '062e0fd', 'Synergos.Fabrica': 'c79a090' } as const

const l = (es: string, en: string): Localized => ({ es, en })
const cms = (path: string, label: string): SynergosSource => ({ repo: 'Synergos.CMS', path, label })
const ui = (path: string, label: string): SynergosSource => ({ repo: 'Synergos.UI', path, label })
const adr = (file: string, label: string): SynergosSource => cms(`Synergos.CMS.Web/docs/adr/${file}.md`, label)

export function sourceHref(source: SynergosSource): string {
  return `https://github.com/CHERCED-DEV/${source.repo}/blob/${SYNERGOS_SOURCE_REVISIONS[source.repo]}/${source.path.split('/').map(encodeURIComponent).join('/')}`
}

const flow = adr('0140-el-flujo-de-negocio-se-declara-en-el-orquestador-y-el-cms-solo-abre-la-puerta', 'ADR 0140')
const synhost = adr('0015-synhost-framework-agnostic-integration', 'ADR 0015')
const contracts = adr('0135-cada-elemento-tiene-su-resolver-tipado-y-el-tipo-ts-sale-del-record', 'ADR 0135')
const islands = ui('vitals/core/src/flujos/coordinador.ts', 'coordinador.ts')
const client = cms('Synergos.CMS.Web/Composers/ClienteDelArbolDeServicios.cs', 'ClienteDelArbolDeServicios.cs')
const idempotency = cms('backend/nucleo/Synergos.Shared/IdempotencyLedger.cs', 'IdempotencyLedger.cs')
const factorySource = cms('Synergos.CMS.Web/docs/product/13-la-fabrica.md', '13-la-fabrica.md')
const system = synergosFacts.designSystem

const topics: ArchitectureTopic[] = [
  {
    id: 'frameworks', title: l('Los frameworks y el runtime compartido', 'Frameworks and the shared runtime'),
    body: [l('Angular es la plataforma principal; Preact es la segunda, con un elemento. Cada elemento publicado es una app propia. El contrato con el host es agnóstico al framework.', 'Angular is the main platform; Preact is the second, with one element. Each published element is its own app. The host contract is framework agnostic.'), l('Los bundles de los elementos dejan Angular y las librerías comunes fuera: un import map resuelve un solo Angular para toda la página. El runtime se publica con la huella de su contenido.', 'Element bundles externalize Angular and the shared libraries: an import map resolves one Angular for the whole page. The runtime is published with a content fingerprint.')],
    sources: [ui('README.md', 'Synergos.UI · README'), synhost, adr('0141-el-runtime-compartido-se-publica-por-contenido', 'ADR 0141')],
  },
  {
    id: 'umbraco', title: l('Cómo compone Umbraco', 'How Umbraco composes'),
    body: [l('El schema se versiona con uSync. El CMS tiene cinco capas: configuración del sitio, composiciones que declaran forma, bloques renderizables, páginas y cableado.', 'The schema is versioned with uSync. The CMS has five layers: site configuration, shape-only compositions, renderable blocks, pages and wiring.'), l('El editor coloca una funcionalidad, que recibe cableado, o una pieza, que recibe contenido y monta su gemela del sistema de diseño. La configuración de negocio de una funcionalidad no la toca el editor.', 'Editors place either a feature, which receives wiring, or a piece, which receives content and mounts its design-system counterpart. Editors do not change a feature’s business configuration.'), l('Standard, Canvas, Bare y Landing son los cuatro tipos de página canónicos. La Tienda ya se compone por páginas; el despiece de otras verticales sigue en curso.', 'Standard, Canvas, Bare and Landing are the four canonical page types. Storefront is already composed as pages; decomposing other verticals is still in progress.')],
    sources: [adr('0008-usync-hybrid-source-of-truth', 'ADR 0008'), adr('0023-componentization-layered-architecture', 'ADR 0023'), adr('0134-tres-catalogos-y-dos-tipos-de-colocable-la-funcionalidad-y-la-pieza', 'ADR 0134'), adr('0137-la-configuracion-de-negocio-de-una-funcionalidad-no-la-toca-el-editor', 'ADR 0137'), adr('0022-page-composition-standard', 'ADR 0022')],
  },
  {
    id: 'cdn', title: l('El CMS consume la CDN; no la posee', 'The CMS consumes the CDN; it does not own it'),
    body: [l('SynHost emite el custom element, su config y los módulos que resuelve el registry. El mismo renderer sirve para Block Grid y para el Layout Composer.', 'SynHost emits the custom element, its config and the modules resolved by the registry. The same renderer serves Block Grid and the Layout Composer.'), l('El registry sirve el último snapshot bueno y lo refresca al vencer. Si la CDN no está disponible o llega vacía, conserva el anterior, sin llamar a la red durante el render.', 'The registry serves its last known-good snapshot and refreshes it on expiry. If the CDN is unavailable or empty, it retains the previous snapshot without making network calls during rendering.')],
    sources: [synhost, adr('0012-cdn-contract-consumed', 'ADR 0012'), adr('0132-el-equipo-del-cdn-eramos-nosotros', 'ADR 0132')],
  },
  {
    id: 'contratos', title: l('Un tipo y dos compiladores', 'One type and two compilers'),
    body: [l('Un record C# declara lo que viaja al elemento. Una prueba proyecta el contrato y su config de ejemplo a JSON; el UI genera el tipo TypeScript y tipa el sanitizador con él.', 'A C# record declares what travels to the element. A test projects the contract and its sample config into JSON; the UI generates the TypeScript type and uses it to type the sanitizer.'), l('Leer una clave que el CMS no manda deja de compilar. Una prueba ejecuta el sanitizador con el ejemplo emitido y detecta claves que viajan sin consumirse.', 'Reading a key the CMS does not send fails compilation. A test runs the sanitizer against the emitted example and detects keys that are sent but never consumed.'), l('Los contratos HTTP se emiten como OpenAPI y generan los clientes de los flujos. C# y TypeScript también prueban los cálculos de hipoteca contra los mismos vectores JSON.', 'HTTP contracts are emitted as OpenAPI and generate flow clients. C# and TypeScript also test mortgage calculations against the same JSON vectors.')],
    sources: [contracts, cms('Synergos.CMS.Web/docs/contracts/elementos-synhost.json', 'elementos-synhost.json'), ui('tools/contrato-synhost.mjs', 'contrato-synhost.mjs'), ui('vitals/contracts/src/elementos-synhost.contract.ts', 'elementos-synhost.contract.ts'), cms('Synergos.CMS.Web/docs/contracts/openapi/Synergos.Api.Booking.json', 'OpenAPI · Booking'), cms('Synergos.CMS.Web/docs/contracts/mortgage-vectors.json', 'mortgage-vectors.json'), flow],
  },
  {
    id: 'islas', title: l('Islas que no comparten la raíz de Angular', 'Islands that do not share an Angular root'),
    body: [l('Cada elemento arranca su propia app. BroadcastChannel conecta islas y pestañas del mismo origen: hay un bus general y otro tipado con alcance por instancia; cada emisor ignora su propio eco.', 'Each element starts its own app. BroadcastChannel connects islands and tabs on the same origin: one bus is general and another is typed and scoped per instance; each sender ignores its own echo.'), l('Dentro de una página, los participantes se registran y envían peticiones con eventos DOM. Un coordinador sin render marca aria-busy y la puerta del CMS lleva la operación al servidor. Nada del DOM es una frontera de confianza.', 'Within a page, participants register and submit requests through DOM events. A coordinator without rendering sets aria-busy, and the CMS gateway sends the operation to the server. Nothing in the DOM is a trust boundary.')],
    sources: [ui('platforms/angular/libs/transaction-engine/src/services/transaction-event-bus.service.ts', 'transaction-event-bus.service.ts'), islands, flow],
  },
  {
    id: 'atomico', title: l('Diseño atómico en los dos árboles', 'Atomic design in both trees'),
    body: [l(`El registry del UI clasifica ${system.primitives} primitivas, ${system.compositions} composiciones y ${system.modules} módulos. Un elemento publicado es una app; lo compartido vive en una librería. Una pieza con gemela en el sistema de diseño la monta y no la reimplementa.`, `The UI registry classifies ${system.primitives} primitives, ${system.compositions} compositions and ${system.modules} modules. A published element is an app; shared components live in a library. A piece with a design-system counterpart mounts it instead of rebuilding it.`), l('En el backend, una capacidad puede decir que no sola y es dueña de su almacén. Lo que no tiene almacén es un tipo compartido. El despiece de las apps de cada vertical sigue en curso.', 'In the backend, a capability can reject a request on its own and owns its storage. A piece without storage is a shared type. Decomposing each vertical’s apps is still in progress.')],
    sources: [ui('vitals/contracts/src/element-registry.json', 'element-registry.json'), adr('0113-published-elements-are-apps-shared-components-live-in-a-lib', 'ADR 0113'), cms('Synergos.CMS.Web/docs/product/07-diseno-atomico-capacidades.md', '07-diseno-atomico-capacidades.md')],
  },
  {
    id: 'accesibilidad', title: l('Accesibilidad: lo que está documentado', 'Accessibility: what is documented'),
    body: [l('El CMS tiene una autoauditoría WCAG 2.1 AA y una reauditoría. La navegación y los landmarks se renderizan en el servidor; los elementos incorporan anuncios accesibles, atributos aria y movimiento reducido.', 'The CMS has a WCAG 2.1 AA self-audit and a follow-up audit. Navigation and landmarks are server rendered; elements provide accessible announcements, aria attributes and reduced motion.'), l('Los repositorios de Synergos todavía no tienen un gate automático de axe. La documentación lo señala como el siguiente paso, no como una garantía ya cumplida.', 'Synergos repositories do not yet have an automated axe gate. The documentation presents it as a next step, not as an existing guarantee.')],
    sources: [cms('Synergos.CMS.Web/docs/hardening/wcag-audit.md', 'wcag-audit.md'), adr('0079-wcag-re-audit-fixes-and-audit-drilldown', 'ADR 0079')],
  },
]

const pattern = (id: string, name: string, body: Localized, sources: SynergosSource[], limitation?: Localized, cases = ['12']): SynergosPattern => ({ id, name, body, status: limitation ? 'parcial' : 'aplicado', sources, cases, ...(limitation ? { limitation } : {}) })

const patterns: SynergosPattern[] = [
  pattern('api-gateway', 'API Gateway', l('Un proxy recibe las peticiones públicas. El CMS es la puerta genérica de los flujos y el resto de servicios no publica puertos al exterior.', 'A proxy receives public requests. The CMS is the generic flow gateway; the other services do not expose public ports.'), [cms('Caddyfile', 'Caddyfile'), flow]),
  pattern('bff', 'Backend for Frontend', l(`${synergosFacts.orchestrators} orquestadores componen capacidades por negocio. El navegador entra por el CMS y no habla directamente con ellos.`, `${synergosFacts.orchestrators} orchestrators compose capabilities by business. Browsers enter through the CMS instead of calling them directly.`), [flow]),
  pattern('saga', 'Saga', l('El motor coordina el flujo, deshace, reintenta y termina avisando cuando se agotan los intentos. Las compensaciones son datos y sobreviven a una caída.', 'The engine coordinates the flow, compensates, retries and reports when attempts are exhausted. Compensations are data and survive a process failure.'), [cms('backend/orquestadores/Synergos.Bff.Core/SagaEngine.cs', 'SagaEngine.cs'), flow]),
  pattern('strangler-fig', 'Strangler Fig', l('Las costuras (seams) conservan su implementación en proceso mientras un interruptor permite extraer la operación al árbol de servicios, paso a paso.', 'Seams keep their in-process implementation while a switch moves the operation into the service tree incrementally.'), [adr('0130-la-analitica-de-busqueda-sale-del-cms-a-un-servicio-de-sesion', 'ADR 0130'), flow]),
  pattern('database-per-service', 'Database per Service', l('Cada capacidad es dueña de su almacén JSON y tiene un solo escritor. Son ficheros durables, no un motor de base de datos compartido.', 'Each capability owns its JSON store and has a single writer. These are durable files, not a shared database engine.'), [cms('backend/nucleo/Synergos.Shared/JsonCollectionStore.cs', 'JsonCollectionStore.cs')]),
  pattern('retry', 'Retry', l('Se repite una petición solo si es repetible y el fallo es transitorio. Las compensaciones usan retroceso exponencial; los avisos tienen un techo de intentos.', 'A request is retried only when it is repeatable and the failure is transient. Compensations use exponential backoff; notifications have an attempt limit.'), [client, cms('backend/orquestadores/Synergos.Bff.Core/SagaEngine.cs', 'SagaEngine.cs')]),
  pattern('idempotency', 'Idempotency', l('La llave se deriva por saga, paso e ítem. El libro de idempotencia permite reconocer una operación repetida sin repetir su efecto.', 'The key is derived per saga, step and item. An idempotency ledger recognizes a repeated operation without repeating its effect.'), [idempotency]),
  pattern('anti-corruption-layer', 'Anti-corruption Layer', l('La capa de transporte de pagos traduce los eventos externos al vocabulario propio, verifica su firma y protege contra repeticiones.', 'The payments transport layer translates external events into the system’s vocabulary, verifies signatures and protects against replay.'), [cms('backend/capacidades/Synergos.Api.Payments/Transport/WebhookVerifier.cs', 'WebhookVerifier.cs')]),
  pattern('cache-aside', 'Cache-aside', l('El CMS cachea lecturas con vencimiento. El registry conserva el último snapshot bueno y el runtime con huella se sirve como inmutable.', 'The CMS caches reads with an expiry. The registry retains its last known-good snapshot; fingerprinted runtime assets are served as immutable.'), [adr('0036-output-caching-sitemap-rss', 'ADR 0036'), adr('0132-el-equipo-del-cdn-eramos-nosotros', 'ADR 0132'), adr('0141-el-runtime-compartido-se-publica-por-contenido', 'ADR 0141')]),
  pattern('rate-limiting', 'Rate limiting', l('Formularios y comentarios del CMS usan una ventana deslizante por IP y formulario. El árbol de servicios no tiene ese limitador.', 'CMS forms and comments use a sliding window per IP and form. The service tree does not have this rate limiter.'), [adr('0030-forms-internal-submission-runtime', 'ADR 0030')]),
  pattern('health-check', 'Health check', l('El árbol expone health checks vigilados por gates. El CMS separa liveness y readiness; el proxy espera a que esté sano.', 'The service tree exposes health checks enforced by gates. The CMS separates liveness and readiness; the proxy waits for a healthy CMS.'), [cms('Dockerfile.service', 'Dockerfile.service'), cms('Synergos.CMS.Web/Controllers/HealthzController.cs', 'HealthzController.cs')]),
  pattern('config-externalizada', 'Externalized configuration', l('Opciones tipadas se enlazan por sección. El compose se genera y los gates comprueban que el cableado y los valores configurados se usen de verdad.', 'Typed options are bound by section. Compose is generated, and gates verify that wiring and configured values are actually used.'), [adr('0011-feature-flags-typed-config', 'ADR 0011'), cms('tools/compose-gen.mjs', 'compose-gen.mjs')]),
  pattern('circuit-breaker', 'Circuit Breaker', l('Los webhooks salientes del CMS usan reintentos, timeouts y cortacircuitos ajustables por canal.', 'Outgoing CMS webhooks use retries, timeouts and per-channel circuit breakers.'), [cms('Synergos.CMS.Web/Composers/WebhookResilienceExtensions.cs', 'WebhookResilienceExtensions.cs'), adr('0069-per-channel-resilience-tuning', 'ADR 0069')], l('No se aplica hacia el árbol de servicios: esa decisión y su argumento están escritos en el cliente.', 'It is not applied towards the service tree: the client documents that decision and its reasoning.')),
  pattern('event-driven', 'Event-driven', l('En el navegador hay eventos DOM, BroadcastChannel y actualizaciones por SSE; en el borde entran webhooks.', 'The browser uses DOM events, BroadcastChannel and SSE updates; the boundary accepts webhooks.'), [islands, adr('0111-realtime-over-sse-with-per-channel-authorization', 'ADR 0111')], l('Entre servicios no hay broker: el flujo usa HTTP síncrono coordinado por la saga.', 'There is no broker between services: flows use synchronous HTTP coordinated by the saga.')),
  pattern('micro-frontends', 'Micro-frontends', l('SynHost monta custom elements desde la CDN. Cada elemento conserva su app y comparte dependencias mediante el import map.', 'SynHost mounts custom elements from the CDN. Each element keeps its own app and shares dependencies through the import map.'), [synhost, ui('README.md', 'Synergos.UI · README')]),
  pattern('correlation-id', 'Correlation ID', l('Una correlación acompaña las peticiones del árbol y permite relacionar el trabajo entre servicios. Su implementación y sus límites están documentados en el núcleo compartido.', 'A correlation accompanies service-tree requests and connects work across services. Its implementation and limits are documented in the shared core.'), [cms('backend/nucleo/Synergos.Shared/Correlation.cs', 'Correlation.cs')]),
  pattern('contratos-generados', 'Contract-first', l('Los contratos de SynHost y de HTTP se generan desde el código y se vigilan contra la deriva antes de que sus consumidores los usen.', 'SynHost and HTTP contracts are generated from code and checked for drift before consumers use them.'), [contracts, flow], undefined, ['12', '13']),
  pattern('reserva-dos-tiempos', 'Two-phase reservation', l('Apartar no es consumir y autorizar un pago no es capturarlo. Cada transición tiene su compensación: liberar antes, reponer o devolver después.', 'Holding is not consuming, and authorizing a payment is not capturing it. Each transition has its compensation: release before, replenish or refund afterwards.'), [flow]),
]

const PATTERN_NAMES_ES: Record<string, string> = {
  'api-gateway': 'Pasarela de API',
  'bff': 'Backend para el frontend',
  'strangler-fig': 'Higuera estranguladora',
  'database-per-service': 'Base de datos por servicio',
  'retry': 'Reintento',
  'idempotency': 'Idempotencia',
  'anti-corruption-layer': 'Capa anticorrupción',
  'cache-aside': 'Caché bajo demanda',
  'rate-limiting': 'Límite de peticiones',
  'health-check': 'Verificación de salud',
  'config-externalizada': 'Configuración externalizada',
  'circuit-breaker': 'Cortacircuitos',
  'event-driven': 'Dirigido por eventos',
  'correlation-id': 'Identificador de correlación',
  'contratos-generados': 'Contrato primero',
  'reserva-dos-tiempos': 'Reserva en dos tiempos',
  'outbox': 'Bandeja de salida',
  'circuito-arbol': 'Cortacircuitos → servicios',
  'navegador-bff': 'Navegador → BFF',
}

export function patternName(pattern: SynergosPattern, lang: 'es' | 'en'): { title: string; canonical: string | null } {
  const spanish = lang === 'es' ? PATTERN_NAMES_ES[pattern.id] : undefined
  return spanish && spanish !== pattern.name ? { title: spanish, canonical: pattern.name } : { title: pattern.name, canonical: null }
}

const decisions: SynergosPattern[] = [
  { id: 'outbox', name: 'Outbox', status: 'descartado', body: l('Protege el encolado, no el despacho. En ese borde se eligió at-most-once con un libro de idempotencia para no reintroducir un segundo recibo.', 'It protects enqueueing, not dispatch. At that boundary, at-most-once delivery with an idempotency ledger avoids reintroducing a second receipt.'), sources: [adr('0106-transactional-notifications-dispatcher-and-at-most-once', 'ADR 0106')], cases: [] },
  { id: 'circuito-arbol', name: 'Circuit Breaker → services', status: 'descartado', body: l('El cortacircuitos de webhooks no se trasladó al árbol de servicios. El cliente deja escrita la razón y conserva reintentos solo cuando son seguros.', 'The webhook circuit breaker was not copied into the service tree. The client records the reasoning and retains retries only when safe.'), sources: [client], cases: [] },
  { id: 'navegador-bff', name: 'Browser → BFF', status: 'descartado', body: l('Se descartó que el navegador llame directo al orquestador. El CMS conserva la puerta de entrada y sus verificaciones.', 'Direct browser calls to orchestrators were rejected. The CMS retains the gateway and its checks.'), sources: [flow], cases: [] },
]

const factory: FactoryMilestone[] = [
  { id: 'spec', status: 'hecho', title: l('El spec antes del código', 'The spec before the code'), body: l('El formato de la especificación y su validador cruzan la cabecera con lo que existe en el repositorio.', 'The specification format and validator compare its header with what exists in the repository.'), sources: [cms('tools/spec-valida.mjs', 'spec-valida.mjs'), factorySource] },
  { id: 'arnes', status: 'hecho', title: l('Molde, gates y arnés versionado', 'Template, gates and a versioned harness'), body: l('El tramo de validación y entrega ya tiene gates, mutación, procesos vivos, humo conectado y PR. El arnés se versiona y sus consumidores fijan una revisión.', 'Validation and delivery already include gates, mutation, live processes, connected smoke tests and pull requests. The harness is versioned and consumers pin a revision.'), sources: [factorySource, { repo: 'Synergos.Fabrica', path: 'README.md', label: 'Synergos.Fabrica · README' }] },
  { id: 'alquiler', status: 'hecho', title: l('Piloto de Alquiler', 'Rental pilot'), body: l('El spec se escribió antes del código: acertaron 11 de 13 predicciones. Del spec al PR verde fueron 3,5 horas, sin una capacidad ni un endpoint nuevo. El cierre también cuenta la predicción equivocada y los defectos que encontraron los procesos vivos.', 'The spec was written before the code: 11 of 13 predictions held. It took 3.5 hours from spec to a green pull request, without a new capability or endpoint. The retrospective also records the wrong prediction and defects found by live processes.'), sources: [cms('docs/specs/alquiler/spec.md', 'Alquiler · spec'), factorySource] },
  { id: 'prompt', status: 'vision', title: l('Del prompt al spec', 'From prompt to spec'), body: l('Todavía no hay una entrada que reciba un prompt y lo baje sola a una especificación. Hoy una persona escribe el spec y acompaña su refinamiento.', 'There is not yet an input that turns a prompt into a specification on its own. A person currently writes the spec and guides its refinement.'), sources: [] },
  { id: 'reutilizacion', status: 'vision', title: l('Reutilizar las piezas sin intervención', 'Reusing pieces without intervention'), body: l('El catálogo no demuestra por sí solo que un elemento pida el dato correcto. Comprobar esa compatibilidad sigue siendo parte del trabajo.', 'The catalog alone does not prove that an element requests the right data. Checking that compatibility remains part of the work.'), sources: [] },
]

export const architecture = {
  facts: synergosFacts,
  copy: {
    title: l('Synergos por dentro', 'Inside Synergos'),
    description: l('La arquitectura de Synergos: Umbraco, elementos desde una CDN, contratos C#/TypeScript y patrones aplicados con sus fuentes públicas.', 'Synergos architecture: Umbraco, CDN-delivered elements, C#/TypeScript contracts and applied patterns with public sources.'),
    eyebrow: l('Las decisiones detrás del sistema', 'The decisions behind the system'),
    lead: l('Un CMS que compone páginas. Elementos que llegan desde una CDN. Capacidades que se coordinan con contratos: así se conectan las piezas.', 'A CMS that composes pages. Elements delivered by a CDN. Capabilities coordinated through contracts: this is how the pieces connect.'),
    back: l('Volver a Synergos', 'Back to Synergos'),
    nav: l('Secciones de arquitectura', 'Architecture sections'),
    sources: l('Fuentes públicas', 'Public sources'),
    newTab: l('abre en una pestaña nueva', 'opens in a new tab'),
    readDiagram: l('Leer el diagrama en texto', 'Read the diagram as text'),
    counted: l('Conteo verificado', 'Verified count'),
    facts: { pieces: l('piezas desplegables', 'deployable pieces'), capabilities: l('capacidades', 'capabilities'), orchestrators: l('orquestadores', 'orchestrators') },
    sections: { recorrido: l('Del CMS al elemento', 'From CMS to element'), contratos: l('Un tipo y dos compiladores', 'One type and two compilers'), islas: l('Islas que se coordinan', 'Coordinated islands'), patrones: l('Patrones con evidencia', 'Patterns with evidence'), fabrica: l('La fábrica', 'The factory') },
    statuses: { aplicado: l('Aplicado', 'Applied'), parcial: l('Parcial', 'Partial'), descartado: l('Descartado', 'Rejected') },
    limitations: l('Dónde no se aplica', 'Where it does not apply'),
    rejected: l('Lo que decidí no usar', 'What I decided not to use'),
    built: l('Ya construido', 'Already built'), vision: l('Lo que viene', 'What comes next'),
    patternLinks: l('Patrones de esta arquitectura', 'Patterns in this architecture'),
    summary: l('La cifra se comparte con la página de Synergos y sus casos; el detalle de cada decisión enlaza a una revisión pública de su fuente.', 'Counts are shared with the showcase and its case studies; each decision links to a public revision of its source.'),
  },
  topics, patterns, decisions, factory,
  diagrams: {
    recorrido: [
      { title: l('Vista Razor', 'Razor view'), detail: l('El editor coloca la pieza', 'The editor places a piece') },
      { title: l('Emisor SynHost', 'SynHost emitter'), detail: l('Elemento y configuración', 'Element and configuration') },
      { title: l('Custom element', 'Custom element'), detail: l('Cada elemento es una app', 'Each element is an app') },
      { title: l('Import map', 'Import map'), detail: l('Runtime compartido', 'Shared runtime') },
      { title: l('CDN propia', 'Own CDN'), detail: l('Bundles con huella', 'Fingerprinted bundles') },
    ],
    contratos: [
      { title: l('Record C#', 'C# record'), detail: l('La forma del dato', 'The shape of the data') },
      { title: l('Snapshot JSON', 'JSON snapshot'), detail: l('Contrato y ejemplo', 'Contract and example') },
      { title: l('Tipo TypeScript', 'TypeScript type'), detail: l('Generado desde el CMS', 'Generated from the CMS') },
      { title: l('Sanitizador', 'Sanitizer'), detail: l('Tipado con el contrato', 'Typed by the contract') },
      { title: l('Prueba del ejemplo', 'Example test'), detail: l('Verifica lo consumido', 'Checks consumed fields') },
    ],
    islas: [
      { title: l('Islas y pestañas', 'Islands and tabs'), detail: l('BroadcastChannel por alcance', 'Scoped BroadcastChannel') },
      { title: l('Widgets de página', 'Page widgets'), detail: l('Eventos DOM', 'DOM events') },
      { title: l('Coordinador', 'Coordinator'), detail: l('Sin render; aria-busy', 'No rendering; aria-busy') },
      { title: l('Puerta del CMS', 'CMS gateway'), detail: l('Verifica la operación', 'Checks the operation') },
      { title: l('Orquestador', 'Orchestrator'), detail: l('Compone capacidades', 'Composes capabilities') },
    ],
  },
  examples: [
    { language: 'C#', code: 'public sealed record TagProps(\n    [property: CampoSynHost(OrigenDelCampo.Contenido)] string? Label,\n    [property: CampoSynHost(OrigenDelCampo.Decision)] string? Color);', source: cms('Synergos.CMS.Interfaces/SynHost/TagProps.cs', 'TagProps.cs') },
    { language: 'TypeScript', code: 'export interface TagProps {\n  readonly label?: string;\n  readonly color?: string;\n}', source: ui('vitals/contracts/src/elementos-synhost.contract.ts', 'elementos-synhost.contract.ts') },
  ],
}

export type ArchitectureChapterId = keyof typeof architecture.copy.sections

export type ArchitectureChapter = { id: ArchitectureChapterId; number: string; label: Localized }

const CHAPTER_ORDER: readonly ArchitectureChapterId[] = ['recorrido', 'contratos', 'islas', 'patrones', 'fabrica']

export const SYNERGOS_ARCHITECTURE_CHAPTERS: readonly ArchitectureChapter[] = CHAPTER_ORDER.map((id, index) => ({
  id,
  number: String(index + 1).padStart(2, '0'),
  label: architecture.copy.sections[id],
}))

export function architectureChapters(lang: Locale): { id: ArchitectureChapterId; number: string; label: string }[] {
  return SYNERGOS_ARCHITECTURE_CHAPTERS.map(chapter => ({ id: chapter.id, number: chapter.number, label: chapter.label[lang] }))
}
