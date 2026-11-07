# Fase 2 de la 009: evidencias

Lectura del 7 de noviembre de 2026, en solo lectura, sobre el estado de los repos públicos tal como estaban en la
última sincronización con GitHub:

| alias | repo | rama | commit | fecha |
|---|---|---|---|---|
| `CMS:` | [CHERCED-DEV/Synergos.CMS](https://github.com/CHERCED-DEV/Synergos.CMS) | `master` | `7c43a179` | 2026-11-05 |
| `UI:` | [CHERCED-DEV/Synergos.UI](https://github.com/CHERCED-DEV/Synergos.UI) | `master` | `062e0fd` | 2026-11-05 |
| `Fabrica:` | [CHERCED-DEV/Synergos.Fabrica](https://github.com/CHERCED-DEV/Synergos.Fabrica) | `main` | `c79a090` | 2026-10-01 |

Las rutas van relativas a cada repo (`CMS:compose.prod.yml`). "ADR NNNN" es un fichero de
`CMS:Synergos.CMS.Web/docs/adr/`. Lo que solo existe en la raíz privada de Synergos va descrito sin rutas y marcado
**privado hasta el MVP**: no se enlaza ni se cita con cifras en el sitio.

**Reglas de uso en el sitio**

- Cero invención. Cada frase del sitio sobre la arquitectura apunta a una fila de este documento.
- No se publican proveedores, costos ni pasos de infraestructura de producción (regla de `fuente-publica.md`).
- Ningún nombre de empleador, cliente o sistema interno, ni actual ni anterior. Varias ADR y un fichero del UI se
  comparan con el código de un empleador anterior: esas comparaciones **no** se usan en el sitio, ni el nombre, ni las
  clases, ni las cifras.
- Lo que el autor hizo en su empleo y no está en Synergos se cuenta solo en genérico (§2.4).

---

## 1. Las cifras (P-902 y su vecindad)

| cifra en el sitio | medido | dónde se contó | veredicto |
|---|---|---|---|
| **31 piezas desplegables** (un CMS, 20 capacidades, 9 orquestadores y un proxy) | **31** | `CMS:compose.prod.yml`: la cabecera dice «El producto entero: el CMS, las 20 capacidades, los 9 orquestadores y un proxy», y bajo `services:` hay exactamente 31 entradas (`proxy`, `cms`, 20 `api-*` y 9 `bff-*`). El fichero lo genera `CMS:tools/compose-gen.mjs` y lo vigila el gate `ComposeStackTests`. Cruce por proyectos: 20 `.csproj` con `Microsoft.NET.Sdk.Web` en `CMS:backend/capacidades/` y 9 en `CMS:backend/orquestadores/`; `Synergos.Bff.Core` y `Synergos.Bff.Pasos` son librerías, no se despliegan. El `HEALTHCHECK` de `CMS:Dockerfile.service` dice que sirve «para las 29» | **Vale.** Fecha del conteo: master del 2026-11-05 |
| **20 capacidades** | 20 | igual que arriba | vale |
| **9 orquestadores** | 9 desplegables | igual que arriba | vale |
| `backend: { api: 20, bff: 10 }` (dato del showcase) | 20 `Api` y 11 proyectos `Bff.*`: 9 desplegables y 2 librerías | la tabla de suites de `CMS:CLAUDE.md` dice «las 20 `Api.*` y los 10 `Bff.*`»: cuenta los 9 orquestadores más `Bff.Core` | **Ambiguo.** Proponer «9 orquestadores» y, si se quiere, «más su núcleo común» |
| **6.600+ tests** | **6.675** en tres suites (4.022 + 2.082 + 571) | `CMS:CLAUDE.md`, tabla de suites. La línea de Salud lleva 6.722 en su rama, sin integrar | **Vale** |
| **140+ ADR** | **140** en master, numeradas de 0001 a 0141 (la 0016 no existe); **141** contando la 0142, que vive en la rama de la línea de Salud | `CMS:Synergos.CMS.Web/docs/adr/` y su `README.md` | **Vale como «140+»**. «Más de 140», como dice `fuente-publica.md`, solo es cierto contando la 0142 |
| **92 gates de arquitectura** | 92 | `CMS:CLAUDE.md` («64 de los 92 gates…») | vale (no se recontó a mano) |
| **130+ elementos del design system** | **134** en el registry: 31 primitivas, 47 composiciones y 56 módulos, todos Angular | `UI:vitals/contracts/src/element-registry.json` | vale |

**Cambios propuestos al sitio** (los hace la lane dueña de `content/`, no esta):

- `synergosFacts.countedAt`: de `2026-11-01` a `2026-11-05`, la misma fecha que `measuredAt`, porque las 31 piezas se
  verificaron sobre el mismo master.
- `synergosShowcase.backend`: aclarar que son 9 orquestadores desplegables (hoy dice `bff: 10`).
- Evolución medida, si el autor la quiere contar (fuente: su perfil técnico del 6 de agosto de 2026, privado, y
  verificable en la historia pública de los repos): de 4 a 9 orquestadores, de 2.353 a 6.675 tests y de 133 a 140 ADR
  entre agosto y noviembre de 2026.

---

## 2. BroadcastChannel, el embebido y "Angular aislado desde la CDN"

### 2.1 BroadcastChannel: sí está en Synergos

Dos buses, los dos en el UI público:

- `UI:platforms/angular/libs/core/src/services/event-bus.service.ts`: un bus sin tipos sobre un canal fijo (token
  `EVENT_BUS_CHANNEL`). En el servidor no abre canal (`isPlatformBrowser`), y marca cada evento con la instancia que lo
  publicó (`data-synergos-instance`). Tiene su spec con un `BroadcastChannel` falso.
- `UI:platforms/angular/libs/transaction-engine/src/services/transaction-event-bus.service.ts`: un bus **tipado y con
  alcance por instancia** (`synergos-txn:<scope>`). Sirve para que varias islas de una misma página, que **no comparten
  raíz de Angular**, se coordinen entre sí y entre pestañas sin cruzarse. Es zoneless: las señales reaccionan al
  mensaje, sin `NgZone`, y cada emisor ignora su propio eco por `source`. Lo usan los módulos `academy`, `blogs`,
  `ehr`, `eventos`, `realty`, `storefront` y `travel-shell` (`UI:platforms/angular/apps/elements/modules/`).
- La ADR 0083 deja el `BroadcastChannel` como dirección futura para recargar en caliente la cultura o el tema; hoy
  basta con recargar la página.

### 2.2 `postMessage` entre ventanas: no está

Los únicos `postMessage` del UI son los de los dos buses, y los únicos oyentes de `message` son sus canales. No hay
`window.parent` ni `contentWindow` en ninguno de los dos repos. Synergos sí embebe `iframe`, pero sin mensajería:

- `elementIntIframeHost`: un `iframe` genérico con `sandbox`, fuera de la CDN (ADR 0015 §5).
- `elementFormEmbed`: formularios de terceros en `iframe` con `sandbox` y `title` obligatorio (WCAG 4.1.2) (ADR 0018,
  camino B).

### 2.3 "Angular aislado desde la CDN que alimenta las vistas Razor": sí, es la columna de Synergos

- **SynHost** (ADR 0015): cada bloque `elementSyn<Block>` del CMS tiene una vista
  `Views/Partials/SynHost/<Block>.cshtml` que llama a `ISynHostEmitter`. El emisor escribe
  `<synergos-<block>> config='{json}'` y los `<script type="module">` que devuelve el registry. Hoy hay 92 tipos
  `elementSyn*` en `CMS:Synergos.CMS.Web/uSync/v9/ContentTypes/` y 93 vistas en
  `CMS:Synergos.CMS.Web/Views/Partials/SynHost/`. El mismo bloque sirve en Block Grid y en el Layout Composer, con un
  solo renderer.
- **El CMS consume la CDN, no la posee** (ADR 0012, 0099 y 0132). `IBundleRegistryClient` resuelve qué bundle monta
  cada nombre. El cliente remoto nunca va a la red durante un render: sirve el último snapshot bueno, lo refresca al
  vencer y, si la CDN se cae o llega vacía, conserva el anterior.
- **Un solo Angular para toda la página** (`UI:README.md`). Cada elemento se compila como custom element en un bundle
  propio de unos 2 KB; Angular, `@synergos/core` y `@synergos/shared` quedan fuera y los resuelve el import map del
  runtime compartido. Desde la ADR 0141, el runtime se publica por contenido: el nombre lleva la huella de sus bytes,
  así que solo se marca `immutable` lo que una huella prueba.
- **El puente con el host**: el CMS escribe `window.synergos` (versión, i18n, tema, marca, miembro) antes de cargar los
  bundles, y los elementos emiten eventos `syn:*` (`CMS:Synergos.CMS.Web/docs/contracts/host-bridge.md`).

### 2.4 Lo que no está en Synergos

Un micro-frontend embebido en otra ventana y coordinado con `postMessage` o `BroadcastChannel` entre ventanas **no**
aparece en las fuentes de Synergos. Si el autor lo hizo en su empleo, en el sitio se cuenta solo en genérico: el
problema, la forma de la solución y lo aprendido, sin nombres internos, sin cifras y sin el empleador. En la spec queda
marcado como **experiencia del autor en su empleo**, aparte de las evidencias de Synergos.

---

## 3. La arquitectura por dentro

### 3.1 Cómo maneja los frameworks

- **Angular es la plataforma principal**: Angular 21, zoneless, standalone y con señales. Lo compila un solo
  `NgtscProgram` más esbuild, sin Nx (`UI:platforms/angular/tools/build.mjs`; `UI:README.md` cuenta por qué se quitó
  Nx).
- **Preact es la segunda plataforma, y es real pero chica**: un elemento (`badge`) con su protocolo de elemento y su
  runtime propio (`UI:platforms/preact/`). La ADR 0141 publica con huella las 18 entradas del import map de Angular y
  las 5 del de Preact.
- **El contrato es agnóstico aunque hoy haya un framework principal.** El CMS resuelve el framework del descriptor en
  tiempo de ejecución y el schema nunca lo hornea (ADR 0099 §2). Las plataformas React, Svelte y vanilla eran andamiaje
  sin elementos publicados y se eliminaron, pero el contrato conserva el segmento `/angular/` y los tipos
  `FrameworkKind`, para poder volver a meter otra plataforma (`UI:README.md`). La ADR 0099 todavía nombra cuatro
  frameworks oficiales: el README es lo vigente.
- **Por qué funciona**: lo que cruza la frontera es DOM, no framework. El formato del cable (`<synergos-x config='…'>`
  más los scripts del registry y el import map) es el mismo para cualquier plataforma (ADR 0135 §7), y el protocolo de
  eventos de página lo cumple igual un elemento Angular, uno Preact o uno de otro framework (ADR 0138 §1).

### 3.2 Las composiciones en Umbraco

- **El schema es la fuente de verdad, versionado como XML** con uSync (ADR 0008). En master hay 267 tipos de contenido:
  34 composiciones `comp*` y 186 element types, de los que 92 montan un elemento de la CDN.
- **Cinco capas estancas** en el CMS (ADR 0023): configuración del sitio, composiciones que solo declaran forma,
  bloques renderizables, páginas y cableado (resolvers, providers y emisores).
- **Cuatro tipos de página canónicos** (Standard, Canvas, Bare y Landing) con el Layout Composer (ADR 0017 y 0022).
- **Tres catálogos y dos tipos de colocable** (ADR 0134). Las piezas Razor sirven el SSR puro y el SEO, las piezas del
  design system son el vocabulario chico y las funcionalidades son las apps de vertical. El editor coloca una
  *funcionalidad*, que solo recibe cableado, o una *pieza*, que recibe contenido y monta su gemela del design system.
  La configuración de negocio no la toca el editor (ADR 0137) y el diccionario viaja por las secciones que declara cada
  elemento (ADR 0136).
- **Lo que otro bundle embebe no es colocable** (ADR 0126): un mapa de asientos suelto en una página no tendría evento
  detrás ni nadie que escuche su selección. Un bundle puede publicar varias entradas colocables (ADR 0139).
- **El estado de "Umbraco compone"**: la Tienda ya se compone por páginas desde Umbraco (hito hecho, piloto Lego) y
  Blogs I3 va en curso (hitos públicos en `fuente-publica.md`). El detalle del despiece es **privado hasta el MVP**.

### 3.3 La "sinergia tecnológica": C# y TypeScript del mismo linaje

Esto es lo más demostrable de la fase 2. El tipo nace una vez y los dos compiladores lo comprueban:

1. **Lo que viaja a cada elemento** (ADR 0135). Un `record` C# marcado con `[ElementoSynHost]` declara lo que viaja
   (58 en master, en `CMS:Synergos.CMS.Interfaces/SynHost/`). `ContratoSynHostTests` lo proyecta, con el `config`
   exacto que emite la vista, a `CMS:Synergos.CMS.Web/docs/contracts/elementos-synhost.json`. Del lado del UI,
   `tools/contrato-synhost.mjs` genera `UI:vitals/contracts/src/elementos-synhost.contract.ts`, y el sanitizador de cada
   elemento se tipa con él. Leer una clave que el CMS no manda deja de compilar, y un spec ejecuta el sanitizador con el
   ejemplo emitido: una clave que viaja y nadie lee se pone roja.
2. **Los contratos HTTP** (ADR 0140 §3). Cada capacidad y cada orquestador emite su `openapi.json` desde el código: hay
   18 documentos (9 `Api` y 9 `Bff`) en `CMS:Synergos.CMS.Web/docs/contracts/openapi/`, con un gate de deriva. El UI
   genera de ellos los clientes de los flujos (`UI:vitals/core/src/flujos/generados/`) y el cliente tipado de la puerta
   (`UI:vitals/core/src/flujos/puerta.ts`).
3. **El mismo vocabulario a los dos lados**: `Result` y `Rejection` en `CMS:backend/nucleo/Synergos.Core/`, y
   `ResultadoDelFlujo` y `rechazoLocal` en `UI:vitals/core/src/flujos/transporte.ts`; nombres de dominio en español en
   los dos árboles.
4. **Vectores de prueba compartidos**: el cálculo de la hipoteca existe en C# (`IMortgageCalculator`,
   `HipotecaVectoresTests`) y en TypeScript (`UI:platforms/angular/apps/elements/modules/realty/src/realty/mortgage.calc.ts`),
   y los dos se prueban contra el mismo `mortgage-vectors.json`. Lo mismo pasa con las unidades menores, la comisión y
   el seudónimo (`CMS:Synergos.CMS.Web/docs/contracts/*-vectors.json`).

### 3.4 Diseño atómico

- **En el front**: el registry clasifica cada elemento en primitiva (31), composición (47) o módulo (56). La librería
  `UI:platforms/angular/libs/shared/src/components/` tiene `primitives/` (23), `compositions/` (15), `patterns/` (12) y
  `states/`. Hay dos reglas: Un elemento publicado es una app y no se importa: el componente compartido vive en una lib
  y la app queda como bootstrap fino (ADR 0113). Y la regla de los dos pisos: un elemento con gemela en el design system
  la monta, nunca la reimplementa (ADR 0134 §4).
- **En el back**, el mismo principio con otro piso (`CMS:Synergos.CMS.Web/docs/product/07-diseno-atomico-capacidades.md`).
  Un átomo es una capacidad que **puede decir que no sola** y **es dueña de su almacén**. Lo que no tiene almacén no es
  un servicio, es un tipo, y va a `Synergos.Core`. Ese doc contó dieciséis capacidades; hoy son veinte.
- **El linaje** (**privado**): los precursores de Synergos de finales de 2025 ya organizaban su design system en
  átomos, moléculas, organismos y plantillas. La forma actual (primitiva, composición, módulo) es la que quedó al
  rehacerlo.
- **Lo que falta** (**privado hasta el MVP**): el inventario de piezas del 31 de octubre midió que las apps de cada
  vertical todavía no usan los átomos de la librería, y de ahí salió el piloto Lego. En el sitio se puede decir que el
  despiece está en curso, sin cifras.

### 3.5 Accesibilidad

- **Autoauditoría WCAG 2.1 AA** del CMS, criterio por criterio, en
  `CMS:Synergos.CMS.Web/docs/hardening/wcag-audit.md` (ADR 0078). La reauditoría verificó los huecos: el texto atenuado
  pasó a un contraste de 7,0:1 y las acciones de las tablas del admin llevan un `aria-label` con el contexto de la fila
  (ADR 0079).
- **SSR primero**: la navegación va en grupos planos renderizados en el servidor (ADR 0019) y el Layout Composer emite
  `<nav>`, `<main>`, `<aside>` y `<section>` por área (WCAG 1.3.1, según la auditoría).
- **En los elementos**: un `LiveAnnouncerService` (`UI:platforms/angular/libs/shared/src/services/live-announcer.service.ts`),
  `aria-live` en 84 ficheros, atributos `aria-*` en 325 y `prefers-reduced-motion` en 128 (conteo de ficheros en
  `UI:platforms/`).
- **Lo que no hay**: un gate automático de accesibilidad (axe) en los repos de Synergos. La ADR 0078 lo deja como
  dirección siguiente, y `CMS:tools/verify-ui/` registra landmarks pero no corre axe. El sitio no debe decir
  "accesibilidad verificada automáticamente".

### 3.6 El embebido y la coordinación entre islas

- **Islas que no comparten Angular**: cada elemento arranca su propia app (`createApplication` →
  `createCustomElement` → `customElements.define`, `UI:README.md`), así que la coordinación no puede ser un servicio
  compartido.
- **Entre pestañas o islas del mismo origen**: los buses sobre `BroadcastChannel` de §2.1.
- **Entre los widgets de una página**: un protocolo de eventos DOM, sin framework y sin singleton (ADR 0138, que sigue
  como Propuesta). Ya está construido como `<synergos-flujo>`, un coordinador sin render
  (`UI:vitals/core/src/flujos/coordinador.ts`, ADR 0140 F4). Los participantes se registran con `synergos:register`,
  piden con `synergos:submit-request` y reciben `synergos:submit-result`. Un solo `aria-busy` indica que hay algo en
  vuelo. La clave del flujo nunca es una ruta: nada en el DOM es frontera de confianza.
- **Hacia el servidor**: el coordinador lleva el pedido a la puerta del CMS, `/api/flujos/{flujo}/{operación}`, que
  autentica al miembro y reenvía al orquestador dueño (ADR 0140 §4).

---

## 4. Atlas de patrones: qué está aplicado de verdad

"Sí" quiere decir que hay código en master y, casi siempre, un gate o una ADR. "Parcial" quiere decir que se aplica en
un sitio concreto y no en todo el sistema.

| patrón | ¿aplicado? | evidencia |
|---|---|---|
| **API Gateway** | **Sí**, de borde más una puerta | Un proxy es la única entrada publicada: TLS, cabeceras de seguridad, dos webhooks entrantes hacia sus capacidades y todo lo demás al CMS (`CMS:Caddyfile`). Ningún otro servicio publica puertos («lo que no se publica, no se alcanza desde internet», `CMS:compose.prod.yml`). El CMS es **la puerta** genérica `/api/flujos/{flujo}/{operación}` (ADR 0140 §4) |
| **BFF** | **Sí**, con matiz | 9 orquestadores `Bff.*`, uno por negocio, que componen capacidades para su vertical (`CMS:backend/orquestadores/`, doc 06 §7). El navegador no les habla directo: esa alternativa se descartó en la ADR 0140, y con ella «el CMS deja de ser BFF» |
| **Saga** | **Sí**, orquestada | `SagaEngine`: deshacer, reintentar, rendirse y avisar (`CMS:backend/orquestadores/Synergos.Bff.Core/SagaEngine.cs`). La compensación es un dato y la reserva va en dos tiempos (autorizar o capturar, apartar o consumir, ADR 0140 §1). Un barrido abandona la saga colgada (`CompensationSweeper.cs`) y hay un arriendo por saga (`SagaLease.cs`). Los flujos se declaran como dato: 22 `flujos/*.json` en 9 orquestadores |
| **CQRS** | **No** | Solo hay un modelo de lectura proyectado para el dashboard del CMS (`IDashboardReadModel`, `IMetricsProjectionStore`; ADR 0097, en estado Propuesta). Las capacidades no separan comando y consulta |
| **Event Sourcing** | **No** | Solo aparece como implementación futura posible de un seam (`CMS:Synergos.CMS.Interfaces/IReactionService.cs`) |
| **Outbox** | **No, descartado con argumento** | ADR 0106: el outbox protege el encolado, no el despacho, así que reintroducía el segundo recibo justo donde no se puede. Se eligió at-most-once con un libro de idempotencia |
| **Circuit Breaker** | **Parcial** | En los webhooks salientes del CMS: el `StandardResilienceHandler` con reintento, timeouts y cortacircuitos, ajustable por canal (`CMS:Synergos.CMS.Web/Composers/WebhookResilienceExtensions.cs`; ADR 0052, 0057 y 0069). Hacia el árbol de servicios se decidió **no** ponerlo, con la razón escrita (`CMS:Synergos.CMS.Web/Composers/ClienteDelArbolDeServicios.cs`) |
| **Strangler Fig** | **Sí**, aunque no se llame así | Lo que sale del CMS al árbol se extrae por pasos: cada seam conserva su implementación en proceso y un interruptor `Mode` elige `Api` (ADR 0130 como molde; orden de extracción en el doc 06 §10). En producción, la bitácora del CMS ya va a `Api.Audit`. Lo viejo se queda detrás de su interruptor (regla del superset, ADR 0140 §4) |
| **Database per Service** | **Sí** | Es la regla de atomicidad: «es dueña de su propio almacén» (doc 07 §1). Cada una de las 29 piezas del árbol tiene su volumen (`CMS:compose.prod.yml`) y su almacén JSON (ADR 0105; `CMS:backend/nucleo/Synergos.Shared/JsonCollectionStore.cs`), con un solo escritor por capacidad (`StoreWriteGate.cs`) y el gate `BackendSegregationTests`. El almacén son ficheros, no un motor de base de datos |
| **Service Discovery** | **No** | Las direcciones son configuración por nombre de servicio dentro de la red interna (`Tienda__Capabilities__cart__BaseUrl` en el compose); no hay registro de servicios. En el front, el registry de la CDN resuelve qué bundle monta cada nombre (ADR 0012): se parece, pero no es el patrón |
| **Sidecar** | **No** | sin evidencia |
| **Bulkhead** | **No** | Cada capacidad corre en su proceso, pero no hay pools aislados ni límites de concurrencia |
| **Retry** | **Sí** | Se repite solo si la petición es repetible (método seguro o `Idempotency-Key`) y el fallo es pasajero según la bandera `transient` que manda la capacidad, que se lee y no se deduce (`ClienteDelArbolDeServicios.cs`). Las compensaciones usan retroceso exponencial (`SagaEngine.cs`) y los avisos tienen techo y estado `GivenUp` (`Bff.Core/DeliverySweeper.cs`, `NotificationRetryTests.cs`) |
| **Idempotency** | **Sí** | `CMS:backend/nucleo/Synergos.Core/IdempotencyKey.cs`, `Synergos.Shared/IdempotencyLedger.cs` y `LlaveDeIdempotenciaRequerida.cs`. La llave se deriva por paso e ítem (`{sagaId}:{paso}[:{ítem}]`, `Bff.Core/LlaveDeSaga.cs`), las notificaciones son at-most-once (ADR 0106) y hay test (`LlaveDeIdempotenciaTests.cs`) |
| **Anti-corruption Layer** | **Sí** | La capa `Transport/` de `Api.Payments` traduce los eventos del proveedor a nuestro vocabulario y verifica firma y repetición (`ProviderEvent.cs`, `WebhookVerifier.cs`). Las capacidades guardan referencias externas como pares opacos `(Kind, Id)` que no interpretan (`Synergos.Core/Ref.cs`), y un gate impide nombrar el negocio dentro de una capacidad (ADR 0140 §2) |
| **Event-driven** | **Parcial** | En el navegador sí: eventos DOM `synergos:*` (ADR 0083 y 0138, `coordinador.ts`), los buses sobre `BroadcastChannel` y realtime por SSE (ADR 0111). En el borde, webhooks entrantes. Entre servicios no: todo es HTTP síncrono orquestado por la saga, sin broker |
| **Cache-aside** | **Sí** | `IMemoryCache.GetOrCreate` con TTL en el CMS (`AdminController.cs`; sitemap y RSS, ADR 0036). El registry de la CDN sirve el último snapshot bueno y lo refresca al vencer (ADR 0132), y el runtime con huella va `immutable` (ADR 0141) |
| **Rate limiting** | **Sí**, en formularios y comentarios | `InMemoryFormRateLimiter`, con ventana deslizante por IP y formulario (ADR 0030; `SeamComposer.FormsSearchMemberAdmin.cs`, `CommentsController.cs`). No hay limitador en el árbol de servicios |
| **Health check** | **Sí** | `/health` es obligatorio en las 29 piezas del árbol, con gate (`ApiMoldTests`) y `HEALTHCHECK` de contenedor (`CMS:Dockerfile.service`). El CMS tiene liveness `/healthz` y readiness `/healthz/ready` (ADR 0062, `HealthzController.cs`), y el proxy espera al CMS sano |
| **Config externalizada** | **Sí** | Opciones tipadas enlazadas por sección (`Configure<>`; ADR 0011 para los interruptores) y todo por variables de entorno en el compose generado. Los gates `Cada_punto_de_cableado_ENLAZA_su_seccion` y `El_default_NUNCA_es_el_valor_cableado` (doc 13 §5) y `ComposeStackTests` vigilan que el compose esté al día |

**Fuera de la lista, aplicados de verdad** (candidatos al atlas):

| patrón | evidencia |
|---|---|
| Micro-frontends por custom elements | SynHost, registry e import map (ADR 0015, 0099 y 0141); §2.3 |
| Correlation ID | `Synergos.Shared/Correlation.cs` y `CorrelationIdMiddleware.cs`. Deliberadamente **no** es OpenTelemetry, con la razón escrita en el propio fichero |
| API Composition | los orquestadores componen capacidades; los pasos comunes viven en `Synergos.Bff.Pasos` (ADR 0140 §2) |
| Contratos generados y vigilados (contract-first) | ADR 0135 y ADR 0140 §3; §3.3 |
| Reserva en dos tiempos | ADR 0140 §1 |
| Un solo escritor y arriendo | `StoreWriteGate.cs` y `SagaLease.cs` |
| Firma de webhooks y protección contra repetición | ADR 0050; `Api.Payments/Transport/WebhookVerifier.cs` |
| Degradación honesta | ADR 0112: la degradación cubre la ausencia, nunca la negación |
| Interruptores de funcionalidad | ADR 0011; `Synergos:<X>:Mode` |

**Lo que se decidió no usar, con su argumento** (es criterio, y merece estar en el atlas): el outbox (ADR 0106); el
cortacircuitos hacia el árbol (`ClienteDelArbolDeServicios.cs`); que el navegador hable directo con el orquestador
(ADR 0140, alternativas); un motor de flujos de terceros (ADR 0140, alternativas); OpenTelemetry por ahora
(`Correlation.cs`).

---

## 5. La "fábrica": lo hecho y lo que es visión

La visión del autor: «le pasamos un prompt y esa fábrica, con sus arneses y sus líneas de ensamblaje, reutiliza todos
los Legos para crear lo que le pidas».

### Hecho y público

- **El diseño de la fábrica está escrito y se mide contra el disco**:
  `CMS:Synergos.CMS.Web/docs/product/13-la-fabrica.md` («de un spec a un vertical»). Tiene tres tramos. Arriba, un spec
  que escribe una persona con una cabecera que un gate cruza contra el disco. En medio, la bajada en 14 sub-specs, cada
  uno con un paso del molde, un commit y un gate que ya existe. Abajo, gates, mutación, procesos vivos, humo conectado y
  PR. El doc dice que el tramo de abajo está construido entero y es la mitad cara; del de arriba, a su fecha (29 de
  septiembre), estaban el formato del spec y su validador.
- **El formato del spec y su validador**: `CMS:tools/spec-valida.mjs`, `CMS:.github/workflows/spec-valida.yml` y los
  specs con cabecera en `CMS:docs/specs/` (`eventos`, `social` y `alquiler`).
- **El arnés**: `Synergos.Fabrica`, un marketplace de Claude Code con un plugin y sus skills (`Fabrica:skills/`, 26
  carpetas en `main`), el medidor de criterios (`Fabrica:tools/criterios.mjs`), los tests de estructura y el workflow
  del lock (`Fabrica:consumidor/arnes.yml` y `Fabrica:tools/lock.mjs`). El CMS y el UI fijan el arnés por SHA en
  `arnes.lock.json`: hoy `a821892` (2026-10-07). Según la última sincronización, ese commit está publicado en una rama
  del repo y no en `main`.
- **Tres pilotos con resultado escrito**:
  - **Piloto 0, Eventos**: re-derivado contra lo ya construido (el spec es el oráculo).
  - **Piloto 2, Alquiler** (`CMS:docs/specs/alquiler/spec.md`): el spec se escribió antes del código, con sus
    predicciones, y 11 de 13 acertaron. Fueron 3,5 h de pared del spec al PR verde, ninguna capacidad ni endpoint
    nuevo, el quinto orquestador y 3 gates nuevos. Lo honesto del cierre: el molde costó poco más de un tercio del
    tiempo, y el resto lo pagaron una predicción equivocada (el elemento publicado tenía forma de hotel) y dos defectos
    que solo vieron los procesos vivos.
  - **Piloto 1, Social**: su spec también se escribió antes del código, pero entró en un solo commit, así que su
    tiempo no se puede medir desde el repo. El cierre del piloto 2 lo dice y no fabrica la comparación.
- **Las líneas de ensamblaje en el back**: los flujos se declaran como dato y los ejecuta un motor común (22 flujos en 9
  orquestadores; ADR 0140). Los pasos comunes viven en una capa propia, los contratos se generan y el UI genera sus
  clientes.
- **Los Legos que ya existen**: 20 capacidades, 134 elementos en el registry, 34 composiciones, 92 bloques que montan
  un elemento y la Tienda compuesta por páginas desde Umbraco.

### Hecho, pero privado hasta el MVP

- **El modelo director y líneas** como forma de trabajo: 14 líneas con su spec, worktrees propios, un tablero y una
  constitución. El caso 13 y `fuente-publica.md` ya publican lo publicable.
- **La librería de piezas como base del spec-driven** (pieza → vertical → proyecto) y el inventario que mide qué ya es
  Lego y qué no. El piloto Lego partió la Tienda en capas y la compuso por páginas, y un requerimiento nuevo salió por
  composición.

### Visión: todavía no existe

- **Un prompt como entrada.** Hoy la entrada es un spec que escribe una persona, y el refinamiento es una skill más una
  persona (doc 13 §3). No hay nada que reciba un prompt y lo baje solo.
- **Los dos MCP del doc 13 §7** (`synergos-catalogo` y `synergos-entorno`): no están en ningún repo.
- **El gate del arnés completo** que pide el doc 13 §8: cinco dientes en un `arnes-derivado.mjs` que corra en los tres
  repos. Ese fichero no existe. Lo que sí está es el medidor de los cuatro criterios de rechazo
  (`Fabrica:tools/criterios.mjs`) y el diente del lock (`arnes.yml` y `tools/lock.mjs`).
- **Reutilizar todos los Legos sin intervención.** El piloto 2 mostró por qué todavía no: preguntarle al registry si
  existe un elemento no dice si pide el dato correcto. Y en el UI, las apps de cada vertical aún no están partidas en
  Legos; la receta del piloto Lego espera pasar a otra vertical.

**Cómo contarlo en el sitio sin inventar**: «Synergos ya tiene la mitad cara de una fábrica: el molde, los gates y un
arnés versionado. Un vertical nuevo salió de un spec escrito antes del código en una tarde, sin una capacidad nueva. Lo
que falta es la entrada: que un prompt se convierta en ese spec». La cifra de la tarde se cita con su fuente pública.

---

## 6. Lo que no se publica

- Proveedores, costos y pasos de infraestructura de producción, incluidos los nombres de pasarela, correo y hosting
  que aparecen en el compose, el proxy y la capa `Transport/`.
- Las comparaciones con el código de un empleador anterior que hay en algunas ADR y en el motor de transacción del UI.
- Lo que viene del empleo actual del autor, salvo en genérico (§2.4).
- Rutas locales, datos de prueba, códigos de compra, hashes de la raíz privada y textos legales en borrador.
- Las cifras del inventario de piezas y del despiece (privado hasta el MVP).
