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
- **002 US6c, "no se agregan skills y no cambia ningún nivel".** Ya no lo reemplaza la 004: lo hace la propia 002 en
  T229 (D7 y D9, seis lóbulos). La 004 solo suma lo que T229 no cubra (US5).
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
- Q: ¿Qué CV se ofrece? → A (2026-11-04, resuelve P-406): el sitio no publica el PDF. El PDF oficial trae
  cifras del empleador y nombres de proveedores, así que el botón lleva al perfil de LinkedIn, donde el CV ya
  está publicado en Destacados.
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
- Q: ¿Qué pasa con Servicios? → A: se rehace (D10). Reemplaza lo que proponía la auditoría original (US1b).
- Q: ¿Sitio listo para agentes con WebMCP? → A: el autor aprobó la dirección. Va como US11, con la vitrina en el AI Lab.

### Session 2026-11-04 (segunda ronda de aclaraciones)

- Q: ¿Desde cuándo cuentan los años de experiencia? (P-402) → A: desde 2019 (Growup IT). "En cifras" lo calcula
  solo: hoy da 7+. El autor alinea el CV por su cuenta.
- Q: ¿Qué repos son públicos? (P-403) → A: además de CHERCED-WORLD, los de Synergos y legal-workspace. Verificado en
  GitHub el 2026-11-04: `Synergos.CMS`, `Synergos.UI` y `Synergos.Fabrica` son públicos (Synergos no tiene un repo
  único), y `legal-workspace` también. Los casos enlazan a esos repos.
  - [NEEDS CLARIFICATION: P-420] `legal-workspace` publica casos de evaluación en `evals/casos/`. Algunos dicen
    "sintético" en el nombre y otros no. Antes de enlazar el repo desde el portafolio, el autor confirma que todos
    son sintéticos y que ninguno sale del material de la clienta.
- Q: ¿Ejemplos de la abogada y del ingeniero estructural en Servicios? (P-411) → A: sí, sin nombres ni ciudad.
- Q: ¿Talleres para equipos? (P-414) → A: sí, como sexto servicio: entrenamiento en AI-first y Spec-Driven Development.
- Q: ¿Precios en Servicios? (P-415) → A: sí, rangos orientativos.
  - [NEEDS CLARIFICATION: P-421] Las cifras las pasa el autor. Sin ellas no se publica ningún rango.
- Q: ¿Enlace para agendar después del formulario de contacto? (P-405) → A: sí.
  - [NEEDS CLARIFICATION: P-422] El enlace de agenda lo pasa el autor. Sin él no se muestra.
- Q: ¿Página `/now`? (P-404) → A: sí. Su contenido, en contenido.md §24, sale de lo que el autor contó y de su
  perfil:
  - Construyendo: Synergos rumbo a producción, el AI Lab de este sitio y la orquestación de agentes en paralelo.
  - Aprendiendo: Azure AI Foundry, Semantic Kernel y RAG.
  - Entrenando: se prepara para HYROX São Paulo; además CrossFit, trail, running y subir nevados.
  - Fuera del teclado: los videojuegos. Su frase: "el mejor videojuego es mi vida".
  - La fecha de la carrera no se publica hasta que el autor la confirme.
- Q: ¿Lemas del autor? → A: "Siembra bondad, cosecha excelencia" y "Veni, vidi, vici", tomados de su perfil público. Van
  en `/now` y en el comando `cat lemas.md` de la terminal. Del mismo perfil: medallas de 21K y 10K, CrossFit y HYROX
  (contenido.md §15b y §24).
- Q: ¿Se queda el enlace a Instagram? (P-409) → A: sí. Su perfil público enlaza al portafolio.

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

1. **Given** el home, **When** carga, **Then** el `h1` dice "DISEÑO SISTEMAS DE SOFTWARE QUE ESCALAN" / "I DESIGN
   SOFTWARE SYSTEMS THAT SCALE"; arriba se ve "SOY DESARROLLADOR" / "I'M A DEVELOPER" tachado (US7) y debajo, el
   subtítulo. Decisión del autor (2026-11-05): el título dice "de software" para que no se lea como diseño UX/UI.
2. **Given** cualquier página pública, **When** se leen su `<meta name="description">` y su `og:description`,
   **Then** ninguna presenta al autor como "front-end" o "full-stack developer", y la del home es la de
   contenido.md §1.
3. **Given** el Portafolio, **When** carga, **Then** la intro es un solo párrafo que explica que los proyectos de
   2022 y 2023 vienen de bootcamps y que los recientes muestran cómo trabaja hoy.
4. **Given** Servicios, **When** carga, **Then** cumple US1b.

---

### User Story 1b - Servicios: me meto en tu proceso (Priority: P1)

Decisión D10 del autor: la página de Servicios se rehace. Hoy ofrece "hacer un sitio web" (Diseño, Desarrollo y
Mantenimiento), la oferta de un freelance de 2023. La página nueva explica que el autor entra en el proceso
profesional del cliente para mejorarlo de tres maneras:

- con un harness de IA hecho para su profesión;
- con fábricas de software enfocadas en el core de su negocio, con las skills que el cliente prefiera;
- optimizando los procesos que el cliente repite.

Dice para quién es cada servicio, qué recibe el cliente, cómo trabaja el autor y qué dudas suele haber. El copy está
en contenido.md §5.

**Why this priority**: es la página que convierte una visita en un cliente, y hoy no dice nada de lo que el autor
hace y vende.

**Independent Test**: recorrer `/es/services` y `/en/services` con y sin JS, con teclado y con movimiento reducido.
Luego pulsar "Quiero esto" en cada tarjeta y comprobar el formulario de Contacto.

**Acceptance Scenarios**:

1. **Given** Servicios, **When** carga, **Then** se ven en orden siete bloques: hero, para quién, servicios, cómo
   trabajo, casos, preguntas frecuentes y CTA final.
   - El `h1` dice "TU OFICIO, CON UN EQUIPO DE AGENTES A LA MEDIDA" / "YOUR CRAFT, WITH A TAILOR-MADE TEAM OF AGENTS".
   - El botón del hero dice "Cuéntame tu proceso" y lleva al formulario.
2. **Given** "Para quién", **When** se lee, **Then** hay tres perfiles: profesionales independientes, empresas y
   equipos de ingeniería.
3. **Given** los servicios, **When** se ven, **Then** hay seis tarjetas numeradas del 01 al 06 (P-414 resuelta):
   - asistentes de IA para tu profesión;
   - fábricas de software a la medida;
   - optimización de procesos con IA;
   - arquitectura y modernización;
   - desarrollo de producto;
   - talleres para equipos.

   Cada una dice qué es, para quién y qué recibes. Ícono, número y título quedan siempre a la misma altura.
4. **Given** una tarjeta, **When** se pasa el puntero, se toca o se pulsa Enter, **Then** muestra su reverso, "Qué
   recibes". Con movimiento reducido, cambia sin girar. Sin JS, las dos caras se leen completas, una debajo de la otra.
5. **Given** "Cómo trabajo", **When** entra en pantalla, **Then** los cinco pasos se iluminan uno tras otro en
   `#25ED9E`, y debajo se leen los principios. Con movimiento reducido o sin JS, se ven todos encendidos.
6. **Given** el botón "Quiero esto" de una tarjeta, **When** se activa, **Then** se abre Contacto con "¿Qué te
   interesa?" preseleccionado en ese servicio. Funciona sin JS.
7. **Given** las preguntas frecuentes, **When** se abren, **Then** cada una es un disclosure accesible. Una pregunta
   cuya respuesta sigue sin confirmar (P-412) no se publica.
8. **Given** la tarjeta "Asistentes de IA para tu profesión", **When** existe la vitrina "Despacho" del AI Lab (003,
   A4), **Then** la tarjeta ofrece "Probar" y lleva a esa vitrina. Si no existe, el botón no aparece.

---

### User Story 2 - El CV a un clic (Priority: P1)

Quien visita el sitio llega al CV oficial desde el hero, desde "Sobre mí" y desde Contacto, o desde la paleta de
comandos. El CV está en el perfil de LinkedIn del autor, en Destacados. El sitio no sirve el PDF (P-406, resuelta).

**Why this priority**: es lo primero que busca un reclutador, y hoy el sitio no lo ofrece.

**Independent Test**: activar cada enlace en ES y EN y comprobar que abre el perfil de LinkedIn en una pestaña nueva.

**Acceptance Scenarios**:

1. **Given** el hero, "Quién soy" o Contacto, **When** se activa "Ver mi CV en LinkedIn", **Then** se abre el perfil
   público de LinkedIn en una pestaña nueva.
2. **Given** un lector de pantalla, **When** enfoca el enlace, **Then** anuncia que abre LinkedIn en una pestaña nueva.
3. **Given** la paleta, **When** se escribe `> cv` y se pulsa Enter, **Then** se abre el mismo enlace.
4. **Given** el índice de búsqueda o el asistente, **When** se les pregunta por el CV, **Then** solo ofrecen el enlace.

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

1. **Given** el mapa, **When** se activa Arquitectura, **Then** muestra las skills y las fuentes que deja T229 (002),
   que reemplazan a contenido.md §8, y la línea "dónde lo apliqué" con entradas de carrera y casos.
2. **Given** cualquier lóbulo, **When** se activa, **Then** su línea de proyectos nunca dice "ninguno todavía".
3. **Given** Arquitectura, **When** se ve, **Then** debajo de las barras hay una fila de principios en chips, sin
   porcentaje.
4. **Given** "Mis habilidades, en palabras", **When** se selecciona un lóbulo, **Then** muestra el párrafo de ese
   lóbulo. Sin JS se ven los cinco párrafos.
5. **Given** "En cifras", **When** entra en pantalla, **Then** muestra las cuatro cifras de contenido.md §10 y
   ninguna del empleador actual.
6. **Given** un lóbulo sin párrafo "en palabras" (Prácticas de ingeniería mientras siga abierta P-424), **When** se
   selecciona, **Then** no se muestra un bloque vacío.

---

### User Story 6 - Encontrar cualquier cosa desde el teclado (Priority: P2)

La paleta ya busca páginas, proyectos y posts, y abre con Ctrl/⌘+K. Ahora también busca habilidades, tiene un modo
de comandos que empieza con `>` y hay atajos globales de una tecla, que se pueden apagar.

**Why this priority**: quien llega buscando "saga" o "Angular" debe encontrar la evidencia en dos teclas.

**Independent Test**: pruebas e2e de la paleta y de los atajos, con el foco dentro y fuera de campos de texto.

**Acceptance Scenarios**:

1. **Given** la paleta, **When** se escribe "saga", "Angular" o "Synergos", **Then** aparecen habilidades y
   proyectos, y al elegir una habilidad se abre "Lo que sé" con su lóbulo activo.
2. **Given** la paleta, **When** se escribe `>`, **Then** solo se listan comandos: ver el CV en LinkedIn, copiar el correo,
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

### User Story 10 - Página /now (Priority: P3)

Una página `/now` cuenta qué construye el autor este mes, qué aprende, para qué entrena, qué hace fuera del teclado y
cuáles son sus lemas. Se actualiza en dos minutos. P-404 está resuelta, y el contenido está en contenido.md §24.

**Why this priority**: hace que el sitio se sienta vivo, pero no es lo primero que busca quien contrata.

**Independent Test**: abrir `/es/now` y `/en/now` con y sin JS, y con lector de pantalla.

**Acceptance Scenarios**:

1. **Given** `/es/now` o `/en/now`, **When** se abre, **Then** muestra "Construyendo", "Aprendiendo", "Entrenando
   para", "Fuera del teclado" y "Mis lemas", con la fecha de actualización.
2. **Given** el lema "Veni, vidi, vici", **When** lo anuncia un lector de pantalla, **Then** se lee en latín
   (`lang="la"`).
3. **Given** la página, **When** se audita, **Then** no publica la fecha de la carrera de HYROX.

---

### User Story 11 - Un sitio listo para agentes (Priority: P3)

Idea aprobada por el autor como dirección el 2026-11-04. Quien visita el sitio con un agente de IA en el navegador
recibe herramientas declaradas con WebMCP: buscar en el portafolio, leer un caso, la experiencia o las skills, listar
posts, abrir el CV, cambiar idioma o tema y preparar un mensaje de contacto. El agente ya no tiene que adivinar dónde
hacer clic. Las capacidades se definen una sola vez, y las usan la paleta, el asistente, WebMCP y `llms.txt`.

**Encaje y constitución**: es un cambio del sitio, así que va en la 004. La vitrina que lo muestra va al AI Lab
(catálogo 003, A13). Todo corre en el navegador, o es un archivo estático del build: no hay servidor, llave ni variable
nueva. Cabe en la constitución sin excepción. El servidor MCP remoto (003, A1) sigue aparte y en [confirmar].

**Why this priority**: WebMCP es un borrador experimental del W3C cuya API cambia de nombre, así que no bloquea nada.
El registro de capacidades, en cambio, también mejora la paleta y el asistente.

**Independent Test**:
- Unitarias de cada capacidad con su esquema.
- E2E con la API habilitada en Chromium. La versión de Playwright y el flag se verifican en el plan.
- En un navegador sin WebMCP, comprobar que no cambia nada.

**Acceptance Scenarios**:

1. **Given** un navegador con WebMCP, **When** la página está interactiva, **Then** quedan registradas las herramientas de
   FR-487, con nombre, descripción en el idioma activo y esquema de entrada.
2. **Given** `search_portfolio` con `{ "query": "sagas" }`, **When** el agente la ejecuta, **Then** recibe títulos,
   resúmenes y URLs desde la misma fuente que la paleta.
3. **Given** `draft_contact_message`, **When** el agente la ejecuta, **Then** el formulario de Contacto queda lleno. El
   mensaje no se envía, el checkbox de privacidad queda sin marcar y Enviar lo pulsa la persona.
4. **Given** un navegador sin WebMCP, **When** carga cualquier página, **Then** no se registra nada, no hay errores en
   consola y el rendimiento no cambia.
5. **Given** `/llms.txt`, **When** se pide, **Then** es un archivo estático generado en el build desde los mismos datos,
   con solo información pública y enlaces a ES y EN.

---

### Edge Cases

- Contacto con `?servicio=` desconocido o manipulado: el campo "¿Qué te interesa?" queda sin preselección y el
  servidor rechaza cualquier valor fuera de la lista.
- Una tarjeta de servicio con reverso en pantalla táctil: tocarla gira la tarjeta, y "Quiero esto" sigue siendo un
  botón propio, no el toque de la tarjeta.
- El navegador no expone WebMCP, o lo expone con otro nombre: no se registra nada, no hay errores en consola y el sitio
  funciona igual.
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
- Una lista de `/now` vacía: su bloque no se muestra.

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
- **FR-406**: Reemplazado el 2026-11-04 por los FR-406a a FR-406j (D10). Las tres tarjetas de la auditoría original
  (`architecture`, `development`, `modernization`) ya no aplican.
- **FR-407**: La descripción de "Quién soy" MUST ser la de contenido.md §6.

#### Servicios (D10)

- **FR-406a**: Servicios MUST tener siete bloques, en este orden: hero, para quién, servicios, cómo trabajo, casos,
  preguntas frecuentes y CTA final. El copy es el de contenido.md §5.
- **FR-406b**: El `h1` MUST ser el título del hero. Su intro reemplaza a `services.intro`. "Explorar" se reemplaza por
  "Cuéntame tu proceso", que lleva al formulario de Contacto. "¿Cómo te puedo ayudar?" se queda como título del bloque
  de servicios.
- **FR-406c**: Los servicios MUST ser seis: `ai-harness`, `software-factory`, `process-optimization`, `architecture`,
  `product` y `workshops` (contenido.md §5b, P-414 resuelta). Cada uno tiene número, título, texto, "para quién" y entregables, y algunos traen un ejemplo.
  - Cada servicio tiene un ícono propio de línea fina, del lenguaje del sitio:
    - un nodo con conexiones (harness);
    - carriles en paralelo (fábrica);
    - un embudo con un rayo (procesos);
    - capas apiladas (arquitectura);
    - un cohete (producto).
  - Ícono, número y título MUST quedar en una grilla fija.
- **FR-406d**: El reverso de cada tarjeta ("Qué recibes") MUST abrirse con puntero, toque, Enter o Espacio, y su estado
  MUST anunciarse. Con movimiento reducido no gira. Sin JS, ambas caras se leen completas.
- **FR-406e**: "Cómo trabajo" MUST mostrar los cinco pasos como una línea de tiempo accesible (lista ordenada) que se
  ilumina al hacer scroll, y los principios del bloque. Con movimiento reducido o sin JS, todo se ve encendido.
- **FR-406f**: Cada tarjeta MUST tener un botón "Quiero esto" que abre Contacto con `?servicio=<id>`.
  - El formulario MUST sumar el campo opcional "¿Qué te interesa?", con los seis servicios y "Otra cosa".
  - El servidor valida el valor contra esa lista y lo guarda con el mensaje, en la base que ya existe.
  - El panel muestra el valor, y la política de privacidad lo menciona (contenido.md §5.8).
- **FR-406g**: Las preguntas frecuentes MUST ser disclosures accesibles. Una pregunta cuya respuesta sigue sin
  confirmar MUST NOT publicarse (P-412).
- **FR-406h**: El bloque "Casos" MUST enlazar solo a casos de estudio ya publicados en el Portafolio, sin texto nuevo
  sobre clientes, hasta que el autor confirme qué ejemplos usar (P-413).
- **FR-406i**: El botón "Probar" de la tarjeta de asistentes MUST aparecer solo cuando exista la vitrina "Despacho" del AI
  Lab (003, A4).
- **FR-406j**: Ningún texto de Servicios MUST traer cifras o nombres internos del empleador. Cada tarjeta MAY mostrar un
  rango de precio orientativo (P-415 resuelta), pero solo con las cifras que dé el autor (P-421). Sin ellas, no se
  muestra ningún precio.
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

- **FR-420**: El sitio MUST ofrecer "Ver mi CV en LinkedIn" / "See my CV on LinkedIn" en el hero, en "Quién soy" y en
  Contacto. El enlace va al perfil público de LinkedIn, en pestaña nueva con `rel="noopener noreferrer"`, y el nombre
  accesible MUST decir que abre LinkedIn. El sitio MUST NOT servir el PDF del CV (P-406, resuelta).
- **FR-421**: La paleta MUST tener el comando "Ver mi CV en LinkedIn".
- **FR-422**: El contenido del CV MUST NOT entrar al índice de búsqueda ni al asistente.

#### Lo que sé

- **FR-430**: Reemplazado el 2026-11-04. El autor aprobó la corrección de skills (D7 y D9: seis lóbulos, ningún
  skill se borra, niveles y chips de años) y se implementa en la 002 como T229. Esta spec solo conserva lo que T229
  no cubra. P-401 y P-407 quedan resueltas: ningún skill se borra.
- **FR-431**: Cada skill nueva MUST tener ícono, con la regla de la 002: marca con licencia libre copiada al repo, o
  pictograma propio de línea fina.
- **FR-432**: Cada lóbulo MUST mostrar "dónde lo apliqué" con referencias a entradas de carrera y a proyectos. Una prueba
  verifica que cada referencia exista. La fila "dónde lo aprendí" se queda. T229 ya corrige las fuentes de los seis
  lóbulos; la 004 solo verifica y completa lo que falte (tasks, T435).
- **FR-433**: Los principios de contenido.md §8.6 MUST vivir como datos y mostrarse como chips bajo Arquitectura y como
  salida de `cat principles.md`.
- **FR-434**: "Mis habilidades, en palabras" MUST mostrar un párrafo por cada uno de los seis lóbulos de T229, sin cifras
  del empleador:
  - Frontend, Backend y nube e IA aplicada salen de contenido.md §9.
  - Arquitectura e Idiomas y negocio salen de los párrafos que el autor aprobó para T229.
  - Prácticas de ingeniería espera a P-424. Mientras tanto, ese lóbulo no muestra el bloque.
- **FR-435**: La línea de proyectos de un lóbulo MUST NOT decir "ninguno todavía". Si T229 ya oculta la línea vacía, la
  004 solo lo verifica.
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
- **FR-447**: Enlaces de los casos (P-403 resuelta):
  - Synergos MUST enlazar sus tres repos públicos (`Synergos.CMS`, `Synergos.UI` y `Synergos.Fabrica`), y su `live` sigue
    en `null` (P-410).
  - Legal workspace MUST ir sin enlace al repo mientras P-420 siga abierta.
  - Director & lines y Event bridge no tienen enlaces.

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
  - Los comandos de contenido.md §15 y `cat lemas.md` (§15b, con "Veni, vidi, vici" en `lang="la"`), sin distinguir
    mayúsculas.
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
- **FR-472**: El sitemap MUST incluir los casos nuevos y `/now`.

#### Contacto, privacidad y reacciones

- **FR-480**: La confirmación del formulario de contacto MUST decir el texto de contenido.md §19. El autor pidió un enlace
  de agenda (P-405 resuelta). Se muestra solo cuando el autor dé el enlace (P-422), y es una enmienda del formulario
  congelado (A-402 del plan).
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

- **FR-490**: `/[lang]/now` MUST leer de `content/now.ts` (contenido.md §24, P-404 resuelta): qué construye, qué
  aprende, para qué entrena, qué hace fuera del teclado y los lemas del autor, más la fecha de actualización.
  - "Veni, vidi, vici" va con `lang="la"`.
  - La fecha de HYROX no se publica.
  - El footer y la paleta enlazan a la página.

#### Sitio listo para agentes (US11)

- **FR-485**: Las capacidades públicas del sitio MUST definirse una sola vez, en un registro tipado que lee las mismas
  fuentes que la UI (`content/` y el índice de búsqueda que ya existe), sin un JSON paralelo. La paleta (FR-451) y el
  asistente MUST consumir ese mismo registro.
- **FR-486**: Un único adaptador MUST ser el único código que conoce el punto de entrada de WebMCP (hoy
  `navigator.modelContext` o `document.modelContext`). Se carga de forma diferida cuando la página está interactiva, y
  se registra solo si el navegador expone la API: sin polyfills, sin dependencias nuevas y sin errores en consola.
- **FR-487**: Herramientas de la v1:
  - **De solo lectura**: `search_portfolio`, `get_project`, `list_projects`, `get_experience`, `get_skills`,
    `list_posts` y `get_cv`.
  - **Que cambian la vista** (reversible): `set_preferences`, para idioma y tema.
  - **Que llenan un formulario sin enviarlo**: `draft_contact_message`, si P-416 lo aprueba.
  - Las áreas de `get_skills` son los lóbulos de la 002 (T229).
  - `get_cv` devuelve el enlace de LinkedIn de FR-420, no un PDF.
- **FR-488**: Cada herramienta MUST:
  - declarar su JSON Schema y validar la entrada con ese mismo esquema, con límites de tamaño en los textos;
  - devolver solo información pública del sitio;
  - tener una descripción clara en el idioma activo, sin instrucciones ocultas.

  Una prueba MUST romper el build si el esquema declarado y el validado divergen. Se muta una vez para comprobar que
  falla.
- **FR-489**: Ninguna herramienta MUST enviar, publicar ni aceptar nada por la persona. `draft_contact_message` no marca
  el checkbox de privacidad, no envía y no guarda nada en el navegador. El envío sigue pasando por la validación y el
  límite de frecuencia del servidor que ya existen.
- **FR-489a**: El sitio MUST servir `/llms.txt`, generado en el build desde el mismo registro: quién es el autor,
  secciones, casos y posts, con enlaces a ES y EN. Solo información pública.
- **FR-489b**: Todo lo que hace una herramienta MUST poder hacerse también desde la UI normal.

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
- **E-05 Servicios** (reemplazado el 2026-11-04, D10):
  - `ServiceId` pasa a `'ai-harness' | 'software-factory' | 'process-optimization' | 'architecture' | 'product' |
    'workshops'`.
  - `ServiceItem` suma `forWho: Localized`, `deliverables: Localized<string[]>`, `example?: Localized` y
    `priceRange?: Localized` (P-421). La forma completa está en data-model.md §1.
  - `SiteContent.services` suma `hero`, `audiences`, `process` (pasos y principios), `faq` y `cta`.
  - El mensaje de contacto suma `interest?: ServiceId | 'other'`, que es un cambio del contrato de la lane de
    contacto y requiere una enmienda.
- **E-06 `SiteContent.home`**: suma `previousTitle: Localized` y `subtitle: Localized`.
- **E-07 Lo que sé**:
  - `SkillLobe.applied?: string[]`, con referencias `career:<id>` o `project:<id>`.
  - `SkillLobe.projects?: string[]`.
  - `about.skills.inWords?: Record<lobeId, Localized>`.
  - `about.principles?: { short: Localized; full: Localized }[]`.
- **E-08 `SiteContent.profile`**: `availability` (ubicación, zona horaria y reubicación) y `cv` (`href` al perfil de
  LinkedIn; sin PDF, P-406).
- **E-09 Cifras de Synergos**: una fuente única con `countedAt`, `measuredAt`, conteos exactos y pisos ("más de").
- **E-10 Comando de terminal**: nombre y salida localizada, o generada desde datos.
- **E-11 Reacción**: en la base que ya existe, un contador agregado por post y tipo (`clap`, `idea`, `fire`). Sin datos del
  visitante.
- **E-12 `/now`**: `updatedAt`, y listas localizadas `building`, `learning` y `preparing`.
- **E-13 Capacidad**: `{ name; description: Localized; inputSchema; effect: 'read' | 'view' | 'draft'; execute }`. Vive
  en un registro único que consumen la paleta, el asistente, WebMCP, `llms.txt` y, en el futuro, el MCP remoto (003, A1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-401**: 0 meta descriptions y 0 textos vigentes que presenten al autor como "front-end" o "full-stack developer".
  Se exceptúan los posts de 2023, la cápsula y la frase tachada del hero.
- **SC-402**: El 100 % de las entradas de carrera y de educación coincide con la tabla de verificación (prueba unitaria).
- **SC-403**: El CV se abre en LinkedIn con 1 clic desde el hero, "Quién soy" y Contacto, y con 4 teclas o menos desde la
  paleta abierta.
- **SC-413**: En Servicios, cada una de las seis tarjetas lleva a Contacto con su servicio preseleccionado en 1 clic, con
  y sin JS. La página pasa la auditoría responsive y la de accesibilidad de la 002.
- **SC-414**: En un navegador con WebMCP, el 100 % de las herramientas de FR-487 se listan y se ejecutan con su esquema.
  Sin WebMCP, la página tiene 0 errores en consola y el mismo LCP e INP.
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
| P-401 | ¿Se aprueban los niveles propuestos para los lóbulos (contenido.md §8)? | Handoff, pregunta 4 | **Resuelta (2026-11-04):** D7 y D9, en la 002 (T229) |
| P-402 | ¿El sitio dice "desde 2019" (Growup IT, ene 2019) o "desde 2020"? Además, "En cifras" calcula 7+ años desde 2019, pero el CV dice "6 años de experiencia" | Handoff, pregunta 5, y CV | **Resuelta:** desde 2019, 7+ años |
| P-403 | ¿Qué repos son públicos? CHERCED-WORLD sí. ¿Synergos y legal-workspace? | Handoff, pregunta 10 | **Resuelta:** `Synergos.CMS`, `Synergos.UI`, `Synergos.Fabrica` y `legal-workspace`, verificados en GitHub (ver P-420) |
| P-404 | ¿Página `/now`? ¿Qué muestra este mes? | Handoff, pregunta 13 | **Resuelta:** sí, con el contenido de contenido.md §24 |
| P-405 | ¿Enlace para agendar una llamada después del formulario de contacto? | Handoff, pregunta 16 | **Resuelta:** sí; falta el enlace (P-422) |
| P-420 | ¿Todos los casos de `legal-workspace/evals/casos/` son sintéticos y ninguno sale del material de la clienta? | Revisión del repo público, 2026-11-04 | El caso Legal workspace sale sin enlace al repo |
| P-421 | Rangos de precio de cada servicio | Respuesta a P-415 | Sin precios |
| P-422 | Enlace de agenda (Calendly, Cal.com u otro) | Respuesta a P-405 | Sin enlace |
| P-423 | ¿Se registra el sitio en el origin trial de WebMCP de Chrome? Pide una cuenta externa y un token que vence, lo que roza el principio VIII | Plan, research R-401 | Sin token: las herramientas solo aparecen donde el navegador ya expone la API |
| P-424 | Párrafo "en palabras" del lóbulo Prácticas de ingeniería (T229). Ni el handoff ni contenido.md lo traen | Análisis cruzado del plan | Ese lóbulo no muestra el bloque |
| P-406 | El PDF oficial del CV trae cifras del empleador actual y nombres de proveedores, y enlaza a una cuenta de GitHub distinta de la pública. ¿Se publica tal cual (ya está en LinkedIn), se publica una versión para el sitio sin esas cifras ni nombres, o el botón lleva a LinkedIn? | Comparación del CV con la decisión "ninguna cifra del empleador" | **Resuelta (2026-11-04):** el botón lleva a LinkedIn y el sitio no sirve el PDF |
| P-407 | Hoy hay skills que no están en la propuesta: HTML5, JavaScript y AI coding agents, y CSS y Sass, que la propuesta junta en una sola. ¿Se quedan, se fusionan o salen? | Comparación de `site.ts` con la propuesta | **Resuelta (2026-11-04):** ningún skill se borra (D7, en la 002, T229) |
| P-408 | Solo Synergos trae tarjetas ADR. ¿Escribe el autor las de Director & lines, Legal workspace, Event bridge y CHERCED-WORLD 2026? | Handoff | Esos casos quedan en prosa |
| P-409 | El sitio enlaza a Instagram, pero la fuente de verdad no lo lista como contacto público. ¿Se queda? | Fuente de verdad del perfil | **Resuelta:** se queda; su perfil público enlaza al portafolio |
| P-410 | ¿Enlace en vivo de Synergos cuando su dominio esté en producción? | Handoff | `live: null` |
| P-411 | ¿Se pueden mencionar en Servicios los ejemplos de la abogada y del ingeniero estructural, sin nombres? | Página de Servicios, pregunta 1 | **Resuelta:** sí, sin nombres ni ciudad |
| P-412 | ¿Quién es dueño del código y de los plugins que se entregan? Hace falta para una de las preguntas frecuentes | Página de Servicios, pregunta 2 | Esa pregunta no se publica |
| P-413 | ¿Qué casos reales anonimizados se muestran en Servicios? | Página de Servicios, bloque "Casos" [confirmar] | Solo enlaces a casos ya publicados |
| P-414 | ¿Talleres o entrenamiento para equipos (AI-first, Spec-Driven Development) como sexto servicio? | Página de Servicios, pregunta 3 | **Resuelta:** sí, sexto servicio |
| P-415 | ¿Precios o rangos en Servicios? | Página de Servicios, pregunta 4 | **Resuelta:** sí, rangos; faltan las cifras (P-421) |
| P-416 | ¿`draft_contact_message` entra en la v1 de WebMCP, o la v1 es solo lectura? | WebMCP, pregunta 1 | Solo lectura más `set_preferences` |
| P-417 | ¿Te gustan "fábrica de software" (o "fábrica de agentes", o "software factory") y el título del hero de Servicios? | Página de Servicios, preguntas 5 y 6 | Como está en contenido.md §5 |
| P-418 | ¿El registro de capacidades va antes del AI Lab? ¿`llms.txt` sale en la misma entrega? | WebMCP, preguntas 3 y 4 | Registro primero, con `llms.txt` en US11 |
| P-419 | ¿Se alinean los servicios de LinkedIn con la página nueva? Es una acción del autor, fuera del repo | Página de Servicios, §5 [confirmar] | Sin efecto en el sitio |

## Dependencias

- **002**: debe estar integrada (ver Assumptions).
- **003**: agrega "Abrir el AI Lab" a la paleta y `ask` al terminal cuando existan. Su vitrina "Este sitio es
  agent-ready" (A13) usa el registro de US11, y "Probar" en Servicios usa la vitrina "Despacho" (A4).
- **005**: reutiliza la plantilla OG y el `@id` del `Person`, y agrega "Escuchar este post" a la paleta.
