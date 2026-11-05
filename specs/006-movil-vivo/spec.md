# Feature Specification: Móvil vivo

**Feature Branch**: `006-movil-vivo` (sobre `004-contenido-presente`, con P0 congelada y P3 integrada)

**Created**: 2026-11-05

**Status**: Draft

**Input**: pedido del autor del 2026-11-05 (D11), en sus palabras: "en pantallas grandes tiene funcionalidades muy
interesantes y se ve genial. Pero en mobile todavía se ve muy tradicional, aunque se ve hermosa… tarjetas, cosas
flotantes, mejoras del glassmorfismo, que se pueda ver el diagrama de mi capacidad… darle vida y ajustar finamente, no
acabar con lo que hoy existe". Más el insumo de refinamiento móvil del handoff del autor (privado, fuera del repo) y sus
decisiones del 2026-11-05.

## Principio rector: enriquecer, no reemplazar

Móvil no es una versión reducida del escritorio: es otra forma de tocar lo mismo. En escritorio, la vida viene del
mouse: la luz que sigue al puntero, el hover y el mapa amplio. En móvil, viene del dedo, del scroll y de la
profundidad.

Esta spec **enriquece** la 002 y la 004; no reemplaza nada. Se conservan:

- los tokens, el cristal y la paleta blanco y negro con acento `#25ED9E`;
- Montserrat, el GlitteringSea (D1: el fondo no se toca), la intro y los títulos enmarcados;
- las rutas y todo lo que hoy funciona en escritorio.

Cada cambio vive dentro de `< md` (768 px) o de `(hover: none)` / `(pointer: coarse)`, salvo que se diga otra cosa, y
todo lo nuevo tiene un respaldo sin JS y con movimiento reducido.

## Verificación de las causas en el código (2026-11-05, rama `004-contenido-presente`)

El insumo cita tres causas. Las tres se confirmaron leyendo el código, con algunas precisiones:

| # | Causa | Evidencia | Precisión |
|---|---|---|---|
| C1 | La luz del cristal solo existe con mouse | `styles/_glass.scss`: `$-light-query` exige `(hover: hover) and (pointer: fine)`. `lib/fx/pointer-light.ts`: `POINTER_LIGHT_QUERY` igual, y `onMove` sale si `pointerType === 'touch'` | Las variables son `--cw-mx` y `--cw-my`, no `--cw-light-x/y` como decía el insumo |
| C2 | El mapa cerebral no existe bajo 768 px | `components/site/about/Brain.module.scss`: `.svg` y `.core` son `display: none` y solo aparecen con `bp.up(md)`. `.rain` se oculta con `bp.down(md)`. `.lobes` es una fila de chips con scroll horizontal hasta `md` | Es mobile-first: se oculta por defecto y aparece desde `md` |
| C3 | Las cartas de carrera solo existen desde 992 px | `components/site/about/About.module.scss`: `.deck` es `display: none` y se muestra con `bp.up(lg)` y `:root[data-js]`, cuando se oculta `.timeline` | Entre 768 y 991 px tampoco hay cartas: también es tablet |

**Detalles menores verificados**:

- `.sceneIndex` se oculta bajo 480 px, pero es solo el número "01" de cada enlace. La barra de escenas sigue visible
  en móvil. El insumo decía que se ocultaba el índice entero.
- No tienen ningún breakpoint propio: `Home.module.scss`, `PostCard.module.scss`, `CaseGallery.module.scss`,
  `FloatMenu.module.scss` y `Toc.module.scss`.
- El índice "En este post", bajo `xl`, queda como bloque al principio del post; no se oculta. Era el [verificar] del
  insumo.
- El botón del asistente flota abajo a la derecha (`components/experience/ExperienceClient.module.scss`, `position:
  fixed`) y puede tapar contenido.
- Los blur de hoy son 8, 14 y 22 px (`styles/tokens.scss`), y no tienen variante móvil.

## Enmiendas a decisiones anteriores

| ID | Antes | Ahora |
|---|---|---|
| EM-01 | **002, T203**: `pointer-light` "se apaga con movimiento reducido y en táctil" | En táctil, la luz sigue al dedo mientras toca y se desvanece al soltar (US1). Con movimiento reducido sigue apagada |
| EM-02 | **002, US6c escenario 4**: bajo 768 px, los lóbulos son chips con scroll horizontal | Bajo 768 px, con JS, se ve el mapa compacto con su hoja (US7). Los chips quedan como respaldo sin JS |
| EM-03 | **002, US6b**: las cartas sobre la mesa solo desde 992 px; debajo, la línea de tiempo | Bajo 992 px, con JS, la carrera es un "mazo en la mano" (US8). La línea de tiempo queda como respaldo sin JS y con movimiento reducido |
| EM-04 | **004**: P0 era dueña de `components/ui/**` y `components/shell/**`, y la 002 (R0), de `styles/**` y `lib/fx/**` | Con P0 congelada, la lane nueva M0 toma `styles/**`, `lib/fx/**`, `components/ui/**` y el dock y el header de `components/shell/**`. P6 toma `components/shell/FloatMenu*` para la cascada del menú |
| EM-05 | El insumo de interacciones recomendaba quitar el buzón del header | Se queda visible para todos y lleva a Contacto (D12 y la decisión del 2026-11-04). El dock no lo absorbe |

## Clarifications

### Session 2026-11-05 (decisiones del autor)

- Q: ¿Dock flotante? → A: sí. Es una píldora de cristal abajo al centro, en `< md`, que agrupa menú, búsqueda y paleta,
  asistente y tema. Se esconde al bajar y vuelve al subir.
- Q: ¿Háptica? → A: sí, opcional: `navigator.vibrate(8)` solo donde exista y nunca con movimiento reducido.
- Q: ¿Carrera en móvil? → A: el "mazo en la mano". Se desliza para pasar y se toca para abrir en una hoja, y siempre hay
  botones anterior y siguiente y un contador.
- Q: ¿Prototipo primero? → A: sí. La fase 1 entrega la base móvil (luz táctil, presupuesto de blur, hoja de cristal,
  barrido por scroll, profundidad flotante, háptica y dock) y el mapa cerebral compacto con su hoja, para que el autor
  lo pruebe en su celular en una vista previa. La fase 2 trae el resto, página por página.
- Q: ¿Buzón del header? → A: se queda visible para todos y lleva a Contacto.
- Q: ¿Blog? → A: lo hace la 005 (decisión de este plan; ver US15 y el plan).

## User Scenarios & Testing *(mandatory)*

Las historias US1 a US7 son la **fase 1**. Las US8 a US15 son la **fase 2**.

### User Story 1 - Luz táctil (Priority: P1, fase 1)

En un celular, el brillo del borde de cristal sigue al dedo mientras toca una superficie con luz y se desvanece suave
al soltar.

**Why this priority**: es la causa C1: sin luz que se mueva, el cristal se ve plano.

**Independent Test**: tocar y arrastrar sobre una tarjeta con luz en un dispositivo táctil emulado y en uno real.

**Acceptance Scenarios**:

1. **Given** una pantalla táctil, **When** el dedo toca y se mueve sobre una superficie `light`, **Then** el reflejo
   sigue la posición del dedo (`--cw-mx` y `--cw-my`).
2. **Given** que el dedo se levanta, **When** pasan unos 300 ms, **Then** el reflejo se desvanece.
3. **Given** movimiento reducido, **When** se toca, **Then** no hay reflejo, como hoy.
4. **Given** un escritorio con mouse, **When** se compara con la 004, **Then** la luz se comporta igual que antes.

---

### User Story 2 - Presupuesto de cristal en móvil (Priority: P1, fase 1)

En `< md`, como máximo tres superficies con desenfoque real están visibles a la vez: el header o el dock, la hoja
abierta y la tarjeta activa. Las demás se ven como cristal (borde, grano y profundidad) sobre un fondo sólido.

**Why this priority**: `backdrop-filter` es caro en celulares. Sin presupuesto, la vida nueva costaría fluidez.

**Independent Test**: contar en cada página, a 375 px, cuántos elementos visibles tienen un `backdrop-filter` activo.

**Acceptance Scenarios**:

1. **Given** cualquier página a 375 px, **When** se cuentan las superficies visibles con blur, **Then** son 3 o menos.
2. **Given** las tarjetas de una lista larga, **When** se ven, **Then** conservan borde, grano y profundidad sin
   desenfoque.
3. **Given** "reducir transparencia" o un navegador sin blur, **When** se carga, **Then** se usan los respaldos sólidos
   que ya existen.

---

### User Story 3 - Hoja de cristal (Priority: P1, fase 1)

Un panel de cristal `strong` sube desde abajo, con agarradera. Se cierra arrastrándolo hacia abajo, con Esc o con
"Cerrar", y atrapa el foco mientras está abierto.

**Why this priority**: es la pieza que usan el mapa compacto, el mazo, la paleta, el asistente y el embebido.

**Independent Test**: abrir y cerrar la hoja con toque, con teclado, con Esc y arrastrando, en móvil emulado.

**Acceptance Scenarios**:

1. **Given** una hoja cerrada, **When** se abre, **Then** sube con una transición de `transform` de 300 ms o menos, el
   foco pasa a su título y el resto queda inerte (`aria-modal`).
2. **Given** la hoja abierta, **When** se arrastra la agarradera hacia abajo más del umbral, se pulsa Esc o se activa
   "Cerrar", **Then** se cierra y el foco vuelve al control que la abrió.
3. **Given** un iPhone con barra de inicio, **When** la hoja está abierta, **Then** su contenido respeta
   `env(safe-area-inset-bottom)` y su alto máximo es `100dvh` menos el margen superior.
4. **Given** movimiento reducido, **When** se abre o se cierra, **Then** aparece con un fundido, sin desplazamiento.

---

### User Story 4 - Barrido por scroll y profundidad flotante (Priority: P1, fase 1)

Al entrar en pantalla, la luz recorre una vez el borde de tarjetas, títulos enmarcados y figuras. Las tarjetas
flotantes tienen 2 o 3 niveles de profundidad que se desfasan levemente al hacer scroll.

**Why this priority**: son los patrones de "cosas flotantes" que pidió el autor. La fase 2 los aplica por página.

**Independent Test**: hacer scroll en una página de prueba con los dos patrones, con y sin soporte de scroll-driven
animations, y con movimiento reducido.

**Acceptance Scenarios**:

1. **Given** una superficie con barrido, **When** entra al viewport, **Then** la luz la recorre una vez en diagonal (entre
   600 y 800 ms). Sin soporte de `animation-timeline`, lo dispara un `IntersectionObserver` una sola vez.
2. **Given** tarjetas con profundidad, **When** se hace scroll, **Then** el desfase entre niveles es de 12 px como
   máximo y solo usa `transform`.
3. **Given** movimiento reducido, **When** se hace scroll, **Then** no hay barrido ni desfase.

---

### User Story 5 - Háptica opcional (Priority: P2, fase 1)

Al elegir un lóbulo o abrir una carta, el teléfono vibra muy suave (8 ms), si el navegador lo permite.

**Why this priority**: es un detalle. Depende de que el navegador tenga la API.

**Independent Test**: unitaria con `navigator.vibrate` doble; en el dispositivo real, prueba del autor.

**Acceptance Scenarios**:

1. **Given** un navegador con `navigator.vibrate` y sin movimiento reducido, **When** se elige un lóbulo, **Then** se llama
   `vibrate(8)` una vez.
2. **Given** un navegador sin la API o con movimiento reducido, **When** se elige, **Then** no se llama y no hay errores.

---

### User Story 6 - Dock flotante (Priority: P1, fase 1)

En `< md`, con JS, una píldora de cristal fija abajo al centro agrupa el menú, la búsqueda y paleta, el asistente y el
tema. Se esconde al bajar y vuelve al subir. El buzón sigue en el header.

**Why this priority**: hoy los botones flotan sueltos y el del asistente tapa contenido, como el CTA de Servicios en la
captura del autor.

**Independent Test**: recorrer páginas a 375 px: bajar, subir, abrir cada acción desde el dock y comprobar que nada
queda tapado al final de la página.

**Acceptance Scenarios**:

1. **Given** `< md` con JS, **When** carga cualquier página, **Then** el dock muestra menú, búsqueda, asistente y tema,
   cada uno de 44 × 44 px o más y con nombre accesible. El header ya no repite esos botones, y el botón flotante del
   asistente no aparece.
2. **Given** el dock visible, **When** se hace scroll hacia abajo, **Then** se esconde con `transform`. Al subir, vuelve.
3. **Given** el final de una página, **When** se llega abajo, **Then** el dock no tapa ningún contenido ni CTA.
4. **Given** el teclado del sistema abierto o una hoja abierta, **When** se ve la pantalla, **Then** el dock se oculta.
5. **Given** que no hay JS, **When** se carga, **Then** no hay dock y el header conserva sus botones de hoy. El menú
   funciona por `popover`.
6. **Given** el header en móvil, **When** se mira, **Then** el buzón sigue visible y lleva a Contacto.

---

### User Story 7 - Mapa cerebral compacto con su hoja (Priority: P1, fase 1)

En `< md`, el diagrama de capacidades vuelve: un mapa radial cuadrado con el núcleo "CAMILO" al centro y los seis
lóbulos en círculo, con neuronas y conexiones animadas. Al tocar un lóbulo, sube una hoja con el panel terminal y "Mis
habilidades, en palabras".

**Why this priority**: es la causa C2 y lo que el autor más pidió ("que se pueda ver el diagrama de mi capacidad").
Va en el prototipo de la fase 1.

**Independent Test**: a 375 px, recorrer los seis lóbulos solo con toques, solo con botones y solo con teclado. Luego
verlo sin JS y con movimiento reducido.

**Acceptance Scenarios**:

1. **Given** 375 px de ancho, **When** se ve "Lo que sé", **Then** el mapa completo (núcleo y 6 lóbulos) cabe sin scroll
   horizontal. Cada lóbulo mide al menos 64 px de diámetro visual y 44 × 44 px de área táctil.
2. **Given** el mapa, **When** se toca un lóbulo, **Then** se ilumina (`aria-pressed`), vibra suave si aplica y sube la
   hoja con su panel. Es un solo toque, y el criterio pide menos de 2.
3. **Given** la hoja abierta, **When** se desliza a izquierda o derecha o se pulsan "Anterior" y "Siguiente", **Then**
   cambia el lóbulo, y el mapa de atrás sigue la selección.
4. **Given** el mapa en pantalla, **When** está visible, **Then** la lluvia "Matrix" corre acotada al área del mapa, con
   menos columnas y menos fps que en escritorio, y se pausa fuera de pantalla.
5. **Given** movimiento reducido, **When** se ve el mapa, **Then** se muestra estático, sin lluvia, pulso ni giro, como en
   escritorio (002, US6c escenario 5). P-601 confirma la decisión.
6. **Given** que no hay JS, **When** se ve "Lo que sé", **Then** aparecen los chips y las listas completas de hoy.

---

### User Story 8 - Carrera como mazo en la mano (Priority: P2, fase 2)

Bajo 992 px, con JS, las cartas de la 002 se apilan al centro: la de arriba completa y las de atrás asomando, levemente
giradas. Deslizar la de arriba la manda al fondo, y tocarla la abre en una hoja.

**Why this priority**: es la causa C3, decidida por el autor.

**Independent Test**: recorrer las 8 cartas deslizando, con botones y con teclado. Abrir una en la hoja.

**Acceptance Scenarios**:

1. **Given** < 992 px con JS, **When** se ve la carrera, **Then** hay un mazo con la carta de arriba completa y las de
   atrás asomando, giradas entre −3° y 3°, siempre igual en cada carga.
2. **Given** el mazo, **When** se desliza la carta de arriba o se pulsa "Siguiente", **Then** pasa al fondo y se ve la
   siguiente. El contador dice "n / 8".
3. **Given** la carta de arriba, **When** se toca o se pulsa Enter, **Then** se abre en una hoja con su detalle, y vibra
   suave si aplica.
4. **Given** movimiento reducido o que no hay JS, **When** se ve la carrera, **Then** se muestra la línea de tiempo de
   hoy.

---

### User Story 9 - "Sobre mí": escenas y figuras (Priority: P2, fase 2)

- En `< sm`, la barra de escenas suma un indicador de progreso de tres puntos, con la escena actual en verde.
- Las figuras de "En cifras" pasan a una cuadrícula 2×2 de tarjetas flotantes, con conteo al entrar y barrido de luz.
- El marco del retrato recibe un barrido al entrar.

**Independent Test**: recorrer las tres escenas a 375 px, con y sin movimiento reducido.

**Acceptance Scenarios**:

1. **Given** < 480 px, **When** se hace scroll por las escenas, **Then** el punto de la escena visible se ve en verde, y
   tocar un punto navega a esa escena.
2. **Given** "En cifras" en < md, **When** entra en pantalla, **Then** las cuatro cifras forman una cuadrícula 2×2 con
   conteo animado una vez, barrido y un desfase de profundidad distinto por tarjeta.
3. **Given** el texto de "Quién soy", **When** se lee en móvil, **Then** está alineado a la izquierda (002, T225, se
   verifica).

---

### User Story 10 - Home (Priority: P3, fase 2)

- El banner se queda como está, con luz táctil y un barrido inicial al cargar.
- "Ahora trabajo en" pasa a tarjetas flotantes con profundidad.
- El indicador de scroll respira suave.

**Acceptance Scenarios**:

1. **Given** el home en < md, **When** carga, **Then** el marco del banner recibe un barrido una vez, sin mover el
   layout.
2. **Given** "Ahora trabajo en", **When** se hace scroll, **Then** sus tarjetas tienen profundidad (US4).
3. **Given** el indicador de scroll, **When** está visible, **Then** respira con `opacity` y `transform` en un ciclo de
   unos 4 s. Con movimiento reducido, queda quieto.

---

### User Story 11 - Servicios como pila sticky (Priority: P2, fase 2)

En `< md`, las seis tarjetas de servicio se apilan con `position: sticky` al hacer scroll, como un mazo: la de atrás un
poco más pequeña y oscura. Girar una tarjeta se hace con un toque o con el botón visible "Ver qué recibes". "Cómo
trabajo" se ilumina paso a paso con el scroll.

**Acceptance Scenarios**:

1. **Given** Servicios en < md, **When** se hace scroll, **Then** las tarjetas se apilan con un `top` escalonado, y la
   activa queda al frente.
2. **Given** una tarjeta, **When** se toca o se pulsa "Ver qué recibes", **Then** muestra "Qué recibes". Nunca depende de
   un gesto escondido.
3. **Given** movimiento reducido, **When** se hace scroll, **Then** las tarjetas se listan sin apilarse.

---

### User Story 12 - Portafolio y casos (Priority: P2, fase 2)

- En `< md`, el carrusel ocupa el ancho completo y deja asomar la siguiente tarjeta, con puntos de progreso y snap.
- Los filtros quedan como chips sticky bajo el header, con el conteo de resultados.
- En el caso, la galería se desliza, las tarjetas ADR se apilan y el embebido abre a pantalla completa en una hoja.

**Acceptance Scenarios**:

1. **Given** el carrusel en < md, **When** se ve, **Then** se asoma el borde de la tarjeta siguiente, hay puntos de
   progreso y botones anterior y siguiente, y el snap deja cada tarjeta centrada.
2. **Given** los filtros, **When** se hace scroll, **Then** quedan fijos bajo el header y anuncian la cantidad.
3. **Given** el caso en < md, **When** se abre el sitio embebido, **Then** se muestra en una hoja a pantalla completa
   con "Cerrar" y "Abrir en una pestaña nueva".

---

### User Story 13 - Contacto (Priority: P3, fase 2)

En `< md`, los campos del formulario son de cristal, con etiqueta flotante y luz táctil al enfocar.

**Acceptance Scenarios**:

1. **Given** un campo vacío, **When** recibe el foco o se escribe, **Then** la etiqueta flota arriba sin perder su
   asociación con el campo, y el error se sigue anunciando como hoy.
2. **Given** sin JS, **When** se ve el formulario, **Then** las etiquetas se ven completas y el formulario envía igual.

---

### User Story 14 - Asistente, paleta y menú (Priority: P2, fase 2)

- En `< md`, la paleta y el asistente se abren como hojas de cristal casi a pantalla completa, y el teclado del
  sistema no tapa el campo (`visualViewport`).
- El menú hace entrar sus enlaces en cascada.

**Acceptance Scenarios**:

1. **Given** la paleta o el asistente en < md, **When** se abren, **Then** son hojas (US3), y el campo de texto queda
   visible sobre el teclado.
2. **Given** el menú, **When** se abre, **Then** los enlaces entran en cascada, con 30 a 40 ms entre cada uno y cristal
   `strong`. Con movimiento reducido, entran todos a la vez.

---

### User Story 15 - Blog (Priority: P3, la hace la 005)

Las tarjetas de post tienen portada y una leve profundidad. El índice "En este post" pasa a un botón flotante que abre
una hoja, y la barra de progreso se integra al header.

**Por qué en la 005**:

- La 005 es la dueña planeada de `components/blog/**` y de `app/[lang]/blog/**`, y rehace el índice, las tarjetas y la
  página del post.
- Hacerlo aquí abriría una lane sobre las mismas rutas que la 005 va a reescribir.
- La 006 deja listos los patrones (hoja, profundidad y barrido), y la 005 los adopta. Ver el plan, "Entrega a la 005".

---

### Edge Cases

- Rotar el teléfono con una hoja abierta: la hoja se reajusta a `100dvh` y no pierde el foco.
- Un deslizamiento diagonal en el mazo o la hoja: si el movimiento es más vertical que horizontal, gana el scroll de la
  página.
- La pantalla es corta (menos de 640 px de alto): la hoja del lóbulo hace scroll por dentro sin mover el mapa.
- Vibración bloqueada por el navegador o por el sistema: no hay errores.
- Alguien navega con teclado en un teléfono con teclado externo: el dock, el mapa y el mazo funcionan con Tab, flechas,
  Enter y Esc.
- Hay una tablet en horizontal con mouse: manda la media `(hover: hover) and (pointer: fine)` y no se activa la luz
  táctil.
- La intro de marca está activa: el dock aparece cuando la intro termina.
- Un toast mientras el dock está visible: el toast queda por encima del dock y no se tapan.

## Requirements *(mandatory)*

### Functional Requirements

#### Base móvil (M0, fase 1)

- **FR-601**: La luz del cristal MUST seguir al dedo en pantallas táctiles (`pointerdown` y `pointermove` con
  `pointerType: 'touch'`), escribiendo `--cw-mx` y `--cw-my` como hoy, y desvanecerse al soltar. Con movimiento
  reducido queda apagada (EM-01).
- **FR-602**: En `< md`, como máximo 3 superficies con `backdrop-filter` activo MUST estar visibles a la vez. Las demás
  usan el respaldo sólido con borde, grano y profundidad.
  - Los blur de `< md` bajan a `--cw-glass-standard-blur: 10px` y `--cw-glass-strong-blur: 16px`, a confirmar en el
    dispositivo (P-604).
  - Los valores de escritorio no cambian.
- **FR-603**: `BottomSheet` MUST:
  - abrirse como diálogo modal nativo, con agarradera y título;
  - cerrarse con arrastre, con Esc y con "Cerrar";
  - atrapar el foco y devolverlo al cerrar;
  - respetar `env(safe-area-inset-*)` y `100dvh`;
  - animarse solo con `transform` y `opacity`.
- **FR-604**: El barrido MUST usar `animation-timeline: view()` dentro de `@supports`, y un `IntersectionObserver` de una
  sola vez como respaldo.
- **FR-605**: La profundidad flotante MUST tener 2 o 3 niveles con 12 px de desfase máximo, usar solo `transform` y ser
  CSS-first con scroll-driven animations. Sin soporte, las tarjetas quedan quietas.
- **FR-606**: La háptica MUST llamar `navigator.vibrate(8)` solo si existe y no hay movimiento reducido, y nunca fallar si
  no está.
- **FR-607**: El dock MUST existir solo en `< md` con JS:
  - una píldora de cristal abajo al centro, con menú (`popover` del menú que ya existe), búsqueda y paleta
    (`cw:open-palette`), asistente (`cw:open-assistant`) y tema;
  - se esconde al bajar y vuelve al subir;
  - se oculta con el teclado del sistema o con una hoja abierta;
  - deja un espacio inferior para no tapar contenido.
- **FR-608**: Con el dock activo, el header MUST NOT repetir menú, paleta ni tema en `< md`, y el botón flotante del
  asistente MUST NOT mostrarse. El buzón se queda en el header (EM-05).
- **FR-609**: `FormField` MUST sumar una variante de etiqueta flotante, opcional, sin cambiar a los consumidores que no
  la piden.
- **FR-610**: Un gesto de deslizar MUST tener umbral y ganarle al scroll solo si es más horizontal que vertical.

#### Mapa compacto (P2, fase 1)

- **FR-620**: En `< md` con JS, "Lo que sé" MUST mostrar el mapa radial cuadrado con el núcleo y los 6 lóbulos de la 002
  (T229), sin scroll horizontal a 375 px. Cada lóbulo mide al menos 64 px de diámetro visual y 44 × 44 px de área
  táctil (EM-02).
- **FR-621**: Tocar un lóbulo MUST marcarlo con `aria-pressed`, aplicar la háptica y abrir una `BottomSheet` con el
  panel terminal y "Mis habilidades, en palabras" de ese lóbulo.
- **FR-622**: En la hoja, deslizar o pulsar "Anterior" y "Siguiente" MUST cambiar de lóbulo y actualizar el mapa de atrás.
- **FR-623**: La lluvia MUST volver en `< md`, acotada al mapa, con a lo sumo la mitad de columnas y 12 fps o menos, y
  pausada fuera de pantalla o con la pestaña oculta.
- **FR-624**: Con movimiento reducido, el mapa MUST verse estático (P-601). Sin JS, se ven los chips y las listas de hoy.

#### Páginas (fase 2)

- **FR-630** (P2): Bajo 992 px con JS, la carrera MUST ser un mazo en la mano (US8), con deslizar, toque para abrir en
  una hoja, botones anterior y siguiente, contador y la línea de tiempo como respaldo (EM-03). El corte en 992 px se
  confirma en P-602.
- **FR-631** (P2): En `< sm`, la barra de escenas MUST sumar el indicador de tres puntos (US9).
- **FR-632** (P2): En `< md`, las figuras MUST ser una cuadrícula 2×2 flotante con conteo, barrido y profundidad, y el
  retrato, un barrido al entrar.
- **FR-633** (P1): El banner del home MUST recibir luz táctil y un barrido inicial; "Ahora trabajo en", profundidad, y el
  indicador de scroll, un ciclo de respiración.
- **FR-634** (P3): En `< md`, Servicios MUST apilar sus 6 tarjetas como pila sticky, y girarlas con toque o con "Ver qué
  recibes".
- **FR-635** (P4): En `< md`, el carrusel MUST tener asomo, puntos y snap. Los filtros, chips sticky con conteo. La
  galería del caso se desliza, las tarjetas ADR se apilan y el embebido abre en una hoja a pantalla completa.
- **FR-636** (P5): En `< md`, los campos de Contacto MUST usar la variante de etiqueta flotante y la luz táctil al enfocar.
- **FR-637** (P6): En `< md`, la paleta y el asistente MUST abrirse como hojas casi a pantalla completa, con el campo
  visible sobre el teclado (`visualViewport`), y el menú MUST hacer entrar sus enlaces en cascada (30 a 40 ms).
- **FR-638** (005): Los requisitos del blog de US15 MUST pasar a la 005 como entrega explícita (ver el plan).

#### Transversales

- **FR-650**: Todo lo nuevo MUST apagarse con `prefers-reduced-motion: reduce`. La animación del fondo no se toca (D1).
- **FR-651**: Cada cambio MUST quedar dentro de `< md`, `(hover: none)` o `(pointer: coarse)`, salvo lo que la spec dice
  que aplica a todos. Las capturas de escritorio no cambian.
- **FR-652**: Todo gesto MUST tener un botón alternativo, y nada importante puede depender de hover. Los objetivos
  táctiles miden 44 × 44 px o más.
- **FR-653**: Las animaciones nuevas MUST usar solo `transform` y `opacity`. Las secciones fuera de pantalla pueden usar
  `content-visibility: auto` si no mueven el layout.
- **FR-654**: MUST NOT agregarse dependencias, servicios ni variables de entorno.
- **FR-655**: Todo texto visible nuevo (botones del dock, contador del mazo y etiquetas de la hoja) MUST existir en ES y
  EN.

### Key Entities

Sin entidades de datos nuevas. Los contratos de la base móvil (`BottomSheet`, `Dock`, ayudas de `lib/fx`, mixins y
tokens) se congelan en `contracts-m0.md` con el tag `m0-frozen`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-601**: 0 regresiones visuales en escritorio: capturas de 1280 y 1440 px iguales a las de la 004, salvo el dock, que
  no existe en escritorio.
- **SC-602**: En cada página a 375 px, 3 o menos superficies visibles con blur.
- **SC-603**: INP < 200 ms y CLS < 0,1 en un Android de gama media en home, "Sobre mí", Servicios y un caso.
- **SC-604**: A 375 px, el mapa completo se ve sin scroll horizontal y el panel de cualquier lóbulo se abre con 1 toque.
- **SC-605**: El 100 % de los objetivos táctiles nuevos mide 44 × 44 px o más.
- **SC-606**: El 100 % de las hojas abre y cierra con toque, teclado, Esc y arrastre, y devuelve el foco.
- **SC-607**: Con movimiento reducido, 0 animaciones nuevas en marcha (Playwright cuenta las animaciones activas).
- **SC-608**: El autor aprueba la fase 1 en su celular antes de que arranque la fase 2.

## Assumptions

- La 006 se construye sobre la rama `004-contenido-presente`. M0 arranca ya, porque P0 está congelada. Las tareas por
  página entran a cada lane P cuando cierra sus tareas de la 004.
- Las capturas de Playwright usan emulación móvil en Chromium (375, 390 y 412 px). Safari se cubre con la revisión del
  autor en su celular, salvo que P-603 apruebe agregar WebKit.
- El mazo cubre también tablets (de 768 a 991 px), porque hoy ese rango tampoco tiene cartas.
- Los valores de blur, umbrales y frecuencias son iniciales y se afinan con la vista previa de la fase 1.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-601 | Con movimiento reducido, en móvil, ¿mapa compacto estático (como en escritorio) o chips (como proponía el insumo)? | Mapa estático; los chips solo sin JS |
| P-602 | ¿El mazo en la mano arranca bajo 992 px (también en tablet) o solo bajo 768 px? | Bajo 992 px |
| P-603 | ¿Se agrega un proyecto WebKit a Playwright para Safari? Pide descargar el navegador de pruebas, no una dependencia | Solo Chromium, más la revisión en el celular del autor |
| P-604 | ¿Los blur móviles de 10 y 16 px se ven bien en el celular del autor? | 10 y 16 px, ajustables tras la vista previa de la fase 1 |
