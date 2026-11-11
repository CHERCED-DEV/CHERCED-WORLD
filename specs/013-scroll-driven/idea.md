# Idea: animaciones guiadas por scroll donde aportan (013)

**Pedido del autor (2026-11-11)**: vio las scroll-driven animations y le encantaron, como tendencia de animación y de
navegación de contenido. Quiere saber dónde generan valor real en el sitio, no ponerlas por ponerlas.

**Estado**: idea. La base técnica está en el [research](./research.md). No toca la 012 (Release 1) salvo que el
autor decida meter algo antes de publicar.

## Punto de partida

- **Soporte:** Baseline desde Firefox 159 (2026-10-27): Chrome/Edge 115+, Safari 26+ (también iOS) y Firefox 159+.
  Un iPhone en iOS 18 o un Firefox anterior ve el respaldo, que es la página de hoy.
- **El sitio ya las usa** en el barrido y la profundidad móviles (`glass-sweep`, `glass-float`), la deriva del
  retrato en "Quién soy", los pasos de Servicios en móvil y el recorrido de Synergos (barra, trazos y capítulos).
  La 013 completa; no introduce.
- **`ScrollProgress` no se reemplaza:** ya es CSS puro (`scroll(root)`), sin JavaScript. Lo que sí corre en JS es la
  barra del blog, los índices con IntersectionObserver, el FAB, el dock y la pila de Servicios.
- **El IntersectionObserver del índice de Sobre mí no se reemplaza:** pone `aria-current`, centra la píldora activa
  y colorea el punto actual. CSS no puede poner estado ARIA. Lo que se propone lo complementa.

## Criterios para entrar

1. Ayuda al visitante a orientarse o a recorrer contenido, o quita trabajo del hilo principal sin cambiar lo que ve.
2. Vive en un elemento que ya existe. No suma otro indicador donde ya hay uno (regla de "nada redundante").
3. Es CSS dentro de `@supports (animation-timeline: view()) and (animation-range: entry)` y de `site.js-motion`
   (movimiento permitido y JS presente). Sin soporte, sin JS o con movimiento reducido, la página queda como hoy.
4. Solo anima `transform`, `scale`, `translate` u `opacity`, que es lo que acepta la auditoría FR-653.
5. No cambia tamaños, no tapa CTA, no achica texto por debajo de 12 px ni objetivos por debajo de 44 px y no
   retiene el scroll.

## Candidatos, de más a menos valor por esfuerzo

| # | Candidato | Página | Valor | Esfuerzo | Frente al JS de hoy |
|---|---|---|---|---|---|
| C1 | El índice de escenas muestra cuánto falta de cada una | Sobre mí | Alto | Bajo-medio | Complementa el IO |
| C2 | El carrusel de proyectos gana profundidad al deslizar | Portafolio | Medio-alto | Bajo | Complementa; el índice y los puntos siguen en JS |
| C3 | La barra de lectura del blog pasa a CSS | Post del blog | Medio (técnico) | Medio | Reemplaza el JS cuando hay soporte; el JS queda de respaldo |
| C4 | La ruta de "Hacia dónde voy" se traza al llegar | Sobre mí | Medio | Bajo | Nuevo; R2.1 ya en `dev` (3bf0bd8) |
| C5 | Barra de lectura en los casos de estudio | Caso | Medio-bajo | Muy bajo | Nuevo; reutiliza `ScrollProgress` |
| C6 | Indicador continuo bajo el carrusel | Portafolio | Bajo-medio | Medio | Complementa los puntos |
| C7 | Bordes que se desvanecen en los rieles de filtros | Portafolio, blog | Bajo | Medio | Reemplazo parcial de `useRailOverflow` |

### C1 — El índice de escenas muestra cuánto falta de cada una

- **Dónde:** `/[lang]/aboutMe`. `components/site/about/SceneNav.tsx` (píldoras `.sceneLink` y puntos `.sceneDot`) y
  `components/site/about/About.module.scss`. Las escenas ya tienen `data-cw-scene` (`who`, `career`, `knowledge`,
  `heading`) y los enlaces `data-cw-scene-link`, así que puede hacerse solo con SCSS.
- **Qué aporta:** Sobre mí es la página más larga del sitio. El propio CSS estima sus escenas entre 640 y 1950 px de
  alto en el celular (3500 px la carrera sin JS). El índice dice dónde estás, pero no cuánto te queda de esa escena. Los puntos de la derecha se
  llaman "puntos de progreso" (FR-631) y hoy solo marcan la escena actual. Esta es la "navegación de contenido" que
  vio el autor, sin sumar nada nuevo a la pantalla.
- **Cómo se vería:**
  - **≥ sm:** dentro de la píldora activa, una línea de 2 px en `--cw-intro-accent` que se llena de izquierda a
    derecha mientras lees esa escena.
  - **< sm:** entre un punto y el siguiente, un hilo vertical de 2 px que baja a medida que avanzas. El rail de puntos
    se vuelve una barra de progreso por capítulos.
- **Cómo:** `timeline-scope` con los cuatro nombres en `.page`, `view-timeline` en cada escena con
  `view-timeline-inset: auto` (toma el `scroll-padding-top` que ya descuenta header e índice) y
  `animation-range: exit-crossing`. Un `::after` por píldora y por punto con `scaleX` o `scaleY`. La visibilidad de la
  línea en la píldora la decide el `aria-current` que ya pone el IO.
- **Qué no debe romper:**
  - El `aria-current`, el centrado de la píldora activa en anchos chicos, el color del punto actual y su
    ocultamiento sobre el pie.
  - Los 44 px de cada punto y la altura de la píldora.
  - `content-visibility: auto` de las escenas: el indicador vive fuera de ellas, en el índice. Ver research R-1306.
  - Las pruebas de `tests/e2e/p2/scenes-mobile.spec.ts`.
- **Detalle a resolver en la spec:** la última escena puede no llegar al 100 % porque la página se acaba antes de que
  su borde inferior cruce la línea de lectura. Hay dos salidas: otro final de rango solo para ella
  (`contain 100%`) o mostrar el llenado solo en los hilos de los puntos (el último punto no tiene hilo).
- **Coordinación:** la cuarta escena y el ajuste de `SceneNav.tsx` (centra el enlace activo en celular) ya están
  en `dev` (3bf0bd8, 2026-11-11). C1 parte de ese estado.

### C2 — El carrusel de proyectos gana profundidad al deslizar

- **Dónde:** `/[lang]/portfolio`. `components/site/portfolio/ProjectsExplorer.tsx` (pista `.track` con
  `scroll-snap-type: x mandatory`) y `components/site/portfolio/Portfolio.module.scss`. Solo CSS.
- **Qué aporta:** en el celular el carrusel deja ver el borde de las tarjetas vecinas, pero todas se ven iguales y no
  hay respuesta mientras el dedo arrastra: el índice cambia 120 ms después de asentarse. Con `view(inline)` la
  captura de la tarjeta que llega crece y se aclara durante el gesto, y la que sale se aleja. Es el patrón de
  scroll-snap con view timeline que se ve como tendencia, aplicado donde de verdad se navega contenido.
- **Cómo se vería:** solo la imagen (`.slideMedia`) pasa de `opacity` 0,55 y `scale` 0,92 en los bordes a 1 en el
  centro. El texto y el botón "Ver caso" no se animan.
- **Por qué solo la imagen:** los chips miden 12 px (`--cw-text-xs`). Escalar la tarjeta a 0,94 los dejaría en
  11,3 px. Bajar la opacidad del texto restaría contraste, y axe lo mide.
- **Qué no debe romper:**
  - El snap, los botones anterior y siguiente, el teclado y el anuncio `aria-live`.
  - La transición compartida de la imagen hacia el caso: al tocar, la tarjeta centrada está en 1.
  - La versión sin JS, donde la pista es una columna.
  - Ningún ancestro de `.slideMedia` hasta `.track` tiene `overflow: hidden`; si alguno lo gana, rompe `view()`.
    Ver research R-1303.
- **Decisión del autor:** el carrusel es una pieza aprobada. Propuesta: solo en `< md`, igual que el resto del
  movimiento de la 006. Necesita su visto bueno visual.

### C3 — La barra de lectura del blog pasa a CSS

- **Dónde:** `components/blog/ReadingProgress.tsx`, su `.module.scss` y `components/blog/PostView.module.scss`.
- **Qué aporta:** el visitante ve la misma barra. La diferencia es que hoy cada frame de scroll pasa por JS
  (`onScrollFrame`, que escribe `--cw-progress`), y con CSS corre en el compositor: no se atrasa mientras el hilo
  principal hidrata el MDX, el índice o el asistente. El blog y Synergos quedan con la misma técnica. Es el único
  candidato que reemplaza JS.
- **Cómo:**
  - `view-timeline` en el cuerpo (`[data-cw-post-body]`), con inset igual al alto del header y
    `animation-range: contain`. Es la misma fórmula de `lib/blog/progress.ts`, salvo en posts más cortos que la
    ventana, que hay que probar aparte.
  - El efecto de `ReadingProgress` devuelve sin escuchar el scroll cuando `CSS.supports(...)` es verdadero y no hay
    movimiento reducido, igual que hace `observeSweep` en `lib/fx/reveal.ts`.
- **Qué no debe romper:**
  - La posición: arriba en escritorio y bajo el header en móvil (T857).
  - El reinicio al navegar entre posts y el índice activo, que sigue en JS.
  - Con movimiento reducido, la barra del blog se mantiene como hoy, por el camino de JS (ver dudas).
- **Pruebas:** `tests/e2e/r4/post-reading.spec.ts` y `tests/e2e/q2/post.spec.ts` leen el atributo
  `data-cw-reading-progress`, que el camino CSS no actualiza. Hay que pasar a leer la escala calculada de la barra,
  que vale para los dos caminos.
- **Honestidad:** para el visitante con un teléfono rápido, la diferencia es casi invisible. Entra por coherencia y
  por quitar un listener de scroll, no por efecto.

### C4 — La ruta de "Hacia dónde voy" se traza al llegar

- **Dónde:** `components/site/about/HeadingScene.tsx` y `Heading.module.scss`, la escena de R2.1, ya integrada en
  `dev` (3bf0bd8) con el copy que aprobó el autor.
- **Qué aporta:** el mapa une el centro ("hoy") con las rutas mediante una columna y conectores. Si la columna baja
  y cada conector se extiende cuando el mapa entra en vista, la metáfora de "hacia dónde voy" se lee sola. Además
  reutiliza el lenguaje de trazos de Synergos.
- **Cómo:** `scaleY` en `.routes::before` y `scaleX` escalonado en `.route::before`, con `view()` y
  `animation-range: entry 20% cover 45%`. Sin soporte o con movimiento reducido, las líneas quedan completas como en
  el borrador.
- **Estado:** ya no espera a nadie. Si el autor prefiere valor visible a valor técnico, C4 reemplaza a C3 en la
  recomendación.

### C5 — Barra de lectura en los casos de estudio

- **Dónde:** `components/site/portfolio/CaseStudy.tsx`, reutilizando `components/site/synergos/ScrollProgress.tsx`.
- **Qué aporta:** los casos son largos (héroe, aspectos destacados, demo, diagrama, stack y secciones). A un
  reclutador le dice cuánto le falta. Cuesta una línea y ya tiene prueba en Synergos.
- **Riesgo:** sería la tercera barra con estilo distinto (Synergos 3 px arriba; blog 2 px con degradado y bajo el
  header en móvil). Solo tiene sentido si antes se unifica el estilo, y si el autor quiere barra en los casos.

### C6 — Indicador continuo bajo el carrusel

- **Dónde:** los puntos `.dots` de `ProjectsExplorer.tsx`.
- **Qué aporta:** una marca que viaja sobre los puntos siguiendo el dedo, con `scroll-timeline` en `.track` y
  `timeline-scope`. Hoy el punto activo salta al asentarse.
- **Por qué abajo:** necesita pasar el total de tarjetas visibles como variable (cambia con los filtros) y se solapa
  con C2, que ya da respuesta durante el gesto. Sería un segundo efecto en el mismo componente.

### C7 — Bordes que se desvanecen en los rieles de filtros

- **Dónde:** `components/site/portfolio/useRailOverflow.ts` y los degradados de `.rail`. Igual para
  `components/blog/index/TagFilter.module.scss`.
- **Por qué abajo:** las flechas también dependen de ese estado (`hidden`), así que el JS no se va. La ganancia es
  mínima.

## Recomendación para la spec 013

Llevar **C1, C2 y C3**, en ese orden:

1. **C1** es el que más ayuda a recorrer contenido, en la página más larga, sin agregar nada a la pantalla.
2. **C2** es la tendencia de "navegar contenido" donde de verdad se navega, y es CSS acotado a una imagen.
3. **C3** quita el único listener de scroll que pinta algo en cada frame y deja una sola técnica para las barras.
   Si el autor prefiere algo que se vea, se cambia por **C4** (R2.1 ya está en `dev`).

Orden de trabajo: primero C2 y C3, que no tocan Sobre mí. C1 parte del commit de R2.1 (3bf0bd8). Pruebas como se describen
en el research R-1308, sin correr suites globales sin motivo.

## Descartes y por qué

- **Revelar texto al entrar con `view()` en lugar de `Reveal`:** se revierte al subir y deja texto medio transparente
  si el visitante se detiene, lo que choca con FR-1108 ("sin contenido oculto"). Lo correcto es scroll-triggered,
  que solo tiene Chromium (Chrome 146). Se revisa cuando lo tengan Safari y Firefox.
- **Más parallax:** ya existen `glass-float` y la deriva del retrato. El fondo y la intro no se tocan. Más
  desplazamiento suma riesgo vestibular sin informar nada.
- **Cabecera que se compacta:** el header está aprobado y su alto es layout. Encogerlo con `transform` dejaría un
  hueco o taparía contenido.
- **FAB compacto y dock que se esconde con CSS:** no son animaciones de scroll sino scroll-state queries, que solo
  tiene Chromium (desde Chrome 133). Hoy funcionan bien con JS.
- **Scroll-spy en CSS (`scroll-target-group`) para los índices y el TOC:** solo Chromium, y no pone `aria-current`.
  Se queda el IO.
- **Pila de tarjetas de Servicios con `view()`:** es pieza aprobada de la 006, y el JS además reparte el blur
  (presupuesto de 3 superficies). Reescribirla arriesga regresiones sin cambio visible.
- **Línea de tiempo de la carrera que se dibuja:** esa línea solo se muestra sin JS o con movimiento reducido,
  justo donde la animación está apagada. No tendría público.
- **Cifras que cuentan con el scroll:** retroceden al subir, confunden, y animar `counter()` repinta en el hilo
  principal. `CountUp` se queda.
- **Héroe del Home que se desvanece al bajar:** sección aprobada, convive con la intro y con la entrada para
  reclutadores. No aporta orientación.
- **Más efectos en Synergos:** ya tiene su recorrido y espera la revisión T1108. Nota para esa revisión: el trazo
  anima `stroke-dashoffset`, fuera de la regla FR-653 (ver research R-1304).
- **Barra de lectura de página entera en Sobre mí:** con `content-visibility: auto` la altura cambia al pintarse
  cada escena y la barra saltaría. Además duplicaría el índice. C1 cubre esa necesidad.

## Dudas para el autor

1. ¿La 013 entra antes del Release 1 o después? Recomiendo después: el release ya tiene su lista y esto es
   enriquecimiento.
2. **C1:** ¿la línea solo en la píldora activa, o también las escenas ya leídas quedan llenas, como capítulos
   completados? ¿El hilo entre los puntos del celular le gusta?
3. **C2:** ¿se puede tocar el carrusel aprobado, solo en la imagen y solo en el celular?
4. **C3:** con movimiento reducido, la barra del blog hoy sigue visible y la de Synergos se oculta. ¿Cuál regla
   queda para las dos? ¿Se unifica también su aspecto (alto, color y posición en móvil)?
5. **C5:** ¿quiere barra de lectura en los casos de estudio?
6. **Pruebas en Firefox:** ¿se descarga Firefox para Playwright, para probar el respaldo sin soporte? El de la
   versión instalada es el 157, anterior a la activación por defecto.
