# Research 013: animaciones guiadas por scroll (scroll-driven animations)

Investigación del 2026-11-11 para la [idea](./idea.md). Fuentes consultadas ese día; cada dato de soporte lleva su
enlace y su fecha. Lo que es inferencia propia se marca como tal.

## Resumen

- **Ya es Baseline.** Con Firefox 159 (2026-10-27), las scroll-driven animations funcionan en Chrome/Edge 115+,
  Safari 26+ (macOS, iOS, iPadOS) y Firefox 159+. web.dev las declaró "Baseline Newly available" el 2026-10-29.
  "Newly" no es "Widely": quien tenga un iPhone en iOS 18 o un Firefox anterior no las ve. `@supports` sigue siendo
  obligatorio.
- **El sitio ya las usa en cinco piezas**, más una que las anula a propósito (inventario al final). La 013 no las
  "introduce": completa donde falta.
- **`ScrollProgress` no es JavaScript.** Es un `div` que anima `scroll(root)` desde CSS
  (`components/site/synergos/ScrollJourney.module.scss`). Lo que sí escucha el scroll en JS es la barra del blog,
  los índices (IntersectionObserver), el FAB, el dock y la pila de Servicios.
- **Trampa propia del proyecto:** el reset global de movimiento reducido (`animation-duration: 0.01ms !important` en
  `styles/globals.scss`) **no** apaga una animación ligada al scroll. Cada regla nueva debe ir dentro de
  `@media (prefers-reduced-motion: no-preference)` (mixins `site.motion-ok` o `site.js-motion`), como ya hacen las
  existentes.

## R-1301 Qué es

Una animación CSS o WAAPI normal avanza con el tiempo (`DocumentTimeline`). Una scroll-driven animation avanza con
una **línea de tiempo de progreso**:

| Línea de tiempo | CSS anónimo | CSS con nombre | JS | Progreso 0 → 100 % |
|---|---|---|---|---|
| Scroll progress | `animation-timeline: scroll(root block)` | `scroll-timeline: --x block` | `new ScrollTimeline({ source, axis })` | De arriba abajo del scroller |
| View progress | `animation-timeline: view(block)` | `view-timeline: --x block` | `new ViewTimeline({ subject, axis, inset })` | Mientras el elemento cruza el scrollport |

Piezas que importan para este sitio:

- **`animation-range`** recorta el tramo de la línea de tiempo. En una `view()` hay rangos con nombre:
  `cover` (todo el cruce), `contain` (totalmente visible, o cubriendo todo si es más alto que la ventana), `entry`,
  `exit`, `entry-crossing` y `exit-crossing` (cuando cruza el borde final o el inicial). También se pueden usar en los
  `@keyframes` (`entry 0% { … }`).
- **`view-timeline-inset`** mueve los bordes del scrollport. Con `auto` usa el `scroll-padding` del scroller, que en
  Sobre mí ya descuenta el header y el índice fijo.
- **`timeline-scope`** en un ancestro común deja que un elemento que no es descendiente del sujeto use su línea de
  tiempo con nombre (por ejemplo, un enlace del índice que sigue a una sección). Es Baseline 2026 según MDN.
- **Duración:** una animación de scroll no mide tiempo. `animation-duration` queda en `auto`; si se le da un tiempo,
  la especificación lo convierte en proporción de la línea de tiempo (Web Animations 2, "time-based to
  proportional"). Por eso `0.01ms` no la desactiva. Es lectura de la especificación, no lo medí; la prueba FR-650
  lo detectaría porque cuenta esas animaciones como activas.
- **API JS:** `element.animate(keyframes, { timeline: new ViewTimeline({ subject }), rangeStart: 'entry 25%',
  rangeEnd: 'cover 50%' })`. Para este sitio no hace falta: todo lo propuesto es CSS. Sí sirve en las pruebas para
  leer `document.getAnimations()` y su `timeline`.

**No confundir con** (todas solo en Chromium a la fecha):

- **Scroll-triggered animations** (`timeline-trigger`, `animation-trigger`, `trigger-scope`): disparan una animación
  por tiempo al cruzar un punto del scroll. Salieron en Chrome 146 (2026-03-10). Son la herramienta correcta para un
  "revelar al entrar" puro CSS, pero sin Safari ni Firefox.
- **Scroll-state container queries** (`@container scroll-state(stuck|snapped|scrollable)`): Chrome 133+.
- **CSS scroll-spy** (`scroll-target-group`, `:target-current`): Chrome 140/142+.

## R-1302 Soporte a 2026-11-11

| Motor y plataforma | Desde | Fecha | Fuente |
|---|---|---|---|
| Chrome y Edge (escritorio y Android) | 115 | jul 2023 | [caniuse](https://caniuse.com/wf-scroll-driven-animations), [Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) |
| Samsung Internet | 23 | — | [caniuse](https://caniuse.com/wf-scroll-driven-animations) |
| Safari macOS, iOS, iPadOS, visionOS | 26.0 | sep 2025 | [WebKit, Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) |
| Safari: animaciones en hilo aparte (compositor) | 26.4 | 2026-03-24 | [WebKit, Safari 26.4](https://webkit.org/?p=17862) |
| Safari: correcciones de progreso, pausa y bfcache | 26.5 | 2026-05-11 | [WebKit, Safari 26.5](https://webkit.org/?p=17938) |
| Firefox escritorio | 159 | 2026-10-27 | [MDN, Firefox 159](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/159), [Intent to Ship](https://groups.google.com/a/mozilla.org/g/dev-platform/c/uLZPrpA5Ic0) |
| Firefox Android | 160 según caniuse | — | [caniuse](https://caniuse.com/wf-scroll-driven-animations) |
| Estado Baseline | Newly available | 2026-10-29 | [web.dev, octubre 2026](https://web.dev/blog/web-platform-10-2026) |
| `timeline-scope` | Baseline 2026 | oct 2026 | [MDN timeline-scope](https://developer.mozilla.org/en-US/docs/Web/CSS/timeline-scope) |

Cobertura global según caniuse: 89,12 %.

Lo que esto significa aquí:

- **iPhone:** todos los navegadores de iOS usan el WebKit del sistema. El soporte depende de la versión de iOS, no
  de si el visitante abre Safari o Chrome. iOS 26+ lo tiene; iOS 18 o anterior ve el respaldo.
- **Firefox Android 160:** inferencia propia: con el ciclo de 4 semanas, la 160 no ha llegado al canal estable a la
  fecha de esta investigación. Hasta entonces, Firefox en Android ve el respaldo.
- **Firefox recién lo activó.** El Intent to Ship (2026-09-25) no lista limitaciones, pero es una implementación con
  dos semanas en estable. Hay que probar en Firefox antes de dar por bueno cualquier efecto.

## R-1303 Errores conocidos y matices por motor

**WebKit (Safari y todo iOS):**

| Bug | Qué pasaba | Estado |
|---|---|---|
| [302870](https://bugs.webkit.org/show_bug.cgi?id=302870) | En el camino con hilos, una barra de progreso se quedaba en 100 % al volver a subir | Corregido 2025-11-21, antes de salir en 26.4 |
| [304189](https://bugs.webkit.org/show_bug.cgi?id=304189) | En iOS las animaciones iban a 60 Hz y el scroll a 120 Hz: se desfasaban | Corregido 2025-12-17 |
| Notas de [Safari 26.5](https://webkit.org/?p=17938) | Progreso incorrecto de `view()` cerca de 0 % y 100 %; rango `scroll` roto; `animation-play-state: paused` ignorado; líneas de tiempo que no se restauraban al volver desde la bfcache | Corregido en 26.5. iOS 26.0 a 26.4 todavía los tiene |
| [327193](https://bugs.webkit.org/show_bug.cgi?id=327193) | En Safari 27 (iOS y macOS), un keyframe `translate: none` sobre un elemento con `translate` base se dibuja como el valor base: el elemento no se mueve. `getComputedStyle` y `getAnimations()` dicen lo correcto; solo falla lo pintado | Corrección en WebKit el 2026-10-23; puede no estar aún en Safari estable. Evitarlo: terminar en `translate: 0 0`, no en `none` |

Lección para las pruebas: en WebKit, leer el estilo calculado no basta; hace falta una captura.

**Chromium:** implementación madura desde 2023. Su
[caso de estudio de rendimiento](https://developer.chrome.com/blog/scroll-animation-performance-case-study) muestra
que la versión CSS de una barra sigue respondiendo con el hilo principal saturado, mientras la versión con JS se
traba.

**Trampas comunes a todos:**

- **`overflow: hidden` crea un scroll container.** Un `scroll()` o `view()` anónimo busca el scroller más cercano y
  se engancha a ese ancestro en vez de a la página o al carrusel. La solución es `overflow: clip`
  ([Bramus, 2024-02-14](https://www.bram.us/2024/02/14/scroll-driven-animations-you-want-overflow-clip-not-overflow-hidden/)).
  En este sitio importa en `.sceneList` (es scroller horizontal) y en cualquier tarjeta con `overflow: hidden`. Las
  líneas de tiempo **con nombre** no tienen este problema: se resuelven por el árbol y `timeline-scope`.
- **El shorthand `animation` reinicia `animation-timeline` a `auto`.** `animation-timeline` y `animation-range` van
  siempre después del shorthand ([Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)).
- **`display: none` en el sujeto deja la línea de tiempo inactiva**: la animación no aplica y se ve el estilo base.
- **Detección:** Chrome recomienda `@supports (animation-timeline: view()) and (animation-range: entry)` para
  descartar soportes parciales
  ([guía de efectos de entrada y salida](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/scroll-entry-exit-effects)).
  Synergos ya lo hace así; `glass-sweep` y `glass-float` solo preguntan por `view()`.
- **CSS Modules:** las clases y los `@keyframes` se renombran; los nombres `--x` de línea de tiempo deberían quedar
  intactos, pero hoy cada nombre se define y se usa en el mismo archivo (Synergos) o en un parcial global
  (`--cw-sweep`). Si una línea de tiempo cruza dos módulos, hay que comprobar en el CSS compilado que el nombre no
  cambió, o dejar definición y uso en el mismo módulo.
- **El polyfill de flackr no se usa:** sería una dependencia y la propia guía de Chrome lo desaconseja.

## R-1304 Rendimiento

- **Compositor.** Chrome y Safari (desde 26.4) actualizan en un hilo aparte las animaciones de scroll que solo tocan
  propiedades elegibles. La lista de WebKit
  ([Safari Technology Preview 234](https://webkit.org/?p=17674)): `opacity`, `transform`, `translate`, `scale`,
  `rotate`, `filter`, `backdrop-filter` y Motion Path. Así siguen fluidas aunque el hilo principal esté ocupado
  ([Safari 26.4](https://webkit.org/?p=17862)).
- **`clip-path` y `stroke-dashoffset` no están en esa lista**: repintan en el hilo principal en cada frame de scroll.
  La auditoría propia del proyecto es más estricta que la regla del pedido: `tests/e2e/integration/support/motion-audit.ts`
  (FR-653) solo acepta en keyframes `transform`, `opacity`, `translate`, `scale` y `rotate`; `clip-path` cuenta como
  pesado. Recomendación: usar solo esa familia.
- **Desviación existente:** el `@keyframes trace` de Synergos anima `stroke-dashoffset`. Son SVG pequeños y no
  entran en `MOTION_PAGES`, así que la auditoría no lo ve. Se anota para la revisión T1108; la 013 no lo toca.
- **`filter` y `backdrop-filter`** son elegibles en Safari, pero aquí no se animan: el móvil tiene un presupuesto de
  3 superficies con blur (FR-602).
- **Barras:** `transform: scaleX()` con `transform-origin` izquierdo, nunca `width`.
- **Menos JS en el scroll:** la barra del blog (`components/blog/ReadingProgress.tsx`) recalcula en `rAF` y escribe
  una variable CSS por frame. Con CSS ese trabajo desaparece del hilo principal. Es la única ganancia de rendimiento
  medible entre los candidatos; el resto ya era CSS o es nuevo.

## R-1305 Accesibilidad y reglas del sitio

- **Movimiento reducido.** Ver el resumen: cada animación de scroll va dentro de `no-preference`. La prueba FR-650
  (`tests/e2e/integration/mobile-patterns.spec.ts`) debería detectarlo: `runningMotions()` toma toda animación en
  `running` con `activeDuration` distinto de `0`, y en una animación de scroll ese valor es un porcentaje. Conviene
  confirmarlo con una prueba explícita. Con `reduce`, la página queda como hoy.
- **Sin contenido oculto (FR-1108).** Nada de "aparece desde opacidad 0" atado al scroll en texto. Si el visitante se
  detiene a mitad del rango, el texto queda medio transparente; al subir, se vuelve a ocultar. Los revelados del sitio
  son de una vez con IntersectionObserver (`components/ui/Reveal.tsx`) y así deben seguir.
- **Sin scroll-jacking.** Una animación de scroll no cambia la velocidad ni la posición del scroll. El riesgo real
  es otro: secciones "pegajosas" de 300 vh que obligan a scrollear para ver una animación. No se propone ninguna.
- **Estado y ARIA.** Los indicadores van `aria-hidden`. El estado (`aria-current`) lo sigue poniendo JS; CSS no
  puede cambiar ARIA.
- **Contraste y tamaño.** Bajar la `opacity` de un texto baja su contraste (axe lo mide); un `scale` menor que 1 en
  una tarjeta con texto de 12 px (`--cw-text-xs`) lo deja por debajo de 12 px. En tarjetas, animar la imagen y no el
  texto.
- **Objetivos de 44 px y CTA.** Un `transform` no cambia el área de layout, pero sí la de impacto. Nada de lo
  propuesto escala controles ni se pone encima de un CTA.

## R-1306 CLS y `content-visibility: auto`

- **CLS:** `transform` y `opacity` no producen layout shifts. Las escenas tampoco cambian de tamaño por la animación.
- **Las escenas de Sobre mí** (`.scene` en `components/site/about/About.module.scss`) usan `content-visibility: auto`
  con tamaños estimados: 1200 px por defecto, carrera 3500/2600/700/640 px y conocimiento 1950/980 px según el ancho.
  Consecuencias:
  1. **`scroll(root)` en Sobre mí se movería sola.** La altura total cambia cuando cada escena se pinta y reemplaza
     su estimado. Una barra de progreso de página retrocedería o saltaría. Mejor una `view()` por escena.
  2. **La `view()` de la propia sección funciona**: el elemento con `content-visibility` sí tiene caja; lo que se
     salta es su contenido. Su largo pasa del estimado al real la primera vez que se pinta y luego queda recordado
     (`contain-intrinsic-size: auto …`).
  3. **Lo animado dentro de una escena saltada no se actualiza** hasta que se pinta (prueba WPT
     [content-visibility-animation-with-scroll-timeline-in-auto-subtree](https://searchfox.org/firefox-main/source/testing/web-platform/tests/css/css-contain/content-visibility/content-visibility-animation-with-scroll-timeline-in-auto-subtree.html)).
     No se nota porque el navegador pinta la escena antes de que entre en pantalla, pero por eso los indicadores
     deben vivir fuera de la escena (en el índice), no dentro.
  4. **Saltar con el índice** (`scrollIntoView`) deja escenas intermedias sin pintar, con su estimado. Sus
     indicadores se corrigen solos cuando el visitante pasa por ellas.
- **Sin JS** las escenas usan `content-visibility: visible`. La regla del pedido pide que sin JS todo quede como hoy:
  los efectos nuevos se envuelven en `site.js-motion`, que exige `:root[data-js]`.

## R-1307 Patrones y si encajan aquí

| Patrón | Técnica | ¿Ya existe en el sitio? | Encaje |
|---|---|---|---|
| Barra de progreso de lectura | `scroll(root)` o `view-timeline` sobre el cuerpo con `contain` | Synergos (CSS); blog (JS); casos no | Unificar en CSS; ver candidatos C3 y C5 |
| Progreso por capítulo en un índice | `view-timeline` por sección + `timeline-scope` | Subrayado de capítulos en Synergos; el índice de Sobre mí no | Alto: candidato C1 |
| Revelado al entrar | `view()` + `animation-range: entry` | Barrido móvil (`glass-sweep`); `Reveal` con IO | No: lo correcto es scroll-triggered, solo Chromium |
| Parallax sutil | `view()` + `translate` | `glass-float` (móvil), deriva del retrato | Ya cubierto |
| Trazo que se dibuja | `view()` + `scale` o `stroke-dashoffset` | Línea de ensamblaje de Synergos; pasos de Servicios (móvil) | Solo en "Hacia dónde voy" si se aprueba: C4 |
| Cabecera que se compacta | `scroll(root)` + `animation-range: 0 200px` | No | No: header aprobado y su alto es layout |
| Carrusel con scroll-snap + `view(inline)` | `view(inline)` en cada tarjeta | Carrusel de proyectos sin efecto | Medio-alto: C2 |
| Bordes que se desvanecen en rieles | `scroll(self inline)` + `timeline-scope` | Filtros de proyectos con JS (`useRailOverflow`) | Bajo: C7 |
| Tarjetas apiladas | `view()` + `scale` en `position: sticky` | Servicios en móvil con JS (`stack.ts`) | No: el JS también reparte el blur |

Esqueletos (ilustrativos, no son el diseño final):

```scss
// Barra de lectura con view-timeline: 0 % cuando el cuerpo pasa bajo el header, 100 % al terminarlo
@supports (animation-timeline: view()) and (animation-range: contain) {
  @media (prefers-reduced-motion: no-preference) {
    .post { timeline-scope: --cw-post-body; }
    .body { view-timeline: --cw-post-body block; view-timeline-inset: var(--cw-header-h) 0; }
    .progress {
      animation: cw-read linear both;
      animation-timeline: --cw-post-body;
      animation-range: contain 0% contain 100%;
    }
  }
}

// Progreso de una sección en un indicador que vive fuera de ella
.page { timeline-scope: --cw-scene-career; }
.page [data-cw-scene='career'] { view-timeline: --cw-scene-career block; view-timeline-inset: auto 0; }
.sceneLink[data-cw-scene-link='scene-career']::after {
  animation: cw-fill-x linear both;
  animation-timeline: --cw-scene-career;
  animation-range: exit-crossing 0% exit-crossing 100%;
}

// Carrusel: la imagen gana presencia al centrarse
.slideMedia {
  animation: cw-focus linear both;
  animation-timeline: view(inline);
  animation-range: cover 0% cover 100%;
}
@keyframes cw-focus {
  0%, 100% { opacity: 0.55; scale: 0.92; }
  35%, 65% { opacity: 1; scale: 1; }
}
```

`exit-crossing` va de "el borde superior de la sección cruza la línea de lectura" a "su borde inferior la cruza".
Con `view-timeline-inset: auto` esa línea es el `scroll-padding-top` que Sobre mí ya define para el header y el
índice. No verifiqué que WebKit y Firefox resuelvan `auto` igual que Chrome. Si no lo hacen, se usa el mismo `calc`
explícito del `scroll-padding-top`.

## R-1308 Cómo probarlo con Playwright

**Lo instalado** (`@playwright/test` 1.64.1): Chromium 156 y WebKit 27.2. Firefox no está instalado; el de 1.64.1
sería el 157, anterior a la activación por defecto, así que serviría para probar el respaldo. Otra vía es forzar la
falta de soporte con `launchOptions.firefoxUserPrefs: { 'layout.css.scroll-driven-animations.enabled': false }`.
Instalarlo es una descarga y la decide el autor. El build de WebKit en Windows no es Safari de iPhone: cada prueba
pregunta primero `CSS.supports(...)` y se salta con anotación si no hay soporte.

**Cómo leer el progreso:**

```ts
const progress = (page: Page, selector: string, pseudo = '::after') =>
  page.locator(selector).evaluate((node, pseudo) => {
    const matrix = new DOMMatrix(getComputedStyle(node, pseudo).transform)
    return { x: matrix.a, y: matrix.d }
  }, pseudo)

await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
await expect.poll(() => progress(page, '[data-cw-scene-dot="scene-career"]').then((p) => p.y)).toBeGreaterThan(0.3)
```

- `behavior: 'instant'` es obligatorio: `html` tiene `scroll-behavior: smooth`.
- También sirve `document.getAnimations()` filtrando por `animation.timeline instanceof ViewTimeline` y leyendo
  `animation.effect.getComputedTiming().progress`. Las animaciones de pseudo-elementos aparecen con
  `effect.pseudoElement`.

**Qué verificar en cada candidato:**

1. **Avanza y es monótono:** tres o cuatro posiciones de scroll, progreso creciente, y 1 al pasar el final.
2. **Movimiento reducido:** `page.emulateMedia({ reducedMotion: 'reduce' })` → ninguna animación con
   `ScrollTimeline` o `ViewTimeline`, y la auditoría FR-650 sigue en verde.
3. **Sin JS:** el proyecto `no-js` ya existe; el indicador no anima y la página se ve como hoy.
4. **Solo propiedades del compositor:** sumar los selectores nuevos a `MOBILE_006` en `motion-audit.ts` para que
   FR-653 los cubra.
5. **CLS:** `PerformanceObserver` de `layout-shift` con `buffered: true` mientras se recorre la página con
   `scrollThrough` (`tests/e2e/integration/support/mobile.ts`); el presupuesto del proyecto es 0,1.
6. **CTA libres:** `document.elementFromPoint` en el centro de cada CTA devuelve el CTA.
7. **WebKit:** capturas en tres posiciones, por el bug 327193 (estilo correcto, pintura incorrecta).
8. **`content-visibility`:** recorrer la página paso a paso con `scrollThrough`, no saltar al final, para que las
   escenas se pinten como las ve el visitante.
9. **Pruebas unitarias del SCSS** (como `tests/unit/m0/styles.test.ts`): que cada regla nueva esté dentro de
   `@supports` y de `no-preference`, y que sus keyframes solo toquen `transform`, `scale`, `translate` u `opacity`.

**Lo que Playwright no cubre:** la barra dinámica de Safari en iPhone (cambia el alto del scrollport mientras se
scrollea) y los 120 Hz. Eso lo revisa el autor en su teléfono, como en R1.3 de la 012.

## R-1309 Inventario: lo que ya existe en el repo

| Dónde | Qué hace | Línea de tiempo | Respaldo |
|---|---|---|---|
| `styles/_glass.scss` `glass-sweep` | Barrido de luz en tarjetas de cristal, solo `< md` | `view-timeline: --cw-sweep`, `entry 10% cover 55%` | IO de una vez (`lib/fx/reveal.ts`, `observeSweep`) |
| `styles/_glass.scss` `glass-float` | Profundidad: `translate` de ±n px, solo `< md` | `view()`, `cover` | Quieta |
| `components/site/about/About.module.scss` `.vitrine` | Deriva del retrato en "Quién soy" | `view()`, `cover 40% cover 100%` | Quieta |
| `components/site/services/Services.module.scss` `.stepGlow`, `.stepFill` | Los pasos del proceso se encienden y la línea se llena, solo `< md` | `view(block 0% 44%)`, `entry` | Encendido de una vez con IO |
| `components/site/HomeBanner.module.scss` | Anula el barrido por scroll en el banner del Home y lo dispara por tiempo después de la intro | — | — |
| `components/site/synergos/ScrollJourney.module.scss` | Barra de lectura, trazo de la línea de ensamblaje y subrayado de capítulos en `/synergos` y `/synergos/arquitectura` | `scroll(root block)`, `--synergos-stage`, `--synergos-chapter` | Oculto |

Lo que hoy usa JS o IntersectionObserver ligado al scroll: `SceneNav.tsx` (escena actual y pie),
`synergos/arquitectura/ChapterNav.tsx`, `blog/Toc.tsx` y `TocSheet.tsx` (encabezado activo), `blog/ReadingProgress.tsx`,
`experience/ExperienceClient.tsx` (FAB compacto tras 160 px), `lib/fx/viewport.ts` (dirección del scroll para el
dock), `services/stack.ts` (pila de tarjetas), `portfolio/ProjectsExplorer.tsx` (índice del carrusel al asentarse),
`portfolio/useRailOverflow.ts`, `portfolio/LiveDiagram.tsx`, `ui/Reveal.tsx`, `about/BrainMap.tsx`, `about/rain.ts`,
`motion/Background.tsx` y `about/CountUp.tsx`.

## Fuentes (consultadas el 2026-11-11)

- MDN, [Firefox 159 for developers](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/159) (salida 2026-10-27).
- Mozilla dev-platform, [Intent to Ship: Scroll-driven Animations](https://groups.google.com/a/mozilla.org/g/dev-platform/c/uLZPrpA5Ic0) (2026-09-25).
- web.dev, [New to the web platform in October](https://web.dev/blog/web-platform-10-2026) (2026-10-29).
- caniuse, [Scroll-driven animations](https://caniuse.com/wf-scroll-driven-animations).
- MDN, [timeline-scope](https://developer.mozilla.org/en-US/docs/Web/CSS/timeline-scope) y
  [guía de líneas de tiempo](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timelines).
- WebKit, [Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/),
  [Safari 26.4](https://webkit.org/?p=17862) (2026-03-24), [Safari 26.5](https://webkit.org/?p=17938) (2026-05-11),
  [Safari Technology Preview 234](https://webkit.org/?p=17674) (2025-12-19) y
  [A guide to Scroll-driven Animations with just CSS](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/).
- WebKit Bugzilla: [302870](https://bugs.webkit.org/show_bug.cgi?id=302870),
  [304189](https://bugs.webkit.org/show_bug.cgi?id=304189), [327193](https://bugs.webkit.org/show_bug.cgi?id=327193).
- Chrome for Developers: [Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
  (Bramus, 2023-05-05), [caso de estudio de rendimiento](https://developer.chrome.com/blog/scroll-animation-performance-case-study),
  [efectos de entrada y salida](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/scroll-entry-exit-effects),
  [scroll-triggered animations](https://developer.chrome.com/blog/scroll-triggered-animations),
  [Chrome 146](https://developer.chrome.com/release-notes/146) (2026-03-10) y
  [scroll-state queries](https://developer.chrome.com/blog/css-scroll-state-queries).
- Bramus, [You want overflow: clip, not overflow: hidden](https://www.bram.us/2024/02/14/scroll-driven-animations-you-want-overflow-clip-not-overflow-hidden/)
  y [demos](https://scroll-driven-animations.style).
- CSSWG: [Scroll-driven Animations](https://drafts.csswg.org/scroll-animations-1/) y
  [Web Animations 2](https://drafts.csswg.org/web-animations-2/) (conversión de duraciones a proporciones).
- MDN, [scroll-target-group](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-target-group).
