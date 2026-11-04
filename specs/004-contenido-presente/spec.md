# Feature Specification: Contenido presente de CHERCED-WORLD

**Feature Branch**: `004-contenido-presente` (sobre lo integrado en `002-refinamiento-impoluto`)

**Created**: 2026-11-04

**Status**: Draft

**Input**: handoff del autor del 2026-11-04 (privado, fuera del repo): auditoría del sitio, contenido sacado de
sus proyectos, auditoría de interacciones y fuente de verdad del perfil (lo mismo que dicen hoy su CV y su
LinkedIn). Más las decisiones del autor de esta sesión. El copy exacto en ES y EN está en
[contenido.md](./contenido.md).

## Principio rector

El sitio tiene que decir quién es el autor **hoy**, con los mismos datos de su CV y su LinkedIn, y demostrar
criterio de arquitecto con evidencia. Es contenido y detalles nuevos sobre el sistema de diseño de la 001 y la
002, no un rediseño. Sigue vigente la constitución 2.0.1:

- Sin infraestructura, servicios, proveedores ni variables de entorno nuevas en Vercel (VIII).
- Español e inglés con paridad, y contenido como datos tipados (IV).
- Presupuestos de rendimiento y accesibilidad (V).
- Toda funcionalidad nueva es aditiva y vive en el lenguaje visual existente (I).

### Reglas de contenido

- **Cero invención.** Cada dato sale del handoff del autor o de los archivos del repo. Lo que el autor no ha
  confirmado no se publica: queda en [Preguntas abiertas](#preguntas-abiertas).
- **Confidencialidad (el repo es público).**
  - Ninguna cifra del empleador actual, ni en el sitio ni en esta spec.
  - Ningún nombre interno de sistemas, repos, proveedores ni leyes del empleador.
  - Nada del material de clientes.
  - Ningún dato personal fuera del contacto público: correo, LinkedIn, GitHub, el sitio y "Armenia, Colombia ·
    abierto a relocation". Nunca teléfono, dirección, documento ni salario.
- **Precedencia.** La constitución y las specs existentes mandan sobre las decisiones del autor; estas, sobre la
  fuente de verdad del perfil, y esta, sobre el resto del handoff.

## Relación con la 002

### Lo que esta spec no repite

| Ya cubierto | Dónde |
|---|---|
| Azure AI Foundry, Semantic Kernel y RAG pasan a "Aprendiendo ahora": salen de las barras y del chat | 002, T225 (enmienda E-03 con `skills.learningNow?`) |
| Índice fijo que tapa títulos, huecos en Carrera, texto justificado, títulos de lóbulos duplicados para lectores de pantalla, íconos servidos a 3840 px y contraste de etiquetas grises | 002, T225 |
| El buzón del header lleva a Contacto; el panel queda solo por URL directa | 002, US7 |
| Transiciones entre páginas con View Transitions | 002, T206 |
| Tiempo de lectura, índice, barra de progreso, código con botón de copiar, anterior y siguiente, compartir y comentarios | 002, R4. El resto del blog va en la [005](../005-blog/spec.md) |
| Fondo animado y su calma con movimiento reducido | D1: sin cambios. Ya existe en `components/motion/Background.tsx` |

### Lo que esta spec reemplaza (después de integrar la 002)

- **002 US6, cifras destacadas.** Cambia el conjunto de cifras (FR-436).
- **002 US6c, "no se agregan skills y no cambia ningún nivel".** La 004 reorganiza los lóbulos (US5), con los
  niveles nuevos sujetos a confirmación (P-401).
- **002 FR-210, "los 12 casos de estudio".** Pasan a ser 15 (FR-446).

## Clarifications

### Session 2026-11-04 (decisiones del autor)

- Q: ¿Se toca el fondo animado? → A: no (D1). Nada que especificar.
- Q: ¿Qué detalles de coquetería de la auditoría se hacen? → A: todos (D2):
  - el guiño del hero;
  - las tarjetas ADR en los casos de estudio;
  - los comandos nuevos del terminal `~/camilo/brain`;
  - el easter egg del footer;
  - el chip de disponibilidad;
  - copiar el correo con un toast;
  - las View Transitions del carrusel al caso;
  - el diagrama vivo de Synergos;
  - la página `/now`, cuyo contenido sigue pendiente (P-404).
  
  Tiempo de lectura, índice y progreso de los posts ya están en la 002.
- Q: ¿Qué críticas de UX, accesibilidad y contenido se aplican? → A: todas, salvo D1 (D3).
- Q: ¿Qué CV se ofrece? → A: el PDF oficial de 2 páginas, como "Descargar CV" (D5). Ver P-406.
- Q: ¿Se publican cifras del empleador actual? → A: no, en ningún lado. Solo la arquitectura, sin nombres internos.
- Q: ¿Las cifras de Synergos van con "más de" o se vuelven a medir? → A: con "más de" (2.300+, 130+), salvo que se
  vuelvan a medir.
- Q: ¿Qué casos nuevos se publican? → A: tres:
  - "Director & lines", como caso aparte y no como sección de Synergos.
  - "Legal workspace", anonimizado: sin nombres, sin ciudad y sin nada del material de la clienta.
  - "Event bridge: AWS → Azure", anonimizado: sin empleador y sin cifras.
- Q: ¿Hero nuevo directo o con el guiño del tachado? → A: con el guiño.
- Q: ¿Easter egg "Uncle Bob's nephew" en el footer? → A: sí.
- Q: ¿Se quita el ícono del buzón del header? → A: no. Se queda y lleva a Contacto (002, US7).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lo primero que se lee dice quién soy hoy (Priority: P1)

Un reclutador o un CTO llega desde Google, LinkedIn o un enlace compartido. El título, el subtítulo, la
descripción que muestran los buscadores, la intro del portafolio y los servicios dicen lo mismo que el CV: un
Software Solutions Engineer · AI-First que diseña sistemas composables y distribuidos. Ningún texto vigente dice
"front-end developer que busca aprender backend".

**Why this priority**: hoy el hero, la meta description, la intro del portafolio y los servicios cuentan la
historia de 2023 y contradicen el resto del sitio. Es lo primero que ve quien contrata.

**Independent Test**: recorrer home, Servicios y Portafolio en ES y EN, y revisar el HTML servido sin JS de cada
página pública.

**Acceptance Scenarios**:

1. **Given** el home, **When** carga, **Then** el `h1` dice "DISEÑO SISTEMAS QUE ESCALAN" / "I DESIGN SYSTEMS THAT
   SCALE"; arriba se ve "SOY DESARROLLADOR" / "I'M A DEVELOPER" tachado (US7) y debajo, el subtítulo.
2. **Given** cualquier página pública, **When** se leen su `<meta name="description">` y su `og:description`,
   **Then** ninguna presenta al autor como "front-end" o "full-stack developer", y la del home es la de
   contenido.md §1.
3. **Given** el Portafolio, **When** carga, **Then** la intro es un solo párrafo que explica que los proyectos de
   2022 y 2023 vienen de bootcamps y que los recientes muestran cómo trabaja hoy.
4. **Given** Servicios, **When** carga, **Then** hay tres tarjetas: Arquitectura, Desarrollo y Modernización.

---

### User Story 2 - El CV a un clic (Priority: P1)

Quien visita el sitio puede bajar el CV oficial desde el hero, desde "Sobre mí" y desde Contacto, o desde la
paleta de comandos.

**Why this priority**: es lo primero que busca un reclutador, y hoy no hay forma de bajarlo.

**Independent Test**: activar cada botón en ES y EN y comprobar que el archivo descargado es el PDF oficial.

**Acceptance Scenarios**:

1. **Given** el hero, "Quién soy" o Contacto, **When** se activa "Descargar CV (PDF)", **Then** se descarga
   `Camilo_Hernandez_CV.pdf` sin salir de la página.
2. **Given** la versión en español, **When** se ve el botón, **Then** avisa que el CV está en inglés y muestra su
   peso.
3. **Given** la paleta, **When** se escribe `> cv` y se pulsa Enter, **Then** se descarga el mismo archivo.
4. **Given** el índice de búsqueda o el asistente, **When** se les pregunta algo, **Then** no responden con el
   contenido del PDF: solo ofrecen el enlace.

---

### User Story 3 - La carrera y la formación coinciden con el CV (Priority: P1)

Cada empleo, estudio y curso de "Sobre mí" coincide con la fuente de verdad del perfil: empresa, rol, fechas y
logros. La comparación con `content/site.ts` está en la tabla de verificación de contenido.md §7.8, y cada
diferencia es un requisito (FR-410 a FR-417).

**Why this priority**: si el sitio y el CV no dicen lo mismo, un reclutador desconfía de los dos.

**Independent Test**: una prueba unitaria compara cada entrada de `site.ts` con la tabla de verificación.

**Acceptance Scenarios**:

1. **Given** cada entrada de carrera y de educación, **When** se compara con la tabla de verificación, **Then**
   empresa, rol, fechas y descripción coinciden.
2. **Given** Growup IT, **When** se abre su tarjeta, **Then** describe el portal de pago de impuestos de una entidad
   pública y la mejora de unos 40 puntos en Lighthouse.
3. **Given** Synergos Labs en la carrera, **When** se lee, **Then** dice lo mismo que el caso de estudio de Synergos,
   con las mismas cifras y desde la misma fuente de datos.

---

### User Story 4 - Casos de estudio que muestran criterio (Priority: P1)

El portafolio abre con el trabajo de hoy: Synergos reescrito con su escala real y tarjetas de decisiones, y tres
casos nuevos (Director & lines, Legal workspace y Event bridge). Los proyectos de 2022–2023 se quedan, marcados por
época. El diagrama de Synergos cobra vida.

**Why this priority**: es la evidencia de lo que dicen el hero y el CV. Las tarjetas Decisión · Por qué ·
Trade-off muestran criterio de arquitecto, algo que casi ningún portafolio muestra.

**Independent Test**: abrir los 15 casos en ES y EN, auditar el texto de los tres casos nuevos con las reglas de
confidencialidad y recorrer el diagrama de Synergos con teclado, con movimiento reducido y sin JS.

**Acceptance Scenarios**:

1. **Given** el caso de Synergos, **When** se abre, **Then** contexto, rol, decisiones, resultado, tecnologías y
   resultados destacados son los de contenido.md §11, y "Decisiones clave" se ve como 4 tarjetas Decisión · Por qué ·
   Trade-off.
2. **Given** un caso sin tarjetas en sus datos, **When** se abre, **Then** "Decisiones clave" se ve como hoy, en prosa.
3. **Given** el Portafolio, **When** carga, **Then** hay 15 casos en el orden de contenido.md §4, y cada tarjeta lleva
   su etiqueta de época (2024–2026 o 2022–2023).
4. **Given** el filtro, **When** se elige una época, **Then** se muestran solo sus proyectos y se anuncia la cantidad,
   igual que con el filtro por tecnología. Los dos filtros se combinan.
5. **Given** los tres casos nuevos, **When** se auditan, **Then** no nombran al empleador, a clientes, ciudades de
   clientes ni sistemas internos, no traen cifras de negocio, y sus enlaces `live` y `github` son `null` hasta que el
   autor los confirme.
6. **Given** el diagrama de Synergos, **When** entra en pantalla, **Then** sus capas se iluminan en orden (CDN →
   Umbraco → micro-frontends); al pasar el puntero o al enfocar una capa con teclado, aparece una línea con su rol.
   Con movimiento reducido o sin JS, todo se ve encendido y las tres líneas se leen como texto.

---

### User Story 5 - Lo que sé, con evidencia (Priority: P2)

El mapa cerebral de "Lo que sé" refleja lo que el autor hace de verdad: Arquitectura deja de ser el lóbulo más
vacío. Cada lóbulo dice dónde se aplicó cada cosa, no solo dónde se estudió. Hay una fila de principios,
"Mis habilidades, en palabras" deja de mostrar el texto de 2023 y "En cifras" muestra cifras que pesan.

**Why this priority**: es el área donde el autor es más fuerte y la que hoy se ve más vacía. Depende de que el autor
confirme los niveles (P-401), así que va después de las P1.

**Independent Test**: activar cada lóbulo con teclado y revisar skills, "dónde lo apliqué", proyectos, párrafo y
cifras, con y sin JS.

**Acceptance Scenarios**:

1. **Given** el mapa, **When** se activa Arquitectura, **Then** muestra las skills de contenido.md §8 que el autor
   haya confirmado y una línea "dónde lo apliqué" con entradas de carrera y casos enlazados. La fila "dónde lo
   aprendí" se queda como está.
2. **Given** cualquier lóbulo, **When** se activa, **Then** su línea de proyectos nunca dice "ninguno todavía".
3. **Given** Arquitectura, **When** se ve, **Then** debajo de las barras hay una fila de principios en chips, sin
   porcentaje.
4. **Given** "Mis habilidades, en palabras", **When** se selecciona un lóbulo, **Then** muestra el párrafo de ese
   lóbulo. Sin JS se ven los cinco párrafos.
5. **Given** "En cifras", **When** entra en pantalla, **Then** muestra las cuatro cifras de contenido.md §10 y
   ninguna del empleador actual.
6. **Given** una skill nueva cuyo nivel el autor no ha confirmado, **When** se publica la 004, **Then** esa skill no
   aparece.

---

### User Story 6 - Encontrar cualquier cosa desde el teclado (Priority: P2)

La paleta ya busca páginas, proyectos y posts, y abre con Ctrl/⌘+K. Ahora también busca habilidades, tiene un modo
de comandos que empieza con `>` y hay atajos globales de una tecla, que se pueden apagar.

**Why this priority**: quien llega buscando "saga" o "Angular" debe encontrar la evidencia en dos teclas.

**Independent Test**: pruebas e2e de la paleta y de los atajos, con el foco dentro y fuera de campos de texto.

**Acceptance Scenarios**:

1. **Given** la paleta, **When** se escribe "saga", "Angular" o "Synergos", **Then** aparecen habilidades y
   proyectos, y al elegir una habilidad se abre "Lo que sé" con su lóbulo activo.
2. **Given** la paleta, **When** se escribe `>`, **Then** solo se listan comandos: descargar el CV, copiar el correo,
   cambiar el tema, cambiar el idioma, preguntarle al portafolio y ver los atajos. Los comandos de otras specs
   ("abrir el AI Lab", "escuchar este post") aparecen solo cuando su función existe.
3. **Given** cualquier página, con el foco fuera de un campo de texto, **When** se pulsa `/`, **Then** se abre la
   paleta; `?` abre el diálogo de atajos y `t` cambia el tema. Ctrl/⌘+K sigue funcionando.
4. **Given** el foco en un `input`, un `textarea` o contenido editable, **When** se pulsan esas teclas, **Then** se
   escriben como siempre.
5. **Given** el diálogo de atajos, **When** se apagan los atajos de una tecla, **Then** `/`, `?` y `t` dejan de
   responder y la preferencia se recuerda (WCAG 2.1.4).

---

### User Story 7 - Detalles de coquetería (Priority: P2)

Los detalles que hacen que el sitio se recuerde: el guiño del hero, un terminal en el que se puede escribir, el
easter egg del footer, el chip de disponibilidad, copiar el correo con un toast y la imagen que vuela del
carrusel al caso de estudio.

**Why this priority**: el autor los pidió todos (D2). Dependen de que el contenido de las P1 esté en su lugar.

**Independent Test**: probar cada detalle en escritorio y móvil, con y sin movimiento reducido, con y sin JS, y
con teclado.

**Acceptance Scenarios**:

1. **Given** el home con movimiento normal, **When** carga por primera vez en la sesión, **Then** "SOY
   DESARROLLADOR" se tacha con una línea animada y debajo se escribe el título nuevo, en 2 s o menos y sin mover el
   layout. Con movimiento reducido, sin JS o en una segunda visita de la sesión, se ve directamente el estado final.
2. **Given** el terminal de "Lo que sé", **When** el visitante escribe `help`, `whoami`, `cat principles.md`,
   `ls projects/`, `ls synergos/` o `git log --oneline -1` y pulsa Enter, **Then** ve la salida de contenido.md §15
   en su idioma. Un comando desconocido responde con una sugerencia. `cat <lóbulo>.lobe` sigue funcionando.
3. **Given** un comando a medio escribir que coincide con uno conocido, **When** se pulsa Tab, **Then** se completa.
   Con la entrada vacía o sin coincidencia, Tab mueve el foco como siempre: no hay trampa de teclado.
4. **Given** el footer, **When** se lee, **Then** aparece, discreta, la frase "Officially Uncle Bob's nephew · SOLID
   runs in the family."
5. **Given** el hero y Contacto, **When** se ven, **Then** muestran el chip "Armenia, Colombia · UTC−5 · Abierto a
   reubicación" con un punto verde que late suave. Con movimiento reducido, el punto queda fijo.
6. **Given** el ícono de correo (home, footer o Contacto), **When** se activa, **Then** ofrece "Escribirme un correo"
   (`mailto:`) y "Copiar correo"; al copiar aparece el toast "Correo copiado ✓". Sin JS, el ícono sigue siendo el
   `mailto:` de hoy.
7. **Given** una tarjeta del carrusel, **When** se abre su caso de estudio, **Then** su imagen viaja a su lugar en el
   caso con una transición de elemento compartido. Sin soporte del navegador o con movimiento reducido, la
   navegación es la normal.

---

### User Story 8 - Compartir y ser encontrado (Priority: P2)

Al compartir cualquier sección en LinkedIn se ve una imagen propia de esa sección, y los buscadores entienden quién
es el autor gracias a los datos estructurados.

**Why this priority**: hoy todas las páginas comparten el retrato y no hay datos estructurados.

**Independent Test**: validar el JSON-LD con un validador de datos estructurados y revisar el `og:image` de cada
sección y de cada caso en ambos idiomas.

**Acceptance Scenarios**:

1. **Given** el home, **When** se analiza con un validador de datos estructurados, **Then** hay un `Person` válido
   con nombre, cargo, URL, `sameAs` (LinkedIn y GitHub) y ubicación pública, sin correo ni teléfono.
2. **Given** cada sección (home, Sobre mí, Servicios, Portafolio y Contacto) en cada idioma, **When** se comparte,
   **Then** su `og:image` es una imagen propia de esa sección, no el retrato.
3. **Given** un caso de estudio, **When** se comparte, **Then** su `og:image` muestra el título y el resumen del caso.

---

### User Story 9 - Contacto que responde y un primer paso antes del comentario (Priority: P3)

El formulario de contacto dice cuándo llega la respuesta, el checkbox de privacidad se anuncia completo y los posts
tienen reacciones de un clic para quien todavía no se anima a comentar.

**Why this priority**: son mejoras pequeñas. La del checkbox es una corrección de accesibilidad de severidad baja.

**Independent Test**: enviar los dos formularios con lector de pantalla, y reaccionar en un post en dos navegadores.

**Acceptance Scenarios**:

1. **Given** el formulario de contacto enviado, **When** se confirma el envío, **Then** dice "Gracias por escribirme.
   Te respondo en menos de 48 horas."
2. **Given** el checkbox de privacidad de Contacto y el de comentarios, **When** un lector de pantalla lo anuncia,
   **Then** su nombre incluye la frase completa, con "política de privacidad", y el enlace a la política sigue
   disponible.
3. **Given** un post, **When** el visitante pulsa una reacción (👏 💡 🔥), **Then** el contador sube en uno y su
   reacción queda marcada. Un segundo clic la quita.
4. **Given** muchas reacciones seguidas desde la misma IP, **When** pasan el límite, **Then** el contador deja de subir
   y el visitante ve un aviso amable.
5. **Given** la respuesta pública de reacciones, **When** se audita, **Then** solo trae contadores por tipo.

---

### User Story 10 - Página /now (Priority: P3, sujeta a P-404)

Una página `/now` cuenta qué construye, qué aprende y qué prepara el autor este mes, y se actualiza en dos minutos.

**Why this priority**: hace que el sitio se sienta vivo, pero su contenido depende del autor.

**Independent Test**: abrir `/es/now` y `/en/now` con contenido de prueba y sin él.

**Acceptance Scenarios**:

1. **Given** `/es/now` o `/en/now` con contenido, **When** se abre, **Then** muestra las tres listas y la fecha de
   actualización.
2. **Given** que el autor no ha dado el contenido, **When** se integra la 004, **Then** la ruta no se publica ni se
   enlaza.

---

### Edge Cases

- Falta el PDF del CV o su peso no coincide con el que dice el botón: una prueba hace fallar el build.
- El navegador niega el portapapeles o no tiene la Clipboard API: el toast de error muestra el correo para copiarlo
  a mano (reusa `palette.copyFailed`).
- El navegador no soporta View Transitions: la navegación funciona igual, sin la transición.
- En el terminal se pega un texto muy largo o con HTML: la entrada se corta a 80 caracteres y la salida se escapa.
- La base no responde al pedir las reacciones: los botones se deshabilitan con un aviso y el post se lee completo.
- Atajos de una tecla durante una composición de teclado (IME) o con modificadores: se ignoran.
- `>` en la paleta sin comandos que coincidan: "Sin resultados para «…»".
- Un lóbulo referencia una skill, una entrada de carrera o un proyecto que no existe: la prueba de contenido falla.
- El filtro de época combinado con el de tecnología da cero proyectos: se anuncia "0 proyectos" y se ofrece limpiar
  los filtros.
- El título nuevo del hero a 320 px: parte por palabras sin desbordar (002, SC-202).
- El visitante activa "reducir movimiento" en mitad del guiño: salta al estado final.
- `/now` sin publicar: responde 404, como cualquier ruta desconocida.

## Requirements *(mandatory)*

### Functional Requirements

#### Identidad y textos

- **FR-401**: El `h1` del home MUST ser el título nuevo de contenido.md §1. La frase de 2023 MUST seguir visible, tachada,
  como título anterior, y MUST NOT ser parte del nombre accesible del `h1`. El HTML del servidor MUST traer el estado
  final. Esto cumple 002 US4 y el principio I: el contenido de 2023 se conserva.
- **FR-402**: El hero MUST mostrar el subtítulo de contenido.md §1.
- **FR-403**: Las meta descriptions de home (y la global), Sobre mí, Servicios, Portafolio y Contacto MUST ser las de
  contenido.md §1, en ES y EN.
- **FR-404**: La intro del Portafolio MUST ser el párrafo único de contenido.md §4.
- **FR-405**: El Portafolio MUST seguir el orden de contenido.md §4. Cada proyecto MUST tener una época (`2024–2026` o
  `2022–2023`), visible en la tarjeta y en el caso, y filtrable junto con la tecnología.
- **FR-406**: Servicios MUST tener las tres tarjetas de contenido.md §5 (`architecture`, `development`, `modernization`),
  con íconos del mismo estilo que los actuales.
- **FR-407**: La descripción de "Quién soy" MUST ser la de contenido.md §6.
- **FR-408**: El texto de habilidades de 2023 (`skills.description` y `skills.bullets`) MUST salir de "Mis habilidades, en
  palabras". Lo reemplazan los párrafos por lóbulo (FR-434). El texto de 2023 sigue en la cápsula del tiempo.

#### Carrera y formación (cada diferencia con la fuente de verdad)

- **FR-410**: Growup IT MUST tener el rol "Frontend Web Developer" (hoy "Frontend Developer" / "Desarrollador Frontend") y
  la descripción de contenido.md §7.1 (hoy dice "el sitio de una empresa de servicios comerciales").
- **FR-411**: Newshore MUST tener el rol "Frontend Web Developer" (hoy "Frontend Developer" / "Desarrollador Frontend").
- **FR-412**: Platzi Master MUST tener la empresa "Platzi" y el rol "Frontend Web Developer – Platzi Master [CX]" (hoy la
  empresa es "Platzi Master [CX]" y el rol, "Frontend Developer").
- **FR-413**: FLYR MUST mencionar el checkout PCI en Angular y el proyecto de redención de vouchers (contenido.md §7.4).
- **FR-414**: Synergos Labs MUST describir la escala actual de contenido.md §7.5 (hoy dice "más de 30 componentes,
  probados con más de 3 frameworks"), con las cifras de la fuente única de FR-441.
- **FR-415**: Squadra Arquitectura MUST describir la habilitación hospitalaria y la obra civil (hoy dice "arquitectura
  hospitalaria") y usar el rol oficial "Founder & Business Manager" también en ES (hoy "Fundador y gerente").
- **FR-416**: Los roles MUST mostrarse con su título oficial en inglés en ambos idiomas, como en el CV y en LinkedIn.
  Hoy FLYR y Sistecrédito ya lo hacen y el resto no.
- **FR-417**: Educación MUST incluir "140+ cursos certificados de desarrollo de software" de Platzi (contenido.md §7.7).
- **FR-418**: Las entradas que ya coinciden (tabla de contenido.md §7.8) MUST quedar fijadas por una prueba unitaria,
  para que no se desvíen.
- **FR-419**: La ubicación pública MUST aparecer en el sitio (chip de FR-463).

#### CV

- **FR-420**: El sitio MUST ofrecer "Descargar CV (PDF)" en el hero, en "Quién soy" y en Contacto. El archivo se copia del
  PDF oficial a `public/Camilo_Hernandez_CV.pdf` y se enlaza con `download`. La etiqueta MUST incluir "PDF" y el peso, y en
  ES, "en inglés". [NEEDS CLARIFICATION: P-406, qué versión del PDF se publica]
- **FR-421**: La paleta MUST tener el comando "Descargar mi CV".
- **FR-422**: El contenido del PDF MUST NOT entrar al índice de búsqueda ni al asistente.

#### Lo que sé

- **FR-430**: Los lóbulos MUST reorganizarse según contenido.md §8. Solo se publican los niveles que el autor confirme
  (P-401). Las skills de hoy que no están en la propuesta se quedan hasta que el autor decida (P-407).
- **FR-431**: Cada skill nueva MUST tener ícono, con la regla de la 002: marca con licencia libre copiada al repo, o
  pictograma propio de línea fina.
- **FR-432**: Cada lóbulo MUST mostrar "dónde lo apliqué" con referencias a entradas de carrera y a proyectos. Una prueba
  verifica que cada referencia exista. La fila "dónde lo aprendí" se queda.
- **FR-433**: Los principios de contenido.md §8.6 MUST vivir como datos y mostrarse como chips bajo Arquitectura y como
  salida de `cat principles.md`.
- **FR-434**: "Mis habilidades, en palabras" MUST mostrar un párrafo por lóbulo (contenido.md §9), sin cifras del empleador.
- **FR-435**: La línea de proyectos de un lóbulo MUST NOT decir "ninguno todavía". Un lóbulo puede declarar proyectos
  explícitos además del cruce por tecnología.
- **FR-436**: "En cifras" MUST mostrar las cuatro cifras de contenido.md §10: años (calculados como hoy), piezas de
  Synergos, ADRs y tests. Salen proyectos, tecnologías y aerolíneas.
- **FR-437**: "Aprendiendo ahora" se queda como lo deja la 002 (T225). La 004 no lo cambia.

#### Casos de estudio

- **FR-440**: El caso de Synergos (id `12`) MUST reescribirse con contenido.md §11: resumen, contexto, rol, decisiones,
  resultado, tecnologías y resultados destacados.
- **FR-441**: Las cifras de Synergos MUST vivir en una sola fuente de datos, con su fecha de conteo y de medición. El caso,
  la carrera, "En cifras" y el terminal las leen de ahí. Tests, ADRs y elementos del design system van con "más de";
  31 piezas, 20 capacidades y 9 orquestadores van exactos (conteo del 2026-11-01).
- **FR-442**: Un proyecto MUST poder declarar tarjetas ADR (`decision`, `why`, `tradeoff`, localizadas). "Decisiones clave"
  las muestra como lista de tarjetas Decisión · Por qué · Trade-off. Sin tarjetas, se ve la prosa de hoy. Synergos trae 4.
- **FR-443**: Se MUST publicar tres casos nuevos con el contenido de contenido.md §12 a §14: `13` Director & lines,
  `14` Legal workspace y `15` Event bridge. Sus imágenes son diagramas SVG propios, sin logos ni nombres internos, con
  texto alternativo en ES y EN.
- **FR-444**: Una prueba de confidencialidad MUST fallar si las descripciones de las entradas del empleador actual o el
  caso Event bridge contienen cantidades: números con `+`, `%`, `~` o `≈`, o números de dos cifras o más.
- **FR-445**: El diagrama de Synergos MUST ser interactivo según contenido.md §11.4: capas enfocables con teclado, una línea
  de rol por capa, iluminación en orden al entrar en pantalla, y estado estático y completo con movimiento reducido o
  sin JS.
- **FR-446**: Los 15 casos MUST entrar a las auditorías de la 002: responsive de 320 a 2560 px, interacción y contraste.
- **FR-447**: `links.live` y `links.github` de Synergos, Director & lines y Legal workspace MUST seguir en `null` hasta que
  el autor confirme (P-403, P-410). Event bridge no tiene enlaces.

#### Paleta y atajos

- **FR-450**: La paleta MUST indexar las habilidades en un grupo "Habilidades". Elegir una MUST llevar a "Lo que sé" con su
  lóbulo activo, por una URL que funcione sin JS y lleve a la lista del lóbulo.
- **FR-451**: La paleta MUST tener un modo de comandos que empieza con `>`, sobre un registro de comandos con etiquetas y
  palabras clave en ES y EN. Otras specs agregan comandos a ese registro.
- **FR-452**: Los atajos globales `/` (abrir la paleta), `?` (diálogo de atajos) y `t` (cambiar el tema) MUST ignorarse
  dentro de campos editables, con modificadores y durante una composición de teclado. El diálogo MUST permitir apagar los
  atajos de una tecla, y esa preferencia se guarda en el navegador.
- **FR-453**: Cada control con atajo MUST declararlo en `aria-keyshortcuts`.

#### Coquetería

- **FR-460**: El guiño del hero MUST durar 2 s o menos, correr una vez por sesión, no mover el layout y no retrasar el LCP.
- **FR-461**: El terminal de "Lo que sé" MUST aceptar texto:
  - Una entrada con etiqueta y una salida con `aria-live="polite"`.
  - Los comandos de contenido.md §15, sin distinguir mayúsculas.
  - `ls projects/` sale de `projects.ts`, en el orden del portafolio y con enlaces a cada caso.
  - `ls synergos/` sale de la fuente de FR-441.
  - `clear` limpia la salida y Esc limpia la entrada.
  - Tab completa sin atrapar el foco.
- **FR-462**: El footer MUST mostrar la frase de contenido.md §16, en inglés en ambos idiomas (`lang="en"`), como texto
  pequeño y sin enlace.
- **FR-463**: El chip de disponibilidad MUST salir de los datos del perfil y mostrarse en el hero y en Contacto. El punto no
  es la única señal: el texto dice lo mismo. Con movimiento reducido, el punto no late.
- **FR-464**: El ícono de correo MUST abrir un menú accesible con `mailto:` y "Copiar correo". Al copiar, se muestra el
  `Toast` existente. Sin JS, el ícono es un `mailto:`.
- **FR-465**: La imagen de la tarjeta del carrusel y la del caso MUST compartir una transición de elemento compartido, con
  el `<ViewTransition>` que ya usa la 002. Se desactiva con movimiento reducido y no empeora el INP.

#### Compartir y buscadores

- **FR-470**: El sitio MUST publicar un JSON-LD `Person` con los datos de contenido.md §22, con un `@id` estable que la 005
  reutiliza en `BlogPosting`. La URL base sale de la configuración que ya existe. Sin correo ni teléfono.
- **FR-471**: Cada sección y cada caso de estudio, en cada idioma, MUST tener su `og:image` generada con la convención
  `opengraph-image` de Next.js (incluida en el framework): 1200 × 630, blanco, negro y `#25ED9E`, Montserrat, textos de
  contenido.md §23 y texto alternativo. La 005 reutiliza la misma plantilla para los posts.
- **FR-472**: El sitemap MUST incluir los casos nuevos, y `/now` cuando se publique.

#### Contacto, privacidad y reacciones

- **FR-480**: La confirmación del formulario de contacto MUST decir el texto de contenido.md §19. El enlace de agenda solo
  se agrega si el autor lo pide (P-405).
- **FR-481**: El nombre accesible del checkbox de privacidad, en Contacto y en comentarios, MUST incluir la frase completa
  con "política de privacidad" / "privacy policy". El enlace a la política MUST seguir operable y avisar que abre una
  pestaña nueva.
- **FR-482**: Cada post MUST tener tres reacciones de un clic (👏 💡 🔥) en la sección de comentarios:
  - La respuesta pública trae solo contadores por tipo.
  - La entrada se valida en el servidor y se limita por frecuencia con la huella de IP que ya existe, sobre la base que
    ya existe.
  - No se guarda ningún dato personal.
  - La reacción propia se recuerda en el navegador como preferencia.
  - Los botones usan `aria-pressed` y funcionan con teclado.
- **FR-483**: La política de privacidad MUST mencionar las reacciones (contenido.md §21).

#### /now

- **FR-490**: `/[lang]/now` MUST leer de un archivo de contenido (qué construye, qué aprende, qué prepara y la fecha de
  actualización), y MUST NOT publicarse ni enlazarse hasta que el autor dé el contenido (P-404).

#### Transversales

- **FR-495**: Todo texto visible nuevo MUST existir en ES y EN. La prueba de completitud de contenido lo verifica.
- **FR-496**: Todo contenido nuevo MUST vivir como datos tipados en `content/`. Cada cambio de tipos se registra como
  enmienda (ver [Key Entities](#key-entities)).
- **FR-497**: MUST NOT agregarse dependencias, servicios ni variables de entorno. El guiño, las transiciones, las
  imágenes OG, el JSON-LD, el portapapeles y las reacciones se resuelven con la plataforma, React, Next.js y la base que
  ya existe.
- **FR-498**: El asistente y el índice de búsqueda MUST reflejar el contenido nuevo desde las mismas fuentes de datos, y
  MUST NOT responder con cifras del empleador ni con las skills de "Aprendiendo ahora" como si fueran skills en uso.
- **FR-499**: Los presupuestos del principio V MUST mantenerse en todas las páginas tocadas.

### Key Entities

Enmiendas de tipos propuestas (las numera y aplica la lane Foundation en el plan):

- **E-04 `Project`**:
  - `era: '2024-2026' | '2022-2023'`.
  - `adrCards?: { decision: Localized; why: Localized; tradeoff: Localized }[]`.
  - `diagram?: { id: string; label: Localized; role: Localized }[]`, las capas del diagrama vivo.
- **E-05 `ServiceId`**: pasa a `'architecture' | 'development' | 'modernization'`.
- **E-06 `SiteContent.home`**: suma `previousTitle: Localized` y `subtitle: Localized`.
- **E-07 Lo que sé**:
  - `SkillLobe.applied?: string[]`, con referencias `career:<id>` o `project:<id>`.
  - `SkillLobe.projects?: string[]`.
  - `about.skills.inWords?: Record<lobeId, Localized>`.
  - `about.principles?: { short: Localized; full: Localized }[]`.
- **E-08 `SiteContent.profile`**: `availability` (ubicación, zona horaria y reubicación) y `cv` (`href`, `bytes`, `lang`).
- **E-09 Cifras de Synergos**: una fuente única con `countedAt`, `measuredAt`, conteos exactos y pisos ("más de").
- **E-10 Comando de terminal**: nombre y salida localizada, o generada desde datos.
- **E-11 Reacción**: en la base que ya existe, un contador agregado por post y tipo (`clap`, `idea`, `fire`). Sin datos del
  visitante.
- **E-12 `/now`**: `updatedAt`, y listas localizadas `building`, `learning` y `preparing`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-401**: 0 meta descriptions y 0 textos vigentes que presenten al autor como "front-end" o "full-stack developer".
  Se exceptúan los posts de 2023, la cápsula y la frase tachada del hero.
- **SC-402**: El 100 % de las entradas de carrera y de educación coincide con la tabla de verificación (prueba unitaria).
- **SC-403**: El CV se descarga en 1 clic desde el hero, "Quién soy" y Contacto, y en 4 teclas o menos desde la paleta
  abierta.
- **SC-404**: "saga", "Angular" y "Synergos" devuelven en la paleta al menos una habilidad o un proyecto entre los 3
  primeros resultados.
- **SC-405**: Los 15 casos pasan la auditoría responsive de la 002 (320 a 2560 px) con 0 hallazgos y un puntaje de
  accesibilidad de 95 o más.
- **SC-406**: El home con el guiño mantiene LCP ≤ 2,5 s y CLS ≤ 0,1. La paleta y el terminal mantienen INP ≤ 200 ms.
- **SC-407**: La prueba de confidencialidad (FR-444) pasa, y una revisión del autor confirma 0 nombres internos y 0 datos
  de clientes en los tres casos nuevos.
- **SC-408**: El JSON-LD `Person` valida con 0 errores, y las 5 secciones y los 15 casos tienen `og:image` propia en ambos
  idiomas.
- **SC-409**: La auditoría automática de accesibilidad da un nombre accesible con "política de privacidad" / "privacy
  policy" para los dos checkboxes.
- **SC-410**: Una reacción cuesta 1 clic. 50 clics seguidos desde la misma IP no suben el contador más allá del límite, y
  la respuesta pública no trae datos personales.
- **SC-411**: Con los atajos de una tecla apagados, `/`, `?` y `t` no hacen nada en ninguna página.
- **SC-412**: La prueba de completitud ES/EN pasa para todas las claves nuevas.

## Assumptions

- La 004 arranca cuando la 002 esté integrada, incluidos T225, US7, el carrusel de R2 y el mapa cerebral de R3.
- Las cifras de Synergos son las del handoff: conteo de piezas del 2026-11-01 y medición de tests, ADRs y elementos del
  2026-08-06. Van con "más de" salvo que el autor las vuelva a medir.
- La decisión de publicar "Legal workspace" incluye el visto bueno de la clienta. Ese acuerdo es responsabilidad del autor.
- El repo de CHERCED-WORLD es público, así que su enlace a GitHub se queda.
- El sitio escribe el nombre como "Camilo Hernandez", igual que hoy en `brand.author` y en el autor de los posts.
- El diagrama vivo usa las capas del diagrama actual de Synergos (CDN → Umbraco → micro-frontends). Para iluminar las
  capas se dibuja en línea. El SVG estático se queda para el carrusel y la imagen OG.
- Los diagramas de los tres casos nuevos se dibujan en SVG, sin logos.
- No hay fechas por proyecto en los datos. Por eso los proyectos de 2022–2023 conservan su orden relativo de hoy, y la
  época se etiqueta por años y no como "Bootcamp": no todos los proyectos de esa época fueron de bootcamp.
- La frase del footer se queda en inglés en ambos idiomas para que LinkedIn y el sitio cuenten la misma historia.
  contenido.md §16 trae una traducción por si el autor prefiere otra cosa.
- Fuera de alcance: cambiar el fondo animado (D1), cambiar el CV o el LinkedIn del autor, y nombrar al empleador en los
  casos.

## Preguntas abiertas

Las preguntas abiertas del handoff de las que depende esta spec, más las que salieron al comparar el sitio con la
fuente de verdad. Mientras sigan abiertas, se aplica el valor por defecto indicado.

| ID | Pregunta | Origen | Por defecto |
|---|---|---|---|
| P-401 | ¿Se aprueban los niveles propuestos para los lóbulos (contenido.md §8)? | Handoff, pregunta 4 | Las skills nuevas no se publican. Las existentes conservan su nivel |
| P-402 | ¿El sitio dice "desde 2019" (Growup IT, ene 2019) o "desde 2020"? Además, "En cifras" calcula 7+ años desde 2019, pero el CV dice "6 años de experiencia" | Handoff, pregunta 5, y CV | Se queda "desde 2019", calculado desde la carrera |
| P-403 | ¿Qué repos son públicos? CHERCED-WORLD sí. ¿Synergos y legal-workspace? | Handoff, pregunta 10 | `github: null` en ambos |
| P-404 | ¿Página `/now`? ¿Qué muestra este mes? | Handoff, pregunta 13 | No se publica |
| P-405 | ¿Enlace para agendar una llamada después del formulario de contacto? | Handoff, pregunta 16 | Sin enlace |
| P-406 | El PDF oficial del CV trae cifras del empleador actual y nombres de proveedores, y enlaza a una cuenta de GitHub distinta de la pública. ¿Se publica tal cual (ya está en LinkedIn), se publica una versión para el sitio sin esas cifras ni nombres, o el botón lleva a LinkedIn? | Comparación del CV con la decisión "ninguna cifra del empleador" | El botón no se publica hasta que el autor decida |
| P-407 | Hoy hay skills que no están en la propuesta: HTML5, JavaScript y AI coding agents, y CSS y Sass, que la propuesta junta en una sola. ¿Se quedan, se fusionan o salen? | Comparación de `site.ts` con la propuesta | Se quedan como están |
| P-408 | Solo Synergos trae tarjetas ADR. ¿Escribe el autor las de Director & lines, Legal workspace, Event bridge y CHERCED-WORLD 2026? | Handoff | Esos casos quedan en prosa |
| P-409 | El sitio enlaza a Instagram, pero la fuente de verdad no lo lista como contacto público. ¿Se queda? | Fuente de verdad del perfil | Se queda, como hoy |
| P-410 | ¿Enlace en vivo de Synergos cuando su dominio esté en producción? | Handoff | `live: null` |

## Dependencias

- **002**: debe estar integrada (ver Assumptions).
- **003**: agrega "Abrir el AI Lab" a la paleta y `ask` al terminal cuando existan.
- **005**: reutiliza la plantilla OG y el `@id` del `Person`, y agrega "Escuchar este post" a la paleta.
