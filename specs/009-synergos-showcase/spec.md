# Feature Specification: Synergos, el showcase

**Feature Branch**: `009-synergos-showcase`, sobre `007-pulido-y-conversion`

**Created**: 2026-11-06

**Status**: Draft, aprobado en boceto por el autor

**Input**: el autor, al ver el boceto de la línea de ensamblaje: "esto debería ser por sí mismo una página… para ampliar
sobre esto, que es básicamente mi master product, mi showcase". El boceto aprobado está en
[`../007-pulido-y-conversion/bocetos/linea-de-ensamblaje.html`](../007-pulido-y-conversion/bocetos/linea-de-ensamblaje.html).

## Principio

Rige el de la 002: se enriquece, no se reemplaza. Tokens, paleta (negro, blanco y `#25ED9E`), tipografía, cristal y el
fondo animado no se tocan (D1). ES y EN en todo. Cero invención: solo los datos de [fuente-publica.md](./fuente-publica.md).
El repo raíz de Synergos sigue privado hasta el MVP; la página enlaza solo lo público.

## Página `/[lang]/synergos`

1. **Hero**: "Synergos" y la idea "el octavo negocio cuesta menos que el primero" (ya es el resumen del caso 12). Botones:
   catálogo en vivo, código (los tres repos) y el caso de estudio.
2. **Qué es**: las tres capas (CDN de componentes Angular y Preact, Umbraco 13 que compone, backend .NET con sus
   servicios), reusando el diagrama del caso 12 (`cdn`, `umbraco`, `micro-frontends`).
3. **Los verticales**: una tarjeta por vertical, con una frase y su estado.
4. **La línea de ensamblaje**: el diagrama del boceto, renderizado en el servidor como SVG. En móvil, los carriles van en
   vertical y bajan hacia el director. Con movimiento reducido, sin pulsos.
5. **Hitos del MVP y cifras**, con la fecha del conteo visible.
6. **Cómo se construye**: enlaces al caso 13 ("Director y líneas") y a Synergos.Fabrica.

## Accesos

Home ("Ahora trabajo en", en la tarjeta de Synergos), el caso 12, la paleta (`> synergos`), el footer, el sitemap, el
asistente y `llms.txt`. El menú principal no cambia sin aprobación del autor.

## Requisitos

- **FR-901**: la página se renderiza en el servidor y se lee completa sin JS.
- **FR-902**: el diagrama tiene una alternativa en texto (lista de líneas con su estado y tareas).
- **FR-903**: la página tiene metadatos, imagen OG propia con la plantilla de la 004 y JSON-LD (`SoftwareApplication` o
  `CreativeWork` enlazado a la `Person`).
- **FR-904**: los datos viven en un solo archivo de contenido (`content/synergos-showcase.ts`), con la fecha del conteo,
  para actualizarlos a mano en cada release.
- **FR-905**: responsive de 320 a 2560 px, axe sin violaciones serias, teclado y movimiento reducido.

## Preguntas al autor

| # | Pregunta | Por defecto |
|---|---|---|
| P-901 | ¿Actualizar las cifras del sitio a 140+ ADR y 6.600+ tests (hoy dicen 130+ y 2.300+)? | Sí, con la fecha |
| P-902 | "31 piezas" no se pudo verificar en el repo. ¿Sigue valiendo? | **Verificada (2026-11-07)**: 31 = un CMS, 20 capacidades, 9 orquestadores y un proxy, contadas en el compose de producción generado de Synergos.CMS (master del 2026-11-05). Ver [fase-2-evidencias.md §1](./fase-2-evidencias.md#1-las-cifras-p-902-y-su-vecindad) |
| P-903 | ¿"Synergos" entra al menú principal? | No, por ahora |

## Idea en espera: patrones aplicados (2026-11-06)

El autor quiere mostrar conocimiento de patrones como en las láminas de "20 microservices patterns", sin saturar. Propuesta:
no es una galería genérica (la lámina de referencia tiene autor y derechos), sino un "atlas de patrones aplicados":
solo los que el autor usó de verdad (saga, BFF, composición de APIs, consumidor idempotente, outbox, anti-corruption
layer, strangler fig, mensajería por eventos…), cada uno con su evidencia: el caso, la ADR o el código. Vive dentro del
showcase de Synergos y de los casos, no como otra sección suelta. Se especifica con el autor cuando cierre la 009.

**Actualización (2026-11-07)**: el atlas queda especificado dentro de la fase 2 (User Story F2-2), con la evidencia de
cada patrón en [fase-2-evidencias.md §4](./fase-2-evidencias.md#4-atlas-de-patrones-qué-está-aplicado-de-verdad).

## Fase 2: la arquitectura por dentro (pedido del autor, 2026-11-06)

**Estado**: Draft, con la investigación hecha (lane SYN2, 2026-11-07). Arranca cuando la fase 1 esté integrada.

**Input**: el autor quiere detallar, con la misma calidad del showcase:

- cómo maneja los frameworks: Angular (y Preact) aislados en la CDN, que alimentan las vistas Razor de Umbraco;
- las composiciones en Umbraco y la "sinergia tecnológica" (C# y TypeScript con el mismo linaje de diseño);
- el diseño atómico y los componentes;
- la accesibilidad;
- el embebido y BroadcastChannel / `postMessage` entre ventanas;
- el atlas de patrones aplicados;
- y, más adelante, la visión: convertir a Synergos en una fábrica de software que reciba un prompt y, con sus arneses
  y sus líneas de ensamblaje, reutilice todos los Legos.

**Fuente única**: [fase-2-evidencias.md](./fase-2-evidencias.md). Cada frase de la fase 2 sale de una fila de ese
documento. Lo que allí está marcado como privado hasta el MVP no se enlaza ni se cifra en el sitio.

### Clarifications

#### Session 2026-11-07 (continuidad con Codex)

- Q: P-904, ¿subpágina o secciones dentro de Synergos? → A: el autor confirma «Sí, subpágina enlazada desde Synergos».
  Se mantiene `/[lang]/synergos/arquitectura`, con acceso desde «Cómo se construye» en `/[lang]/synergos`.
  El autor confirma después P-905 a P-909: decisiones descartadas en un bloque breve, las cuatro entradas adicionales
  propuestas, ninguna experiencia del empleo, cifras públicas de Alquiler con fuente y solo las cifras actuales.
- El autor aprueba el boceto de `bocetos/arquitectura.html` para implementar y las 18 entradas del atlas: las 14
  aplicadas o parciales de las evidencias más micro-frontends, correlation ID, contratos generados y reserva en dos tiempos.

#### Session 2026-11-07 (investigación SYN2, sin entrevista todavía)

- Q: ¿Synergos usa BroadcastChannel? → A: sí, con dos buses en el UI público: uno general y otro tipado y con alcance
  por instancia, para que islas que no comparten Angular se coordinen sin cruzarse (evidencias §2.1).
- Q: ¿Usa un micro-frontend embebido en otra ventana con `postMessage`? → A: no. Solo embebe `iframe` con `sandbox`,
  para contenido de terceros y sin mensajería (evidencias §2.2). Si el autor lo hizo en su empleo, es **experiencia del
  autor en su empleo** y en el sitio solo se cuenta en genérico, sin nombres internos ni cifras (regla de la 004).
- Q: ¿"Angular aislado desde la CDN que alimenta vistas Razor" es de Synergos? → A: sí, es su columna: SynHost, el
  registry de la CDN y un import map con un solo Angular por página (evidencias §2.3).
- Q: ¿Qué patrones de la lista de microservicios están aplicados de verdad? → A: de veinte, doce sí, dos parciales
  (Circuit Breaker y Event-driven) y seis no. Uno de los seis, el outbox, se descartó con argumento (evidencias §4).
- Q: ¿Existe ya la fábrica? → A: la mitad cara (molde, gates y arnés versionado) y un piloto medido. La entrada por
  prompt es visión (evidencias §5).
- Regla nueva para esta fase: algunas fuentes públicas de Synergos se comparan con el código de un empleador anterior.
  Esas comparaciones no se usan nunca en el sitio.

### User Story F2-1 - Del CMS al elemento: cómo se componen los frameworks (Priority: P1)

Un arquitecto o un líder técnico entra a "Synergos por dentro" y entiende en un minuto cómo una vista Razor de Umbraco
termina mostrando un elemento Angular servido desde la CDN. Ve por qué veinte elementos comparten un solo Angular, cómo
compone Umbraco (composiciones, bloques, páginas) y cómo se coordinan islas que no comparten framework: BroadcastChannel
entre islas y pestañas, eventos DOM dentro de la página y la puerta del CMS hacia el servidor.

**Why this priority**: es lo que el autor pidió primero y lo que distingue a Synergos de "hice un sitio en Umbraco". Sin
esto, el atlas y la fábrica no tienen contexto.

**Independent Test**: abrir la subpágina en ES y EN, sin JS, y comprobar que cada bloque de esta historia tiene al menos
una fuente pública enlazada y que el diagrama del recorrido tiene su alternativa en texto.

**Acceptance Scenarios**:

1. **Given** la subpágina, **When** se lee la sección "Del CMS al elemento", **Then** el recorrido aparece en orden
   (vista Razor → emisor SynHost → custom element con su `config` → import map con el runtime compartido → CDN propia),
   como diagrama SVG renderizado en el servidor y como lista en texto.
2. **Given** la sección de frameworks, **When** se lee, **Then** dice que Angular es la plataforma principal y Preact
   la segunda con un elemento, y que el contrato es agnóstico. No afirma React, Svelte ni Vue como plataformas activas.
3. **Given** la sección de Umbraco, **When** se lee, **Then** explica las cinco capas, los dos tipos de colocable
   (funcionalidad y pieza) y que la configuración de negocio no la toca el editor, cada punto con su ADR.
4. **Given** la sección de coordinación, **When** se lee, **Then** distingue los tres mecanismos (BroadcastChannel,
   eventos DOM con el coordinador sin render y la puerta) y no menciona `postMessage` entre ventanas como parte de
   Synergos.
5. **Given** cualquier texto de esta historia, **When** se audita, **Then** no nombra proveedores de producción ni
   empleadores, y no compara con el código de ninguno.

---

### User Story F2-2 - El atlas de patrones aplicados (Priority: P1)

Quien evalúa al autor ve los patrones de microservicios que Synergos aplica de verdad. Cada uno viene con una frase de
cómo se aplica y su evidencia (ADR, fichero o gate), más un grupo corto de lo que se decidió no usar y por qué. No es
una galería genérica ni una copia de láminas ajenas.

**Why this priority**: es la idea del autor para mostrar conocimiento sin saturar, y convierte los nombres de patrones
en criterio comprobable.

**Independent Test**: contar las entradas del atlas contra la tabla §4 de las evidencias. Cada entrada mostrada tiene
estado "aplicado" o "parcial" y al menos un enlace a un repo público. Ningún patrón en "no" aparece como aplicado.

**Acceptance Scenarios**:

1. **Given** el atlas, **When** carga, **Then** muestra los patrones aplicados y parciales de las evidencias §4: API
   Gateway, BFF, Saga, Strangler Fig, Database per Service, Retry, Idempotency, Anti-corruption Layer, Cache-aside,
   Rate limiting, Health check, Config externalizada, Circuit Breaker (parcial) y Event-driven (parcial). Los que el
   autor apruebe de "fuera de la lista" (P-906) se agregan.
2. **Given** una entrada parcial, **When** se lee, **Then** dice dónde se aplica y dónde no, y por qué. Por ejemplo,
   el cortacircuitos está en los webhooks salientes y no hacia el árbol de servicios.
3. **Given** el grupo "lo que decidí no usar", **When** se lee, **Then** cada decisión trae su argumento y su ADR (el
   outbox en la ADR 0106, el navegador directo al orquestador en la ADR 0140).
4. **Given** el caso 12 (Synergos) o el 13 (Director y líneas), **When** se abre, **Then** los patrones que usa ese caso
   aparecen como enlaces a su entrada del atlas, sin repetir su texto.
5. **Given** una pantalla de 320 px, **When** se ve el atlas, **Then** se lee como lista, sin tabla con scroll
   horizontal.

---

### User Story F2-3 - Un tipo, dos compiladores: la sinergia C#/TS, el diseño atómico y la accesibilidad (Priority: P2)

El lector ve que C# y TypeScript comparten linaje: un `record` C# declara lo que viaja, se proyecta a un JSON
versionado, el UI genera de él su tipo TS, y los dos lados tienen gate. Lo mismo pasa con los contratos OpenAPI y con
los vectores de prueba que corren en los dos lenguajes. Ve también el diseño atómico en los dos árboles (primitiva,
composición y módulo en el front; capacidad que dice que no sola y es dueña de su almacén en el back) y lo que Synergos
hace en accesibilidad, con lo que todavía falta dicho de frente.

**Why this priority**: es la parte más original y más demostrable, pero necesita el contexto de la F2-1.

**Independent Test**: seguir cada eslabón de la cadena C# → JSON → TS hasta su fichero en los repos públicos, y
comprobar que la sección de accesibilidad no afirma nada que las evidencias §3.5 no sostengan.

**Acceptance Scenarios**:

1. **Given** la sección "Un tipo, dos compiladores", **When** se lee, **Then** muestra la cadena de la ADR 0135 con sus
   cuatro eslabones enlazados y un ejemplo corto de un `record` y su tipo TS, sacado del repo y no inventado.
2. **Given** la sección de diseño atómico, **When** se lee, **Then** usa los conteos del registry con la fecha del
   conteo, y la regla de atomicidad del back con su doc.
3. **Given** la sección de accesibilidad, **When** se lee, **Then** cita la autoauditoría WCAG 2.1 AA y su
   reauditoría, y dice que no hay un gate automático de accesibilidad en los repos de Synergos.
4. **Given** el despiece de las verticales en Legos, **When** se menciona, **Then** se dice "en curso", sin cifras del
   inventario privado.

---

### User Story F2-4 - La fábrica: lo hecho y la visión (Priority: P3)

El lector entiende hacia dónde va Synergos: una fábrica que, con un spec (y más adelante un prompt), arme un vertical
reutilizando las piezas. La sección separa con claridad lo que ya existe (el molde de 14 pasos con sus gates, el arnés
público versionado por SHA y el piloto de Alquiler medido) de lo que es visión (la entrada por prompt, los MCP y el
gate completo del arnés).

**Why this priority**: es la visión del autor y da dirección al showcase, pero solo vale si no se confunde con lo
construido.

**Independent Test**: cada afirmación de "hecho" enlaza a un fichero público, y cada afirmación de "visión" está bajo un
rótulo visible de visión.

**Acceptance Scenarios**:

1. **Given** la sección, **When** se lee, **Then** tiene dos bloques rotulados, "Ya construido" y "Lo que viene", y
   nada de "Lo que viene" usa verbos en presente que lo hagan parecer hecho.
2. **Given** el piloto de Alquiler, **When** se cita, **Then** sus cifras (11 de 13 predicciones, 3,5 h del spec al PR
   verde, ninguna capacidad nueva) enlazan al spec público del piloto.
3. **Given** el enlace a Synergos.Fabrica, **When** se sigue, **Then** lleva al repo público. El sitio no enlaza la
   raíz privada ni las líneas.

---

### Edge Cases

- Una fuente cambia después del conteo: la fecha del conteo es visible y el dato se actualiza a mano en cada release,
  como pide la FR-904.
- Una ADR que sigue Propuesta pero ya está construida (0138, 0097): el texto dice lo que hace el código y no le cambia
  el estado a la ADR.
- Una evidencia privada hasta el MVP: se describe sin enlace y sin cifras, con el rótulo "privado hasta el MVP".
- Sin JS o con movimiento reducido: los diagramas se ven completos y estáticos, y las listas en texto se leen igual.
- El autor no quiere contar su experiencia de empleo: la sección genérica no se publica y nada más cambia.

### Requirements

- **FR-910**: la fase 2 MUST vivir en una subpágina `/[lang]/synergos/arquitectura` ("Synergos por dentro" / "Inside
  Synergos"), enlazada desde la sección "Cómo se construye" de `/synergos`, salvo que el autor elija otra cosa en la
  P-904.
- **FR-911**: la subpágina MUST renderizarse en el servidor y leerse completa sin JS (como la FR-901).
- **FR-912**: los datos MUST vivir en un solo archivo de contenido (`content/synergos-architecture.ts`), con la fecha del
  conteo, en ES y EN. Cada bloque, patrón o hito MUST llevar al menos una fuente `{ repo, ruta, etiqueta }` hacia un
  repo público, o la marca `privado: true` sin ruta.
- **FR-913**: una prueba MUST fallar si un bloque o un patrón mostrado no tiene fuente, si una fuente apunta fuera de los
  tres repos públicos o si aparece una ruta local.
- **FR-914**: el atlas MUST mostrar solo patrones con estado `aplicado` o `parcial` según las evidencias §4, más el
  grupo "lo que decidí no usar" con su argumento. Un patrón en estado `no` MUST NOT mostrarse como aplicado.
- **FR-915**: cada entrada del atlas MUST tener un ancla estable (`#patron-saga`, …) para que los casos 12 y 13 y el
  asistente enlacen a ella.
- **FR-916**: los diagramas (recorrido CMS → elemento, cadena C# → TS y coordinación de islas) MUST ser SVG renderizado
  en el servidor, con alternativa en texto, sin pulsos con movimiento reducido y en vertical en móvil, como el diagrama
  de la fase 1.
- **FR-917**: la prueba de confidencialidad de la 004 (FR-444) MUST cubrir los textos de la fase 2: ningún nombre de
  empleador actual o anterior, ni de clientes ni de proveedores de producción, ni comparaciones con el código de
  ninguno.
- **FR-918**: lo que venga del empleo del autor y no esté en Synergos MAY publicarse solo como un bloque genérico,
  escrito por el autor, separado de las evidencias de Synergos y sin nombres internos ni cifras.
- **FR-919**: la sección de la fábrica MUST separar "Ya construido" de "Lo que viene" con rótulos visibles, y "Lo que
  viene" MUST NOT tener cifras.
- **FR-920**: las cifras que la fase 2 repite (31 piezas, 20 capacidades, 9 orquestadores, ADR, tests y elementos)
  MUST salir de `content/synergos.ts`, y no copiarse a mano.
- **FR-921**: la subpágina MUST tener metadatos, su imagen OG con la plantilla de la 004 y JSON-LD `TechArticle` (o
  `CreativeWork`) con `about` hacia el `SoftwareApplication` de la fase 1 y `author` hacia la `Person`.
- **FR-922**: la subpágina MUST entrar al sitemap, a `llms.txt`, al índice del buscador, a la paleta (`> synergos
  arquitectura`) y al asistente, que MUST responder "qué patrones usa Synergos" con el atlas y sus fuentes.
- **FR-923**: responsive de 320 a 2560 px, sin violaciones serias de axe, navegable con teclado y con movimiento
  reducido (como la FR-905).
- **FR-924**: el menú principal no cambia (como la P-903).

### Key Entities

- **Tema de arquitectura**: id, título y cuerpo (ES y EN), fuentes, diagrama opcional y `privado` opcional.
- **Patrón**: id (ancla), nombre (en inglés, que es como se busca), estado (`aplicado` · `parcial` · `descartado`),
  cómo se aplica (ES y EN), dónde no se aplica (para los parciales), fuentes y casos que lo usan (12 y 13).
- **Fuente**: repo (`Synergos.CMS` · `Synergos.UI` · `Synergos.Fabrica`), ruta relativa al repo, etiqueta (ADR, fichero
  o gate) y fecha del conteo.
- **Hito de la fábrica**: bloque (`hecho` · `vision`), texto y fuente (obligatoria solo en `hecho`).

### Success Criteria

- **SC-910**: el 100 % de los bloques y patrones mostrados tiene una fuente válida o la marca de privado, y la prueba de
  la FR-913 pasa.
- **SC-911**: 0 nombres de empleadores, clientes o proveedores de producción en los textos de la fase 2. La prueba de
  confidencialidad pasa, y el autor lo confirma al revisar.
- **SC-912**: el atlas muestra exactamente los patrones aplicados y parciales que el autor aprueba de las evidencias §4,
  sin ninguno en estado "no".
- **SC-913**: una persona técnica que no conoce Synergos explica, después de leer la F2-1, cómo llega un elemento
  Angular de la CDN a una vista Razor. Se prueba con una lectura en voz alta del autor o de un tercero.
- **SC-914**: la subpágina pasa axe sin violaciones serias, se lee completa sin JS y no tiene scroll horizontal de 320 a
  2560 px.
- **SC-915**: el asistente contesta "qué patrones usa Synergos" con al menos tres patrones y sus enlaces.

### Assumptions

- La fase 1 (`/synergos`) está integrada en `dev` antes de empezar. Otra lane la está tocando ahora, y la fase 2 no
  edita sus componentes salvo para agregar el enlace a la subpágina.
- Las cifras se toman del master público del 5 de noviembre de 2026 y se actualizan a mano en cada release.
- Se mantienen la entrevista corta y el boceto: el boceto de la subpágina se aprueba antes de escribir código.

### Preguntas al autor (fase 2)

| # | Pregunta | Por defecto |
|---|---|---|
| P-904 | ¿La fase 2 va en una subpágina `/synergos/arquitectura` o como secciones nuevas dentro de `/synergos`? | Confirmado por el autor (2026-11-07): subpágina enlazada desde Synergos, en "Cómo se construye" |
| P-905 | ¿El atlas muestra también lo que se decidió no usar (outbox, cortacircuitos hacia el árbol, navegador directo al orquestador)? | Sí, bloque breve; confirmado por el autor (2026-11-07) |
| P-906 | ¿Cuáles de los patrones "fuera de la lista" entran al atlas (micro-frontends, correlation ID, API composition, contratos generados, reserva en dos tiempos, un solo escritor, firma de webhooks, degradación honesta, interruptores)? | Confirmados por el autor (2026-11-07): micro-frontends, correlation ID, contratos generados y reserva en dos tiempos; 18 entradas en total |
| P-907 | ¿Quieres contar en genérico el embebido entre ventanas que hiciste en tu empleo? Si sí, lo escribes tú. | No; confirmado por el autor (2026-11-07) |
| P-908 | ¿Se publican las cifras del piloto de Alquiler (11 de 13 predicciones, 3,5 h)? Ya están en el repo público. | Sí, con fuente; confirmado por el autor (2026-11-07) |
| P-909 | ¿Se cuenta la evolución de agosto a noviembre (de 4 a 9 orquestadores, de 2.353 a 6.675 tests)? | No, solo cifras actuales; confirmado por el autor (2026-11-07) |
