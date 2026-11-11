# Feature Specification: Laboratorio de IA (AI Lab)

**Feature Branch**: `003-laboratorio-ia` (sobre la 002 integrada; usa piezas de la
[004](../004-contenido-presente/spec.md))

**Created**: 2026-11-04

**Status**: Draft

**Input**:
- La idea del autor: [idea.md](idea.md).
- La investigación: [research.md](research.md).
- El catálogo de 31 experimentos: [catalogo.md](catalogo.md).
- El handoff del autor del 2026-11-04 (privado, fuera del repo), del que sale el copy base.
- Los juegos que aprenden (J1 a J3), pedidos por el autor.

## Principio rector

Una página que no habla de IA sino que **la deja usar**. Cada experimento dice dónde corre, cómo está hecho y qué
decidió el autor. Esta spec construye solo lo que cabe en la constitución tal como está (camino A):

- todo corre en el navegador del visitante;
- sin servidor nuevo, sin llaves y sin variables de entorno nuevas (principio VIII);
- nada de lo que el visitante graba, escribe o juega sale de su equipo, salvo donde un experimento lo dice antes.

**La decisión A/B sigue abierta (P-3a).** Lo que depende de B, o de un dato que solo el autor puede dar, va como
historia condicionada y no entra al plan.

### Reglas de contenido

- Las vitrinas usan solo datos inventados. Nunca material de casos reales, datos de clientes ni precios de proveedores.
- Ningún nombre interno del empleador. El dictador de voz del autor no se nombra mientras P-3e siga abierta.
- Cero invención: lo que no está en la idea, el research, el catálogo o el handoff no se publica.
- Español e inglés con paridad.

## Alcance

| En detalle (camino A) | Condicionado (va en Preguntas abiertas) | Fuera de esta spec |
|---|---|---|
| La página `/[lang]/ai-lab`, el formato de tarjeta, el consentimiento antes de descargar, la privacidad, el rendimiento y la accesibilidad | Camino B: las variantes B de V2, V3, A4 y A5, la ola 3 completa y V6, A9 (generado) y C3 (P-3a) | El backlog en camino A sin ola: R3, R4, A9 (plantillas), A11, C1, C2 (a mano) y C4. Se especifican en una iteración posterior |
| **Ola 1**: V1 Transcriptor, V4 Navega hablando, A2 Anatomía de un plugin, A3 Crea tu skill y R1 Simulador de sagas | A1 Servidor MCP (P-3b) | C5 `llms.txt`, que es de la 004 (US11) |
| **Juegos**: J1 Peloteo contra la IA y J2 Juega contra tu clon | J3 Cerebro colectivo (P-3j) | |
| **Ola 2, partes A**: A5 Buscador con caja de cristal, A4 Vitrinas Despacho y Obra con resultados pregenerados y Pyodide, V2 Texto → voz y V3 Escuchar los posts con la voz del navegador | R2 Arma una página (P-3d), A10 Repetición de una sesión (P-3f) y A13 Agent-ready (P-3i) | |

## Clarifications

### Session 2026-11-04 (lo que ya está decidido)

- Q: ¿Camino A, B o mixto? → sin decisión (P-3a). Esta spec construye A y deja B condicionado.
- Q: ¿Python en el servidor? → no hace falta para las demos. Pyodide cubre "Python en pequeño" en el navegador
  (research §1).
- Q: ¿Investigador sin llave? → solo sobre fuentes curadas con extractos citados (research §5). Como la app 2 (A12) es
  de la ola 3, queda condicionada.
- Q: ¿Juegos? → sí, por pedido del autor. J1 es un juego **original** del género tenis de mesa, con identidad propia
  (paletas de cristal, bola de partículas y estética Matrix del sitio). No es copia de ningún juego existente.
- Q: ¿`llms.txt`? → lo hace la 004 (US11), porque es un cambio del sitio.
- Q: ¿Dónde se guarda lo que aprende el rival de J1 y J2? → en el navegador del visitante (catálogo). Se trata como
  progreso del visitante, igual que los easter eggs descubiertos del principio IV, nunca como contenido del sitio, y se
  puede borrar con un botón.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La página del laboratorio y sus tarjetas (Priority: P1)

Quien entra a `/es/ai-lab` o `/en/ai-lab` lee una intro corta y ve los experimentos agrupados por tema: Voz,
Arquitectura que se toca, Agentes y plugins, y Juegos que aprenden. Cada tarjeta muestra lo mismo:

- **Pruébalo**: la demo.
- **Cómo funciona**: un diagrama pequeño y tarjetas Decisión · Por qué · Trade-off.
- **El código**: un fragmento real y el enlace al repo.
- **Etiquetas**: estado (`stable`, `beta` o `experiment`) y dónde corre.
- **Privacidad**: una línea sobre qué pasa con los datos.

Ningún experimento descarga nada hasta que el visitante lo pide y acepta, viendo cuánto pesa.

**Why this priority**: es el marco de todos los experimentos y la promesa de privacidad y rendimiento.

**Independent Test**: abrir la página en ES y EN, con y sin JS, en móvil y escritorio, y medir la red: 0 bytes de
modelos antes de un consentimiento.

**Acceptance Scenarios**:

1. **Given** `/es/ai-lab`, **When** carga, **Then** muestra el título, la intro, la línea de privacidad y las tarjetas por
   tema. Cada tarjeta trae el estado y "Corre en tu navegador".
2. **Given** la página recién cargada, **When** se revisa la red, **Then** no se descargó ningún modelo, `.wasm` ni peso,
   y el LCP es ≤ 2,5 s.
3. **Given** un experimento que necesita un modelo, **When** el visitante pulsa "Probar", **Then** un diálogo le dice
   qué se descarga, cuánto pesa, de dónde viene y que queda guardado en su navegador. Nada se descarga hasta que
   acepta.
4. **Given** que el visitante cancela el diálogo, **When** vuelve a la tarjeta, **Then** la tarjeta sigue usable en lo que
   no necesita el modelo, y lo explica.
5. **Given** que no hay JS, **When** se ve la página, **Then** se leen todas las tarjetas, con su "Cómo funciona" y su
   código, y se avisa que la demo necesita JavaScript.
6. **Given** "Borrar lo que el laboratorio guardó", **When** se activa, **Then** se borran los modelos descargados y lo
   que aprendieron J1 y J2, y se confirma con un aviso.

---

### User Story 2 - Transcriptor (Priority: P1, V1, app 1 de la idea)

El visitante graba su voz o sube un audio y obtiene el texto con marcas de tiempo, en español o inglés, sin que el
audio salga de su equipo. Exporta `.txt` y `.srt`.

**Why this priority**: es la app 1 que pidió el autor, y la demo más clara de IA en el navegador.

**Independent Test**: transcribir un audio de prueba de 30 s en ES y otro en EN, con el modelo por defecto y con el de
respaldo, revisando la red y el fondo animado.

**Acceptance Scenarios**:

1. **Given** el consentimiento dado, **When** el visitante sube un audio o graba, **Then** ve la transcripción con marcas
   de tiempo y el tiempo real que tardó, medido en su equipo.
2. **Given** la transcripción, **When** pulsa "Exportar", **Then** descarga un `.txt` y un `.srt` válidos, generados en el
   navegador.
3. **Given** la red durante la transcripción, **When** se revisa, **Then** el audio no se envió a ningún lado.
4. **Given** un equipo modesto o sin WebGPU, **When** se abre, **Then** se ofrece el modelo de respaldo, más pequeño, con
   su peso.
5. **Given** la transcripción en curso, **When** se mide el fondo animado, **Then** sigue a 50 fps o más (002, SC-205),
   porque la inferencia corre en un worker.

---

### User Story 3 - Anatomía de un plugin y Crea tu skill (Priority: P1, A2 y A3)

El visitante explora un plugin de Claude Code (`plugin.json`, skills, comandos, hooks y servidores MCP). Al tocar cada
archivo se explica para qué sirve. Al final arma su propio `SKILL.md` con un formulario y lo descarga.

**Why this priority**: muestra que el autor crea plugins por profesión, sin descargas pesadas.

**Independent Test**: recorrer el árbol con teclado y generar un `SKILL.md` que pase la validación de su frontmatter.

**Acceptance Scenarios**:

1. **Given** el explorador, **When** se elige un archivo con clic o teclado, **Then** se muestra su contenido y una
   explicación. El árbol es accesible como árbol (`role="tree"`).
2. **Given** el formulario de skill (nombre, cuándo usarla y pasos), **When** se completa, **Then** se descarga un
   `SKILL.md` con frontmatter válido, generado en el navegador.
3. **Given** un nombre inválido o una descripción vacía, **When** se intenta descargar, **Then** el formulario dice qué
   corregir.
4. **Given** P-3c sin resolver, **When** se publica, **Then** el plugin mostrado es un ejemplo neutral, no un plugin real
   del autor.

---

### User Story 4 - Simulador de sagas (Priority: P1, R1)

El visitante reserva un viaje (vuelo, hotel y auto). En mitad del cobro "mata" un servicio y ve cómo el sistema deshace
lo que ya estaba hecho, y por qué deshacer una reserva no es lo mismo que soltar un apartado.

**Why this priority**: es arquitectura que se toca y sostiene el caso de Synergos (004). Sin modelos ni descargas.

**Independent Test**: correr la saga completa, fallar en cada paso y comprobar la compensación en el diagrama y en la
bitácora de texto.

**Acceptance Scenarios**:

1. **Given** el simulador, **When** se inicia la reserva, **Then** cada paso avanza en el diagrama y en una bitácora de
   texto.
2. **Given** un servicio caído a mitad del cobro, **When** falla, **Then** la compensación se ejecuta en orden inverso y la
   bitácora explica cada paso.
3. **Given** movimiento reducido o lector de pantalla, **When** se usa, **Then** todo se entiende por la bitácora, sin
   animación.

---

### User Story 5 - Navega hablando (Priority: P2, V4)

El visitante dice "llévame al blog", "cambia a tema claro" o "abre mi CV", y la voz se vuelve un comando de la paleta
del sitio (004, FR-451).

**Why this priority**: une el laboratorio con el sitio, pero reutiliza el motor de V1, así que va después.

**Independent Test**: dictar cada comando de la lista en ES y EN, y uno desconocido.

**Acceptance Scenarios**:

1. **Given** el consentimiento para el modelo de V1, **When** el visitante mantiene el botón y dice un comando conocido,
   **Then** se ejecuta el comando de la paleta equivalente y se anuncia.
2. **Given** un comando que no se reconoce, **When** termina de hablar, **Then** ve lo que se entendió y la lista de
   comandos posibles.
3. **Given** que no puede o no quiere hablar, **When** usa la tarjeta, **Then** puede escribir el comando (alternativa en
   texto).

---

### User Story 6 - Peloteo contra la IA (Priority: P2, J1)

El visitante juega un peloteo de tenis de mesa original, con paletas de cristal y una bola de partículas, contra un
rival que empieza torpe y aprende en vivo, partida a partida. A un lado se ve su "cerebro": neuronas que se encienden
con cada decisión, en el lenguaje del mapa cerebral del sitio, y una curva de cuánto mejora.

**Why this priority**: es el experimento más llamativo y no necesita descargas, pero exige el trabajo más fino de
rendimiento y accesibilidad.

**Independent Test**: jugar 20 rallies con teclado, mouse y toque. Medir los fps del fondo, la curva de aprendizaje y el
modo de solo texto.

**Acceptance Scenarios**:

1. **Given** el juego, **When** se juega con teclado, mouse o toque, **Then** la paleta responde, y hay pausa (tecla, botón
   y al ocultar la pestaña).
2. **Given** varias partidas, **When** se ve la curva, **Then** muestra que el rival devuelve más bolas que al principio.
3. **Given** el entrenamiento, **When** corre, **Then** va en un worker y el fondo animado sigue a 50 fps o más.
4. **Given** movimiento reducido, **When** se juega, **Then** la bola no deja estelas y no hay temblores de pantalla.
5. **Given** un lector de pantalla, **When** se usa la tarjeta, **Then** el marcador se anuncia con `aria-live`, y existe
   el modo "mira a la IA entrenar sola", con un resumen de la curva en texto.
6. **Given** que el visitante vuelve otro día, **When** abre el juego, **Then** el rival recuerda lo aprendido en ese
   navegador, salvo que lo haya borrado.

---

### User Story 7 - Juega contra tu clon (Priority: P2, J2)

Después de unos rallies, el rival aprende el estilo del visitante por imitación, y el visitante juega contra una IA que
se mueve como él.

**Why this priority**: reutiliza el motor de J1.

**Independent Test**: jugar los rallies de grabación y comprobar que el clon imita la tendencia del jugador.

**Acceptance Scenarios**:

1. **Given** el modo clon, **When** el visitante juega los rallies de grabación, **Then** se entrena el clon en un worker y
   se le avisa cuándo está listo.
2. **Given** el clon listo, **When** se juega contra él, **Then** su movimiento se parece al del visitante: una métrica
   simple de parecido se muestra en pantalla.
3. **Given** la privacidad, **When** se revisa la red, **Then** los movimientos grabados no salieron del navegador.

---

### User Story 8 - Buscador semántico con caja de cristal (Priority: P2, A5 en camino A, app 5)

El visitante pregunta algo del blog, de los proyectos o de la carrera, y ve los fragmentos recuperados con su puntaje y
su fuente ("caja de cristal"). Reemplaza la búsqueda por palabras del chat actual en el laboratorio.

**Why this priority**: es la app 5 y hace honesto el "RAG" del perfil cuando el autor lo decida (P-3g). Sin llave.

**Independent Test**: preguntar "¿cómo maneja Synergos las sagas?" y comprobar fragmentos, puntajes y fuentes.

**Acceptance Scenarios**:

1. **Given** una pregunta, **When** se busca, **Then** se listan los fragmentos con su puntaje, su fuente y el enlace a la
   sección. Por defecto es BM25 sobre el índice que ya existe, sin descargas.
2. **Given** la opción "por significado", **When** el visitante la activa y acepta la descarga, **Then** la consulta se
   embebe en el navegador contra un índice precalculado, y se comparan los dos rankings.
3. **Given** el CV en PDF, **When** se busca, **Then** no está indexado: solo los datos del sitio (004, FR-422).

---

### User Story 9 - Vitrinas por profesión: Despacho y Obra (Priority: P2, A4 en camino A, apps 3 y 4)

- **"Despacho"** convierte un caso **ficticio** en hechos con prueba y una cronología, con resultados pregenerados.
- **"Obra"** convierte una bitácora **de ejemplo** en cantidades y un estimado en COP, con Python corriendo en el
  navegador (Pyodide).

**Why this priority**: muestra los plugins por profesión con datos inventados. Obra necesita la descarga de Pyodide.

**Independent Test**: recorrer Despacho sin descargas, y en Obra cambiar un valor de la bitácora y ver el estimado
recalculado.

**Acceptance Scenarios**:

1. **Given** Despacho, **When** se abre, **Then** se ve el caso ficticio, los hechos con su prueba y la cronología, con
   una línea que dice "datos inventados".
2. **Given** Obra con el consentimiento para Pyodide, **When** se cambia una cantidad, **Then** el estimado se recalcula
   en un worker con Python y muestra el código que corrió.
3. **Given** los precios de Obra, **When** se revisan, **Then** son de ejemplo y lo dicen. Nunca son de proveedores reales.

---

### User Story 10 - Texto → voz y Escuchar los posts (Priority: P3, V2 y V3 en camino A)

El visitante escribe un texto y lo escucha con las voces de su navegador en español e inglés (V2). El mismo motor lee
un post del blog (V3), y es la base de "Escuchar este post" de la 005.

**Why this priority**: es útil y accesible, pero depende de las voces de cada sistema, y en algunos navegadores la voz
la genera un servicio en línea.

**Independent Test**: escuchar un texto y un post en ES y EN en Chrome, Edge, Firefox y Safari.

**Acceptance Scenarios**:

1. **Given** V2, **When** se escribe un texto y se elige una voz, **Then** se escucha, con reproducir, pausar y detener
   desde el teclado.
2. **Given** un navegador cuyas voces se generan en línea, **When** se usa, **Then** la tarjeta lo advierte antes de
   reproducir.
3. **Given** V3 sobre un post, **When** se reproduce, **Then** lee solo el cuerpo, sin bloques de código, en el idioma de
   la página.

---

### Historias condicionadas (no entran al plan)

| ID | Historia | Condición |
|---|---|---|
| HC-1 | Variantes con servidor o llave: voces neuronales (V2), audio pregenerado (V3), vitrinas en vivo (A4), respuestas con LLM (A5), la ola 3 completa (V5, A6, A7, A8 y A12) y V6, A9 generado y C3 | P-3a: el autor aprueba el camino B con una enmienda al principio VIII |
| HC-2 | Servidor MCP del portafolio (A1): ruta de solo lectura en el mismo Next.js, sobre el registro de capacidades de la 004 y con límite de frecuencia | P-3b **[confirmar]** |
| HC-3 | Cerebro colectivo (J3): un rival que entrenan todos los visitantes, sobre la base que ya existe, con validación en el servidor y límites (principio III) | P-3j **[confirmar]** |
| HC-4 | Arma una página con mis piezas (R2), con bloques reales del design system de Synergos | P-3d **[confirmar]**: el CDN es público y la CSP lo permite |
| HC-5 | Repetición de una sesión de agentes (A10), con datos limpios | P-3f **[confirmar]**: qué sesión y quién la limpia |
| HC-6 | Este sitio es agent-ready (A13): la lista de herramientas WebMCP de la 004 y, si se decide, su ejecución desde la página | P-3i |

### Edge Cases

- El navegador no tiene WebGPU: el transcriptor usa WASM y el modelo de respaldo, y lo dice.
- La descarga se corta a la mitad: se puede reintentar sin recargar, y lo descargado a medias no queda como válido.
- El visitante niega el micrófono: la tarjeta ofrece subir un archivo.
- Un audio de más de 10 minutos o un archivo de un formato que no se puede leer: se avisa antes de procesar.
- El almacenamiento del navegador está lleno o bloqueado (modo privado): los experimentos funcionan sin recordar nada y
  lo explican.
- La pestaña se oculta en medio del entrenamiento o la inferencia: el worker se pausa y retoma al volver.
- Un móvil de gama baja: los juegos bajan la frecuencia del entrenamiento antes de bajar los fps.
- Datos guardados por una versión anterior del juego: se descartan y el rival empieza de nuevo.

## Requirements *(mandatory)*

### Functional Requirements

#### Página y tarjeta

- **FR-301**: El sitio MUST servir `/[lang]/ai-lab`, con la intro, la línea de privacidad y las tarjetas por tema, todo
  renderizado en el servidor. El menú principal suma el enlace solo si P-3h lo aprueba. Mientras tanto, se llega desde la
  paleta (004, "Abrir el AI Lab") y desde el footer.
- **FR-302**: Cada experimento MUST describirse como dato tipado: id, tema, título y resumen localizados, estado, dónde
  corre, peso de sus descargas, privacidad, tarjetas Decisión · Por qué · Trade-off, fragmento de código y enlace al repo.
- **FR-303**: La tarjeta MUST tener las cinco partes del formato (Pruébalo, Cómo funciona, El código, Etiquetas y
  Privacidad). "Cómo funciona" reutiliza las tarjetas ADR de la 004 (FR-442).
- **FR-304**: El código de cada demo MUST cargarse solo cuando el visitante abre esa tarjeta. La página no carga el código
  de ningún experimento al inicio.

#### Descargas, consentimiento y almacenamiento

- **FR-310**: Ningún modelo, peso, `.wasm` ni runtime MUST descargarse sin un consentimiento explícito. El diálogo dice:
  - qué se descarga;
  - cuánto pesa;
  - de qué servidor viene (por ejemplo, Hugging Face o jsDelivr);
  - que queda guardado en el navegador.
- **FR-311**: El consentimiento MUST valer por experimento y por sesión, y MUST poder retirarse.
- **FR-312**: "Borrar lo que el laboratorio guardó" MUST borrar los modelos en caché y el estado de J1 y J2.
- **FR-313**: El estado guardado de J1 y J2 MUST ser solo del visitante: nunca contenido del sitio ni datos de otros, y
  versionado, para descartar formatos viejos.

#### Privacidad

- **FR-320**: En camino A, el audio, el texto, los archivos y los movimientos del visitante MUST NOT salir de su equipo.
- **FR-321**: Si una API del navegador procesa datos en línea (las voces en línea de la Web Speech API, por ejemplo), la
  tarjeta MUST advertirlo antes de usarla.
- **FR-322**: La política de privacidad del sitio MUST sumar una sección del laboratorio: qué se descarga, qué se guarda
  en el navegador, cómo borrarlo y qué no se envía.

#### Rendimiento

- **FR-330**: La inferencia y el entrenamiento MUST correr en Web Workers y pausarse con la pestaña oculta.
- **FR-331**: Con un experimento activo, el fondo animado MUST seguir en los presupuestos de la 002 (SC-204 y SC-205).
- **FR-332**: Los juegos MUST bajar primero la frecuencia del entrenamiento y después, si hace falta, la calidad
  visual, antes de bajar los fps.

#### Accesibilidad

- **FR-340**: Cada demo MUST ser operable con teclado. Todo lo que es de voz MUST tener alternativa en texto.
- **FR-341**: Los juegos MUST tener pausa, controles de teclado, mouse y toque, marcador anunciado con `aria-live` y un
  modo de solo observación con resumen en texto.
- **FR-342**: Con movimiento reducido, las animaciones de los experimentos MUST reducirse a lo esencial: sin estelas,
  temblores ni pulsos.

#### Experimentos

- **FR-350** (V1): Transcripción de audio grabado o subido, con marcas de tiempo, en ES y EN, con un modelo Whisper en el
  navegador (por defecto y de respaldo; research §2). Exporta `.txt` y `.srt`, y muestra el tiempo real medido.
- **FR-351** (V4): Los comandos de voz se traducen a comandos del registro de la paleta de la 004 (FR-451), y existe una
  alternativa escrita. Reutiliza el modelo de V1.
- **FR-352** (A2): Explorador de un plugin de ejemplo neutral (P-3c), con árbol accesible y una explicación por archivo.
- **FR-353** (A3): Genera un `SKILL.md` con frontmatter válido (`name` y `description`) y pasos, descargable, sin
  servidor.
- **FR-354** (R1): Simulación determinista de una saga de tres pasos con fallo inyectable y compensación en orden
  inverso, con diagrama y bitácora de texto.
- **FR-355** (J1): Juego original de tenis de mesa contra un rival que aprende por refuerzo con una red pequeña en un
  worker. Muestra la actividad de sus neuronas y la curva de aprendizaje.
- **FR-356** (J2): Modo clon: el rival aprende por imitación de los movimientos del visitante, con el mismo motor de J1, y
  muestra una métrica de parecido.
- **FR-357** (A5): Búsqueda con caja de cristal (fragmento, puntaje y fuente) con BM25 sobre el índice que ya existe.
  Opcionalmente, embeddings en el navegador contra un índice precalculado, con consentimiento.
- **FR-358** (A4): Despacho con un caso ficticio y resultados pregenerados, y Obra con una bitácora de ejemplo y un
  cálculo en Python con Pyodide en un worker. Las dos dicen "datos inventados".
- **FR-359** (V2 y V3): Síntesis de voz con la Web Speech API, en ES y EN. V3 expone un motor reutilizable que lee el
  cuerpo de un post, del que dependerá "Escuchar este post" de la 005.

#### Transversales

- **FR-370**: Todo el copy MUST existir en ES y EN, en un namespace propio del laboratorio.
- **FR-371**: Toda dependencia nueva MUST justificarse en el plan según el principio VIII. No se agregan servicios,
  cuentas, llaves ni variables de entorno.
- **FR-372**: Ningún experimento MUST mostrar cifras o nombres internos del empleador, material de clientes ni el nombre
  del dictador de voz mientras P-3e siga abierta.

### Key Entities

- **Experimento del laboratorio**: id (`V1`, `J1`…), tema, título, resumen, estado, dónde corre, descargas (nombre, peso
  y servidor), privacidad, decisiones ADR, fragmento de código y repo.
- **Descarga consentida**: experimento, recurso, peso, servidor y fecha del consentimiento en la sesión.
- **Estado de juego**: versión, pesos de la red, curva de aprendizaje y modo (rival o clon). Vive solo en el navegador.
- **Comando de voz**: frase en ES y EN, y comando del registro de la paleta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-301**: `/[lang]/ai-lab` carga con 0 bytes de modelos, pesos o `.wasm`, y LCP ≤ 2,5 s en móvil de gama media.
- **SC-302**: Con cualquier experimento activo, el fondo animado se mantiene a 50 fps o más (002, SC-205), y el INP de la
  página ≤ 200 ms.
- **SC-303**: El transcriptor procesa 30 s de audio con el modelo por defecto en 60 s o menos en un portátil de gama
  media. Si no se cumple, el modelo por defecto pasa al de respaldo.
- **SC-304**: En J1, tras 20 rallies, la tasa de devolución del rival sube al menos 30 puntos porcentuales respecto del
  primero (medido en una simulación de prueba).
- **SC-305**: 0 peticiones con audio, texto, archivos o movimientos del visitante durante los experimentos en camino A
  (auditoría de red).
- **SC-306**: Accesibilidad de 95 o más y 0 violaciones críticas en la página y en cada experimento abierto.
- **SC-307**: El 100 % de los `SKILL.md` generados en las pruebas pasa la validación de su frontmatter.

## Assumptions

- La 003 arranca después de la 004. Usa su registro de comandos de la paleta, las tarjetas ADR, la plantilla OG y el
  registro de capacidades.
- Los pesos de los modelos vienen de Hugging Face y Pyodide, de jsDelivr. No piden cuenta, y no van en `public/` por su
  tamaño (research, "Riesgos y reglas").
- Si se agrega una CSP, debe permitir `wasm-unsafe-eval`, workers `blob:` y esos dos servidores.
- Las cifras de rendimiento de research §2 están sin verificar. El plan las mide antes de fijar el modelo por defecto.

## Copy base (ES / EN)

| Clave | ES | EN |
|---|---|---|
| `ailab.title` | AI LAB | AI LAB |
| `ailab.intro` | Aquí no te cuento lo que sé hacer con IA: te dejo probarlo. Cada experimento te dice dónde corre, cómo está hecho y qué decidí. La mayoría funciona por completo en tu navegador. | Here I don't tell you what I can do with AI: I let you try it. Each experiment tells you where it runs, how it's built and what I decided. Most of them run entirely in your browser. |
| `ailab.plugins` | También creo plugins de IA para profesiones concretas. Para una abogada, skills que organizan el material del caso, contrastan hipótesis y generan documentos. Para un ingeniero estructural, un asistente que lee sus bitácoras, ayuda con los cálculos y arma el estimado. Las vitrinas de abajo usan solo datos inventados. | I also build AI plugins for specific professions. For a lawyer, skills that organize case material, test hypotheses and draft documents. For a structural engineer, an assistant that reads his logs, helps with calculations and builds the estimate. The showcases below use made-up data only. |
| `ailab.privacy` | No guardo tu audio ni tu texto. Se procesan en tu navegador y no salen de él. | I don't store your audio or your text. They're processed in your browser and never leave it. |
| `ailab.runsIn.browser` | Corre en tu navegador | Runs in your browser |
| `ailab.consent.title` | Antes de descargar | Before downloading |
| `ailab.consent.body` | Este experimento descarga {resource} ({size}) desde {host}. Queda guardado en tu navegador para la próxima vez. | This experiment downloads {resource} ({size}) from {host}. It stays in your browser for next time. |
| `ailab.consent.accept` | Descargar y probar | Download and try |
| `ailab.consent.cancel` | Ahora no | Not now |
| `ailab.clear` | Borrar lo que el laboratorio guardó | Clear what the lab saved |
| `ailab.noscript` | Esta demo necesita JavaScript. Aquí tienes cómo funciona y su código. | This demo needs JavaScript. Here's how it works and its code. |
| `ailab.v1.title` | Transcriptor | Transcriber |
| `ailab.v1.summary` | Graba o sube un audio y obtén el texto con marcas de tiempo. Usa el mismo tipo de motor del dictador de voz que me hice para escribir en español con términos técnicos en inglés. | Record or upload audio and get the text with timestamps. It uses the same kind of engine as the voice dictation tool I built to write in Spanish with English tech terms. |
| `ailab.v4.title` | Navega hablando | Navigate by voice |
| `ailab.v4.summary` | Dile al sitio a dónde quieres ir: "llévame al blog", "cambia a tema claro". | Tell the site where to go: "take me to the blog", "switch to light theme". |
| `ailab.r1.title` | Simulador de sagas | Saga simulator |
| `ailab.r1.summary` | Reserva un viaje y tumba un servicio en mitad del cobro. Mira cómo el sistema deshace lo que ya estaba hecho, y por qué deshacer una reserva no es lo mismo que soltar un apartado. | Book a trip and take down a service in the middle of the payment. Watch the system undo what was already done, and why undoing a booking isn't the same as releasing a hold. |
| `ailab.a2.title` | Anatomía de un plugin | Anatomy of a plugin |
| `ailab.a2.summary` | Así se arma un plugin de Claude Code: skills, comandos, hooks y servidores MCP. Toca cada archivo para ver para qué sirve, y crea el tuyo al final. | This is how a Claude Code plugin is built: skills, commands, hooks and MCP servers. Tap each file to see what it's for, and build your own at the end. |
| `ailab.j1.title` | Peloteo contra la IA | Rally against the AI |
| `ailab.j1.summary` | Juega contra un rival que empieza torpe y aprende en vivo, partida a partida. Mira su cerebro encenderse con cada decisión. | Play against a rival that starts clumsy and learns live, game after game. Watch its brain light up with every decision. |
| `ailab.j2.title` | Juega contra tu clon | Play against your clone |
| `ailab.j2.summary` | Después de unos rallies, el rival aprende tu estilo. Juega contra una IA que se mueve como tú. | After a few rallies, the rival learns your style. Play against an AI that moves like you. |

La línea de privacidad de `ailab.privacy` ajusta la del handoff ("se procesan y se descartan") al camino A, donde nada
llega a un servidor. El copy de A5, A4, V2 y V3 se escribe en el plan con el mismo tono, sin datos nuevos.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-3a | ¿Camino A, B o mixto? | Solo A. HC-1 no se construye |
| P-3b | ¿Se aprueba el servidor MCP del portafolio (A1)? **[confirmar]** | No se construye (HC-2) |
| P-3c | ¿"Anatomía de un plugin" muestra el plugin para abogados del autor o uno de ejemplo neutral? | Ejemplo neutral |
| P-3d | ¿El CDN de Synergos es público para R2? **[confirmar]** | No se construye (HC-4) |
| P-3e | ¿Se puede nombrar el dictador de voz del autor? ¿Tiene repo público? | Sin nombre ni enlace |
| P-3f | ¿Qué sesión de agentes usa A10, y quién la limpia? **[confirmar]** | No se construye (HC-5) |
| P-3g | ¿El laboratorio es el proyecto con el que el autor aprende RAG, Semantic Kernel y Azure AI Foundry? | A5 se hace con BM25 y embeddings; "Aprendiendo ahora" no cambia |
| P-3h | ¿El AI Lab entra al menú principal, entre Portafolio y Blog? | Sin entrada en el menú; se llega por la paleta y el footer |
| P-3i | ¿La vitrina A13 ejecuta las herramientas o solo las lista? | No se construye en esta spec (HC-6) |
| P-3j | ¿J3 va, reutilizando MongoDB y con validación en el servidor? | No se construye (HC-3) |
| P-3k | ¿Se aprueba la dependencia `@huggingface/transformers` para V1, V4 y la búsqueda por significado de A5? Justificación en el plan | **Resuelta (2026-11-04):** el autor la aprobó. Va con versión exacta y solo dentro de los workers |
