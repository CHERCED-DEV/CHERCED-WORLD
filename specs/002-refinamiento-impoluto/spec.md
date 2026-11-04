# Feature Specification: Refinamiento impoluto de CHERCED-WORLD 2026

**Feature Branch**: `002-refinamiento-impoluto` (sobre `001-evolutivo-cherced-world`)

**Created**: 2026-11-02

**Status**: Draft

**Input**: Revisión del autor sobre la vista previa de la 001, en sus palabras: "está hermosísimo, pero le
falta refinarlo más, ponlo más elegante… más grafismos, que se vea más como un cristal… que garantices que
todos los botones funcionen… muy fino, muy artístico, con glamour… futurista… que no rompamos el concepto…
ajuste fino, pero impoluto… el responsive debe ir perfecto en todo… no pierdas el hilo del sistema de
diseño, solo enriquécelo".

## Principio rector

Esta iteración **enriquece** el sistema de diseño de la 001; no lo reemplaza. Se conservan los tokens, el
glass, la paleta blanco y negro con el acento verde `#25ED9E`, Montserrat, el GlitteringSea, la intro, los
títulos enmarcados y las rutas. Todo lo nuevo se construye como capas sobre los tokens existentes. Siguen
vigentes las constituciones 2.0.1 y sus principios I (evolución) y VIII (simplicidad operativa).

## Clarifications

### Session 2026-11-02

- Q: ¿Buzón con contador en el header? → A: **visible para todos, como en 2023**. El autor lo eligió
  sabiendo que va contra FR-046 de la 001. El público solo ve el número de no leídos y un enlace al panel;
  nunca nombres, correos ni mensajes (enmienda E-01).
- Q: ¿Qué falla al navegar? → A: los enlaces "Live" a los proyectos llevan a apps de 2022–2023 que ya no
  funcionan bien; el autor prefiere verlos **embebidos dentro del dominio**. "Los blogs no cargan": no se
  reproduce en local; se investiga en la vista previa (arranques en frío de hasta 7 s).
- Q: ¿Qué priorizar? → A: las cuatro: transiciones y microinteracciones, tipografía y hero editoriales,
  casos de estudio más ricos, y secciones nuevas.
- Q: ¿Nuevo post? → A: sí, un post "picante" donde Claude cuenta y critica con humor cómo estaba hecho el
  código de 2023 (acoplamiento, responsabilidades mezcladas), en español e inglés.

## Defectos confirmados (se corrigen primero)

| ID | Defecto | Evidencia |
|----|---------|-----------|
| D-01 | "Volver arriba" no sube | Apunta a `#header`, que es sticky y siempre "visible"; desde el final de /es/portfolio solo baja 80 px (1685 → 1605) |
| D-02 | Las tarjetas del carrusel se ven vacías | Cada diapositiva mide 949 px por las capturas verticales 420×870; en escritorio solo se ve la parte superior vacía |
| D-03 | Los "Live" llevan a apps viejas que fallan | Los 9 sitios responden 200, pero son apps de 2022–2023 sin mantenimiento; ninguno bloquea iframes |
| D-04 | Dos e2e inestables bajo carga | Moderación de L3 (editar la respuesta del autor) y tema desde la palette en móvil de L5 |
| D-05 | Arranque lento de páginas en la vista previa | Hasta 7 s en la primera petición de `/blog/post1`, por la redirección y el render dinámico |
| D-06 | La grilla de skills se desborda cerca de 856 px | Captura del autor: la cuarta columna (C#) queda cortada. La auditoría solo medía 768 y 1024 px |
| D-07 | Las tarjetas del blog no tienen llamado a la acción | En `/es/blog` solo el título es enlace; no hay "Leer más" y el resto de la tarjeta no responde, así que "no abre el blog" |
| D-08 | Faltan íconos en 10 skills nuevas | Se ven placas con iniciales (MF, NF, SDD, AI, AAF, SK, RAG, U, .NET, C#). El autor pide íconos reales |

### Decisiones del autor (2026-11-02, segunda revisión)

- **Retrato de "Sobre mí":** los retratos nuevos `public/assets/imgs/about/retrato-oscuro.webp` y
  `retrato-claro.webp` **reemplazan** la foto actual, uno por tema. Actualización del 2026-11-04: el autor
  pidió fondo transparente en ambos temas para que la animación se vea por detrás. Los retratos se
  recortaron con canal alfa (el cristal de las cintas queda translúcido), la vitrina oscura se retiró y
  solo queda un fundido inferior.
- **Skills:** la sección se anima al entrar en pantalla (barras que se llenan de forma escalonada) y cada
  tecnología lleva un ícono real.
  - Marcas con licencia libre (por ejemplo, los SVG CC0 de Simple Icons) copiados como archivos propios
    al repo, sin dependencia nueva.
  - Pictogramas originales, de línea fina, para los conceptos sin logo (micro-frontends, SDD, agentes,
    RAG).
- **Blog:** cada tarjeta entera es clicable y tiene un "Leer más →" visible.
- **"Volver arriba"** tiene que subir hasta el tope en **todas** las páginas (D-01, reiterado).
- **Auditoría responsive** de 320 a 2560 px en pasos de 40 px, no solo en anchos sueltos (D-06).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cada control hace lo que promete (Priority: P1)

Cada botón y enlace del sitio, en todas las páginas, idiomas y anchos, cumple su función: navega, sube,
abre, cierra, copia, envía, filtra o cambia lo que dice.

**Why this priority**: el autor encontró un botón que no funciona. Un sitio "impoluto" no tiene ni uno.

**Independent Test**: una auditoría automática recorre todos los controles interactivos de cada página
y verifica su efecto observable.

**Acceptance Scenarios**:

1. **Given** el final de cualquier página, **When** el visitante activa "Volver arriba", **Then** la página
   queda en la parte superior (o arriba de todo, con movimiento reducido sin animación) y el foco pasa al
   contenido principal.
2. **Given** cualquier control interactivo, **When** se activa con clic, toque o teclado, **Then** produce un
   efecto verificable: cambio de URL, de scroll, de estado, de foco o un diálogo.
3. **Given** el inventario de controles por página, **When** se agrega un control sin prueba de función,
   **Then** la auditoría falla.

### User Story 2 - Cristal de verdad y grafismos finos (Priority: P1)

Las superficies se ven como cristal real: borde con brillo especular, refracción sutil del fondo, grano de
esmerilado finísimo, profundidad por capas y reflejos que responden al puntero. Aparecen grafismos
discretos: líneas de retícula, trazos finos, destellos y degradados de luz, siempre en blanco y negro con el
verde de marca como acento.

**Why this priority**: es lo que el autor pidió con más énfasis ("más grafismos, que se vea más como un
cristal", "glamour fino", "futurista").

**Independent Test**: comparación visual en ambos temas, y la prueba de contraste de la 001 sigue en
AA o mejor en todo texto.

**Acceptance Scenarios**:

1. **Given** cualquier panel glass, **When** se observa sobre el fondo animado, **Then** muestra borde con
   brillo, profundidad y esmerilado visibles, y el texto conserva contraste AA.
2. **Given** el puntero sobre un panel interactivo, **When** se mueve, **Then** un reflejo de luz lo sigue
   con suavidad. Con "reducir movimiento", el reflejo queda fijo.
3. **Given** "reducir transparencia" o un navegador sin desenfoque, **When** se carga la página, **Then** los
   paneles caen a su variante sólida, que conserva el brillo del borde y los grafismos.

### User Story 3 - Movimiento con intención (Priority: P1)

Transiciones suaves entre páginas, entrada escalonada de secciones al aparecer en pantalla, y hover, foco y
pulsación finos y consistentes en todos los controles.

**Independent Test**: navegación entre todas las páginas en escritorio y móvil, con y sin movimiento
reducido.

**Acceptance Scenarios**:

1. **Given** una navegación interna, **When** cambia la página, **Then** hay una transición de no más de
   350 ms que no bloquea la interacción ni produce saltos de diseño (CLS ≤ 0,1).
2. **Given** una sección que entra en pantalla, **When** aparece, **Then** se revela una sola vez con un
   movimiento corto. Sin JS o con movimiento reducido, se ve completa de inmediato.

### User Story 4 - Hero y tipografía editoriales (Priority: P2)

El home tiene más presencia: composición editorial, escala tipográfica fluida con contraste de pesos y un
ritmo de espacios consistente. El banner "Mi nombre es Camilo / SOY DESARROLLADOR" conserva su contenido
y su lugar.

**Acceptance Scenarios**:

1. **Given** cualquier ancho de 320 a 2560 px, **When** se ve el home, **Then** la composición se mantiene
   equilibrada, sin desbordes ni textos partidos de forma torpe.

### User Story 5 - Casos de estudio ricos con el proyecto embebido (Priority: P2)

Cada caso de estudio muestra una galería de capturas, el stack como piezas visuales, los resultados
destacados y, si hay sitio en línea, el proyecto **embebido** en un marco de dispositivo dentro del
dominio, con un enlace secundario para abrirlo afuera. Las tarjetas del carrusel muestran la imagen
completa en proporción, sin espacio vacío.

**Acceptance Scenarios**:

1. **Given** un proyecto con `live`, **When** se abre su caso de estudio, **Then** el sitio se carga
   embebido de forma diferida (solo al pedirlo o al entrar en pantalla), dentro de un marco con su URL y
   una acción para abrirlo en pestaña nueva.
2. **Given** que el embebido no carga en 10 s, **When** pasa ese tiempo, **Then** se muestra la captura del
   proyecto con un aviso amable y el enlace externo.
3. **Given** el carrusel, **When** se ve en cualquier ancho, **Then** cada tarjeta muestra su imagen completa
   y su título sin espacio vacío (D-02).

### User Story 6 - Secciones nuevas (Priority: P2)

- **Línea de tiempo de carrera** en "Sobre mí", con los 8 empleos, que reemplaza la lista.
- **Cifras destacadas**: años construyendo para la web (desde 2019), proyectos, aerolíneas en las que se
  desplegó lo construido, tecnologías. Solo cifras públicas. Las cifras de Sistecrédito quedan pendientes
  del autor.
- **"Ahora trabajo en"**: un bloque breve en el home con el rol actual y Synergos.

**Acceptance Scenarios**:

1. **Given** "Sobre mí", **When** se recorre, **Then** la carrera se lee como línea de tiempo accesible
   (lista ordenada, fechas con `time`) y funciona sin JS.
2. **Given** una cifra destacada, **When** entra en pantalla, **Then** se anima una sola vez, y sin JS o
   con movimiento reducido muestra su valor final.

### User Story 6b - La carrera como cartas sobre la mesa (Priority: P2)

Pedido del autor (2026-11-04): en escritorio, la carrera se ve como tarjetas de cristal "tiradas" sobre
una mesa, levemente giradas y superpuestas. Al hacer clic en una, una animación la trae al frente y la
muestra abierta con todo su contenido. Al cerrarla, vuelve a su lugar.

**Acceptance Scenarios**:

1. **Given** un ancho ≥ 992 px, **When** se ve la carrera, **Then** los 8 empleos aparecen como tarjetas de
   cristal dispersas con rotación y posición deterministas (sin saltos entre cargas). Al pasar el puntero,
   la tarjeta se levanta.
2. **Given** una tarjeta, **When** se activa con clic, Enter o Espacio, **Then** vuela al centro con una
   transición de elemento compartido (`<ViewTransition name>` de React 19.3) y se abre como diálogo
   modal accesible. Esc, clic fuera o "Cerrar" la devuelven a su lugar y el foco vuelve a la tarjeta.
3. **Given** movimiento reducido, **When** se abre o se cierra, **Then** no hay vuelo: solo un fundido corto.
4. **Given** < 992 px o sin JS, **When** se ve la carrera, **Then** se muestra la línea de tiempo vertical,
   completa y legible.

### User Story 6c - "Sobre mí" en tres escenas y el mapa cerebral (Priority: P2)

Pedido del autor (2026-11-04): "Sobre mí" se siente plano y obliga a hacer mucho scroll. Los cursos y las
skills deberían verse como un mapa mental, un "diagrama cerebral" de lo que el autor sabe.

- **Tres escenas** en lugar de seis secciones apiladas:
  1. **Quién soy**: el retrato según el tema, la introducción y las cifras destacadas, en un bento de cristal.
  2. **Carrera**: las cartas sobre la mesa (US6b).
  3. **Lo que sé**: el mapa cerebral.
  Educación, cursos e idiomas dejan de ser secciones aparte y pasan a ser fuentes dentro del mapa. Un índice
  de escenas fijo bajo el header permite saltar entre ellas y marca la escena visible.
- **Mapa cerebral**:
  - Un núcleo (el autor) y cinco lóbulos: Frontend, Arquitectura, Backend y nube, IA aplicada y Oficio.
  - Cada skill es una neurona cuyo tamaño refleja su nivel actual en `site.ts`. No se agregan skills y no
    cambia ningún nivel.
  - Las fuentes van en una fila aparte: Platzi Master, Fundamentos de Arquitectura, Full Stack JS, Next.js,
    UNAD y EAM.
  - Al activar un lóbulo, sus sinapsis se encienden en `#25ED9E` con un pulso que las recorre y sus fuentes
    se iluminan. Un panel de cristal muestra las skills con su barra, dónde se aprendieron y los proyectos
    del portafolio que las usan (cruce por tecnología con `projects.ts`).
  - Usa solo blanco, negro y `#25ED9E` (FR-204). El púrpura del primer boceto no pasa al sitio.
- **Estética Matrix sobre cristal** (decisión del autor, 2026-11-04: el primer boceto era "muy suave"):
  - Detrás del mapa cae una lluvia de código en `#25ED9E` con katakana, dígitos y los nombres de las skills.
    Va en un `canvas` limitado a la escena, a 20 fps como máximo, en pausa fuera de pantalla o con la pestaña
    oculta, y no se dibuja con movimiento reducido. El fondo GlitteringSea sigue siendo el fondo del sitio.
  - El mapa, los lóbulos, las fuentes y el panel son cristal v2 (`glass-crystal`, `glass-edge`) sobre la
    lluvia. Los lóbulos son botones HTML de cristal, no figuras SVG, para que el esmerilado funcione.
  - Etiquetas en tipografía mono. El núcleo es un disco `#25ED9E` con halo y un anillo punteado que gira.
  - Las sinapsis activas brillan y llevan paquetes de datos (trazo discontinuo que avanza). Las neuronas
    activas tienen halo.
  - El panel es una terminal: prompt `$ cat <lóbulo>.lobe`, título que se descifra desde glifos al cambiar,
    barras de bloques `█░` y una línea de fuentes y otra de proyectos.
  - El texto siempre va sobre cristal y mantiene AA (SC-203). La lluvia nunca queda detrás de texto sin panel.
  - Referencia visual: el boceto `mapa-cerebral-matrix.html` que el orquestador entrega a R3.
- **Datos**: la agrupación es contenido, no código. Enmienda de tipos E-03:
  `skills.lobes?: { id; name: Localized; skills: string[]; sources: string[] }[]`, que referencia los `id`
  existentes.

**Acceptance Scenarios**:

1. **Given** un ancho de 1440 px, **When** se abre "Sobre mí", **Then** se ven las tres escenas con su índice,
   y la altura del documento baja al menos un 40 % frente a la de la 001.
2. **Given** el mapa, **When** se activa un lóbulo con clic, Enter, Espacio o las flechas, **Then** se
   encienden sus neuronas y sus fuentes, y el panel (`aria-live="polite"`) muestra skills con nivel, fuentes
   y proyectos. Cada lóbulo es un botón con `aria-pressed`.
3. **Given** que no hay JS, **When** se ve "Lo que sé", **Then** todos los lóbulos aparecen como listas
   completas con sus barras, en HTML servido por el servidor. El SVG es una mejora, no el contenido.
4. **Given** menos de 768 px, **When** se ve el mapa, **Then** los lóbulos se muestran como chips con
   desplazamiento horizontal y el panel queda debajo, sin desbordes desde 320 px.
5. **Given** movimiento reducido, **When** se activa un lóbulo, **Then** no hay lluvia, pulso, giro ni
   descifrado: solo cambia el estado.
6. **Given** la escena con la lluvia activa, **When** se mide con la GPU real, **Then** el sitio se mantiene
   en 50 fps o más (SC-205).

### User Story 7 - Buzón en el header (Priority: P2)

Un ícono de buzón en el header, visible para todos, muestra cuántos mensajes sin leer hay, como en 2023.
Decisión del autor (2026-11-04): el clic lleva a Contacto, no al panel. El panel queda solo por URL
directa, para no mostrarle a cualquiera dónde está la puerta del admin.

**Acceptance Scenarios**:

1. **Given** mensajes sin leer, **When** cualquier visitante ve el header, **Then** ve el buzón con el número.
   Con cero, el buzón se ve sin número.
2. **Given** cualquier respuesta pública, **When** se audita, **Then** solo contiene el número, nunca
   nombres, correos, teléfonos ni textos de mensajes (SC-007 de la 001 se ajusta a esta excepción).

### User Story 8 - El post picante (Priority: P3)

El post 5, "Querido Camilo de 2023", donde Claude cuenta con humor y sin piedad, pero con cariño, cómo
estaba construido el sitio de 2023: todo acoplado, responsabilidades mezcladas, un "CMS" en localStorage,
"sockets" que eran polling, una API que se llamaba a sí misma, y qué se hizo distinto en 2026. En español
e inglés.

### User Story 9 - El museo 2023 (Priority: P3, después de R0–R5)

El autor quiere tener de recuerdo el código que hizo a mano en 2023, desplegado y descubrible dentro
del portafolio, "con mucho cariño", y pidió que lo sorprendamos.

- El sitio 2023 se despliega desde la rama `dev`, con la URL de rama estable que Vercel
  asigna sola. No hay infraestructura ni variables nuevas.
- **Modo museo de solo lectura:** las rutas que tocaban la base (contacto, comentarios, "sockets", inbox)
  se reemplazan por respuestas fijas que no leen ni escriben datos reales. El sitio se ve y se navega igual
  que en 2023, y esa es la única diferencia funcional.
- Se indexa como un proyecto más del portafolio y se puede descubrir desde la experiencia del sitio. La forma
  exacta queda a criterio del orquestador: es la sorpresa.

**Acceptance Scenarios**:

1. **Given** el museo desplegado, **When** se recorre, **Then** se ve como el sitio de 2023 y ninguna petición
   llega a la base real.
2. **Given** el portafolio 2026, **When** el visitante encuentra el museo, **Then** puede verlo embebido o
   abrirlo aparte.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-201**: Todo control interactivo MUST tener un efecto verificable cubierto por la auditoría de
  interacción (US1).
- **FR-202**: "Volver arriba" MUST llevar a la parte superior real de la página y mover el foco a `main`.
- **FR-203**: El sistema de glass MUST ampliarse con capas nuevas sobre los tokens existentes (brillo de
  borde, esmerilado, reflejo que sigue al puntero, profundidad), sin cambiar los nombres ni los valores de
  los tokens que ya existen.
- **FR-204**: Los grafismos MUST usar solo blanco, negro y `#25ED9E`, y MUST NOT reducir el contraste del
  texto por debajo de AA.
- **FR-205**: Las transiciones entre páginas MUST durar 350 ms o menos, y deshabilitarse con "reducir
  movimiento".
- **FR-206**: Los casos de estudio con `live` MUST ofrecer el sitio embebido, diferido, con
  `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`, `loading="lazy"`, título accesible
  y la captura del proyecto como respaldo.
- **FR-207**: El carrusel MUST mostrar cada imagen completa en proporción (D-02).
- **FR-208**: "Sobre mí" MUST presentar la carrera como línea de tiempo y sumar cifras destacadas públicas.
- **FR-209**: El header MUST mostrar a todos un buzón con el número de no leídos, servido por un endpoint
  público que devuelve solo `{ unread: number }`, con caché de 30 s.
- **FR-210**: El responsive MUST pasar la auditoría en todas las páginas, incluidos el panel, el catálogo,
  el 404 y los 12 casos de estudio, de 320 a 2560 px.
- **FR-211**: El post 5 MUST publicarse en español e inglés.
- **FR-212**: Las e2e inestables (D-04) MUST quedar estables: 3 corridas completas seguidas sin fallos.
- **FR-213**: "Sobre mí" MUST organizarse en tres escenas, y skills, cursos, educación e idiomas MUST verse
  como un mapa cerebral accesible por teclado, con respaldo completo sin JS (US6c).

### Key Entities

Sin entidades nuevas. `Project` puede sumar `gallery?: ImageRef[]` y `highlights?: Localized[]` (enmienda
de tipos E-02, opcional).

## Success Criteria *(mandatory)*

- **SC-201**: La auditoría de interacción da 0 controles sin efecto verificable.
- **SC-202**: La auditoría responsive (todas las páginas, es/en, 320–2560 px) da 0 hallazgos.
- **SC-203**: El peor contraste de texto sobre glass sigue en 4,5:1 o más, en ambos temas.
- **SC-204**: LCP ≤ 2,5 s y CLS ≤ 0,1 se mantienen con los grafismos y las transiciones.
- **SC-205**: El fondo animado sigue a 50 fps o más con la GPU real, con los reflejos activos.
- **SC-206**: A 1440 px, la altura del documento de "Sobre mí" baja al menos un 40 % frente a la 001.
- **SC-206**: 3 corridas completas de e2e seguidas en verde.

## Assumptions

- Seguir sin infraestructura ni variables nuevas (principio VIII). El endpoint del buzón usa la base
  existente.
- Las apps embebidas son del autor y no bloquean iframes (verificado el 2026-11-02).
- Fuera de alcance: rediseño desde cero, colores nuevos, cambiar rutas, editor web de contenido.
