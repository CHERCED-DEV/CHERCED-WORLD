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

### User Story 7 - Buzón en el header (Priority: P2)

Un ícono de buzón en el header, visible para todos, muestra cuántos mensajes sin leer hay y lleva al panel,
como en 2023.

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

### Key Entities

Sin entidades nuevas. `Project` puede sumar `gallery?: ImageRef[]` y `highlights?: Localized[]` (enmienda
de tipos E-02, opcional).

## Success Criteria *(mandatory)*

- **SC-201**: La auditoría de interacción da 0 controles sin efecto verificable.
- **SC-202**: La auditoría responsive (todas las páginas, es/en, 320–2560 px) da 0 hallazgos.
- **SC-203**: El peor contraste de texto sobre glass sigue en 4,5:1 o más, en ambos temas.
- **SC-204**: LCP ≤ 2,5 s y CLS ≤ 0,1 se mantienen con los grafismos y las transiciones.
- **SC-205**: El fondo animado sigue a 50 fps o más con la GPU real, con los reflejos activos.
- **SC-206**: 3 corridas completas de e2e seguidas en verde.

## Assumptions

- Seguir sin infraestructura ni variables nuevas (principio VIII). El endpoint del buzón usa la base
  existente.
- Las apps embebidas son del autor y no bloquean iframes (verificado el 2026-11-02).
- Fuera de alcance: rediseño desde cero, colores nuevos, cambiar rutas, editor web de contenido.
