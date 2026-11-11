# 013 — Segunda opinión independiente

**Quién y cuándo.** La sesión hija de investigación, el 2026-11-11, a pedido de la sesión principal.

**Qué revisé.**
- [`research.md`](./research.md) e [`idea.md`](./idea.md) tal como están en `dev` en `b53e9cd`, ya con las respuestas
  del autor de ese día.
- Esta sesión hizo antes su propia investigación en paralelo. Lo que aporta va aquí; el resto coincidía con lo que ya
  está en `dev`.

**Cómo lo comprobé.**
- Sobre la vista previa de `4a81d80`, que ya tiene la cuarta escena: `https://cherced-world-my8l9ghb9-cherceddevs-projects.vercel.app`.
- Inyecté en la página el CSS de los esqueletos de la propia research (C1, C2 y C4) y leí el progreso real con
  `getAnimations()`.
- Playwright 1.64.1 con Chromium y WebKit, a 375×812 y 1440×900.
- Los scripts corrieron desde una carpeta temporal fuera del repo. Solo se cargó el paquete `playwright` ya instalado;
  nada corrió en el checkout principal ni escribió en él.
- **Firefox no se probó**, ni aquí ni en `dev`.

Los scripts y las capturas están en [`segunda-opinion/`](./segunda-opinion/).

---

## 1. Lo que cambia la recomendación

1. **C1 sí, pero con `animation-range: contain`, no `exit-crossing`.**
   - Con `exit-crossing`, la última escena («Hacia dónde voy») nunca se llena: al final de la página queda en **0,84 a
     1440** y en 0,98 a 375, en los dos motores.
   - Con `contain 0% contain 100%` (o solo `contain`), las cuatro escenas llegan a 1, en Chromium y WebKit, a 375 y a
     1440. Además es la misma fórmula de la barra de lectura.
   - Respuesta a la duda 2 del autor: que **las escenas ya leídas queden llenas**. Sale gratis con `fill-mode: both` y
     no exige estado nuevo. Sección 3.1.
2. **C4 sí, pero sin borrar las líneas que hoy se ven.**
   - Tal como está esbozado (`scale` de 0 a 1 sobre la columna y los conectores actuales), en el celular las líneas
     desaparecen hasta que se scrollea bastante. Con el mapa al 55 % de la ventana, la columna va en 15 % y tres de
     cuatro conectores en 0–5 %. La ruta se ve suelta
     ([captura](./segunda-opinion/evidencia/c4-375-webkit-mapa-al-55.png)).
   - Propuesta: dejar la línea actual como base fija, trazar encima una línea acento y terminar el rango antes en el
     celular. Sección 3.3.
3. **C2 funciona, pero se va a notar poco. Conviene que el autor lo sepa antes.**
   - Técnicamente está bien: la línea de tiempo se engancha a la pista del carrusel, sin trampas de `overflow`, igual
     en los dos motores.
   - Pero la premisa no se cumple: en el celular **no** se ve el borde de las tarjetas vecinas. Cada diapositiva mide
     el 100 % del ancho (375 de 375 px), y en reposo la vecina tiene 0 px visibles.
   - El efecto solo existe durante el gesto, y a media pasada es leve: opacidad 0,83 y 0,91, escala 0,97 y 0,98.
     Sección 3.2.
4. **Antes de todo esto hay un defecto AA que no está en la 013 ni en la auditoría R1.1.**
   - El mazo apilado de Servicios en el celular **tapa por completo el foco de teclado** (WCAG 2.4.11): 7 de 12
     acciones en Chromium y 8 de 12 en WebKit quedan debajo de la tarjeta siguiente.
   - No es scroll-driven, pero es el hallazgo de más valor de esta revisión. Sección 4.
5. **Corrección a la research (R-1303).** La frase «las líneas de tiempo con nombre no tienen este problema»
   (`overflow: hidden`) es incorrecta:
   - El nombre solo cambia cómo la animación encuentra la línea de tiempo. El scroller que sigue una `view-timeline` es
     siempre el más cercano del sujeto, tenga nombre o no.
   - En `/synergos`, la línea con nombre `--synergos-stage` toma como fuente la superficie de cristal
     (`overflow: hidden`), y su progreso queda en **0,71 fijo** al scrollear, en los dos motores. Es exactamente U1.
   - C1, C2 y C4 no caen en esto: medí que sus sujetos siguen la raíz o la pista del carrusel. Pero la spec debe
     llevar la regla bien escrita.
6. **La decisión del autor sobre las barras con movimiento reducido necesita una excepción explícita.**
   - Las barras de lectura van a moverse con `reduce`, y la de Synergos es una animación de scroll CSS.
   - Hoy la regla del sitio es «toda regla scroll-driven va dentro de `no-preference`», y FR-650 marca `transform`
     como movimiento.
   - Hay que nombrar la barra como excepción en la prueba unitaria de guardas y en FR-650 (si se extiende a Synergos,
     ver 2.4). Si no, la siguiente prueba que se agregue la marcará como fallo.

---

## 2. Soporte y riesgos: qué está bien, qué corregir y qué falta

### 2.1 Coincide y lo confirmo

- **Baseline:** Firefox 159 salió el 2026-10-27; Chrome y Edge 115, Safari 26.
  - Las versiones salen de `mdn/browser-compat-data`: `animation-timeline`, `animation-range`, `view-timeline`,
    `scroll-timeline`, `ScrollTimeline` y `ViewTimeline` son 115/26/159, y `timeline-scope`, 116/26/159.
  - Además, en Chromium `timeline-scope: all` se retiró en la 138.
- **Safari en hilo aparte desde 26.4.** Las [notas oficiales de Safari 26.4](https://developer.apple.com/documentation/safari-release-notes/safari-26_4-release-notes)
  (2026-03-24) dicen «Added support for threaded scroll-driven animations».
  - Ojo: las [notas de Safari 27.3 beta](https://developer.apple.com/documentation/safari-release-notes/safari-27_3-release-notes)
    (2026-11-03) dicen «since Safari 26.3». Contradicen a las de 26.4, y las de 26.3 no lo mencionan. Prevalece 26.4,
    como dice la research.
- **`view-timeline-inset: auto`** (la duda de R-1307). Lo verifiqué en Chromium y WebKit: resuelve al
  `scroll-padding-top` que Sobre mí define (128 px). El error máximo fue 0,000 en 14 a 18 posiciones por ancho,
  idéntico al `calc` explícito. Firefox sigue sin verificar.
- **La trampa del reset global.** La research la deduce de la especificación; aquí está medida:
  - Con `reduce`, el reset `0.01ms !important` y una barra `scroll(root)` sin guarda, la barra sigue en 0 → 0,5 → 1
    en Chromium y en WebKit.
  - **FR-650 sí la cuenta:** `getComputedTiming().activeDuration` llega como `CSSUnitValue(100%)`, que es distinto
    de 0. Lo comprobé en los dos motores.
- **`content-visibility` en Sobre mí.** La altura cambia al pintarse las escenas: 5 978 → 5 657 px a 375 y
  4 781 → 4 603 px a 1440. Respalda el descarte de una barra de página entera ahí.

### 2.2 Corregir

| Dónde | Dice | Lo medido | Consecuencia |
|---|---|---|---|
| R-1303, «Trampas comunes» | Las líneas de tiempo con nombre no sufren el `overflow: hidden` | En `/synergos`, la fuente de `--synergos-stage` es `div.surface` (`hidden/hidden`) y el progreso queda en 0,71 a cualquier altura, en ambos motores | Reescribir la regla: **cualquier** `view()` o `view-timeline` dentro de un ancestro con `overflow: hidden`/`auto`/`scroll` sigue a ese ancestro. Revisar `GlassSurface` antes de poner un sujeto dentro (es U1) |
| idea C1, «Qué aporta» | «Sobre mí es la página más larga del sitio» | A 375, tras recorrerlas: arquitectura 19 823 px, post 6 10 727, Servicios 9 216, Synergos 9 031, Sobre mí 5 657. A 1440, Sobre mí 4 603 frente a arquitectura 13 445 | C1 sigue valiendo (4 escenas y un índice que ya existe), pero el argumento es otro. El índice que más orientación daría es el de arquitectura (sección 3.4) |
| idea C2, «Qué aporta» | «En el celular el carrusel deja ver el borde de las tarjetas vecinas» | `.slide { flex: 0 0 100% }`: diapositiva y pista de 375 px, y vecina visible en reposo de 0 px | El efecto solo se ve durante el gesto y es leve (sección 3.2) |
| idea C1, «Cómo» | `animation-range: exit-crossing` | La última escena se queda en 0,84 a 1440 | Usar `contain` (sección 3.1) |

### 2.3 Falta

- **WCAG 2.4.11, *Focus Not Obscured* (AA), con elementos `sticky`.** Cualquier pila o cabecera pegajosa debe dejar
  ver el foco. Hoy falla en Servicios (sección 4), y la 013 debería llevar la prueba como criterio para todo lo que
  apile.
- **Las correcciones de Safari 27.3 beta que tocan a C1** (fuente en 2.1):
  - `animation-timeline` podía tomar una línea de tiempo fuera del `timeline-scope` más cercano;
  - no usaba la última coincidencia;
  - los rangos de `view` descartaban subpíxeles en elementos `sticky`;
  - un rango de largo cero, como `contain 50% contain 50%`, daba offsets infinitos.

  C1 usa nombres y `timeline-scope`: hay que probarlo en un iPhone con Safari 27 estable, no solo con el WebKit de
  Playwright.
- **El conteo no basta como prueba.** Mi primera medición contó 14 animaciones de trazo en `/synergos` y las di por
  buenas, pero estaban congeladas. Cada prueba de la 013 debe leer el progreso en dos o más posiciones (R-1308 ya lo
  dice para los candidatos; también aplica a lo existente).
- **La barra de Synergos pisa el header.** Tiene `position: fixed`, `top: 0` y `z-index: 100`, el mismo del header,
  pero va después en el DOM: su línea blanca de 3 px se pinta sobre el borde superior del header
  ([captura](./segunda-opinion/evidencia/barra-synergos-375.png)). La del blog va bajo el header en el celular
  ([captura](./segunda-opinion/evidencia/barra-blog-375.png)). Si las dos barras van a tener «la misma regla», también
  conviene una sola posición.

### 2.4 FR-650 no mira donde vive el scroll-driven

FR-650 recorre `/es`, `/es/aboutMe`, `/es/services`, `/es/portfolio`, `/es/portfolio/12`, `/es/contactMe` y `/en/now`,
solo en móvil. No entran `/es/synergos`, `/es/synergos/arquitectura` ni los posts, que es donde están las barras y los
trazos.

Propuesta:
- sumar esas rutas;
- poner la barra de lectura en una lista explícita de excepciones, por la decisión del autor;
- para C2 y C1, sumar sus selectores a `MOBILE_006`, como dice R-1308.

---

## 3. Los candidatos

### 3.1 C1: cómo se llena el índice (la decisión que espera el autor)

**Lo medido** (Chromium y WebKit dieron lo mismo):

| Rango | Escenas 1–3 al final de la página | Última escena («Hacia dónde voy») al final |
|---|---|---|
| `exit-crossing 0% exit-crossing 100%` (propuesto) | 1,00 | 0,98 a 375 y **0,84 a 1440** |
| `exit-crossing 0% contain 100%` | 1,00 | 1,00 |
| `contain 0% contain 100%` | 1,00 | 1,00 |

**Recomendación.**
- **`animation-range: contain`** para las cuatro escenas, con `view-timeline-inset: auto` (verificado).
  - Para una escena más alta que la ventana, el llenado empieza cuando su borde superior pasa bajo el índice y
    termina cuando su borde inferior aparece abajo. Se lee como «llegaste al final de esta escena», que es lo que
    promete un índice.
  - Funciona igual con escenas cortas.
  - Es la misma geometría de la barra de lectura del blog: una sola idea en todo el sitio.
  - Se evita `exit-crossing 0% contain 100%` para todas: en una escena más baja que la ventana, los dos extremos
    coinciden y el rango tiene largo cero. La línea saltaría de 0 a 1, y es justo el caso que Safari corrigió en 27.3.
- **Las escenas ya leídas quedan llenas.** Con `animation-fill-mode: both` es automático: las de arriba valen 1 y las
  de abajo 0. Ocultar las líneas que no son la activa exigiría atarlas a `aria-current` y haría que una línea llena
  desaparezca al cambiar de escena, un salto que no informa nada. Así el índice se lee como capítulos completados.
- **En el celular, los hilos entre puntos** como propone la idea: el hilo entre el punto *i* y el *i + 1* se llena con
  la escena *i*. El último punto no tiene hilo; su llenado se ve en la píldora.

**Riesgos y condiciones.**
- El índice de escenas y los puntos de progreso son de una sección aprobada (Sobre mí y el móvil de la 006). El autor
  ya pidió esperar esta opinión, así que hay que mostrarle una captura antes de integrar.
- `timeline-scope` debe estar en un ancestro común del índice y de las escenas. El `body` o el contenedor de la página
  sirven, porque el índice es `sticky` dentro de la página.
- Al saltar con el índice (`scrollIntoView`), las escenas intermedias conservan su estimado de
  `contain-intrinsic-size`. Como quedan arriba y valen 1, no se nota. Solo la escena de destino podría mostrar unos
  píxeles de error hasta pintarse.

### 3.2 C2: la imagen del carrusel

**Lo medido** (375, igual en Chromium y WebKit; la captura es de WebKit a media pasada,
[aquí](./segunda-opinion/evidencia/c2-375-webkit-media-pasada.png)):

| Posición | Imagen actual (visible, progreso, opacidad, escala) | Siguiente |
|---|---|---|
| En reposo | 298 px, 0,50, 1, 1 | 0 px, 0, 0,55, 0,92 |
| A media pasada (188 px) | 144 px, 0,78, 0,83, 0,97 | 184 px, 0,28, 0,91, 0,98 |
| En la siguiente | 0 px, 1, 0,55, 0,92 | 298 px, 0,56, 1, 1 |

- La fuente de la línea de tiempo es la pista, y ningún ancestro de `.slideMedia` tiene `overflow` distinto de
  `visible`. No hay trampa.
- **Opinión:** sigue siendo correcto hacerlo (el autor ya lo aprobó). Pero con una diapositiva al 100 % del ancho, el
  cambio de opacidad y escala casi coincide con el desplazamiento: se percibe como «la imagen respira», no como
  profundidad. Si el autor espera ver a las vecinas detrás, hace falta otro diseño del carrusel, y eso queda fuera del
  alcance.
- Recomiendo **no** forzar el efecto con valores más extremos: sería más movimiento sin más información. Se revisa en
  su teléfono y se decide ahí.
- Al tocar «Ver caso», la tarjeta centrada está en 1 (progreso 0,5 o 0,56). La transición compartida de la imagen no
  arranca de un estado escalado.

### 3.3 C4: la ruta de «Hacia dónde voy»

**Lo medido** con el esqueleto de la idea (`scale` sobre `.routes::before` y `.route::before`, rango
`entry 20% cover 45%`). Valores: [columna, conector 1, 2, 3, 4], iguales en Chromium y WebKit.

| Borde superior del mapa a… de la ventana | 375 | 1440 |
|---|---|---|
| 95 % | 0, 0, 0, 0, 0 | 0, 0, 0, 0, 0 |
| 75 % | 0, 0, 0, 0, 0 | 0,2, 0,34, 0,15, 0, 0 |
| 55 % | 0,15, 0,28, 0,05, 0, 0 | 0,72, 0,93, 0,75, 0,56, 0,38 |
| 35 % | 0,66, 0,88, 0,64, 0,44, 0,23 | 1, 1, 1, 1, 0,97 |

**Problema.** Las líneas que hoy se ven siempre (con opacidad 0,6) pasan a estar ocultas hasta que el visitante
scrollea:
- En el celular, con las rutas ya en pantalla, casi no hay líneas
  ([captura a 375, mapa al 55 %](./segunda-opinion/evidencia/c4-375-webkit-mapa-al-55.png)).
- Si el visitante se detiene ahí, el mapa queda sin la relación que debía mostrar.
- No es texto oculto, pero contradice el espíritu de FR-1108 y el principio de que el estado base es el estado final.

**Recomendación.**
- **Línea base fija y trazo encima.**
  - La columna base pasa a un fondo estático de `.routes`: un `linear-gradient` de 1 px en `left: $spine`, que no se
    anima. `.routes::before` queda como trazo acento con `scaleY`.
  - El conector base pasa a `.route::after` estático, y `.route::before` es el trazo con `scaleX`.
  - Sin soporte o con `reduce`, el trazo acento se queda en 1. Es lo que ya hace Synergos con su línea base y su
    trazo encima.
- **Que termine antes en el celular.** Con `entry 20% cover 45%`, a 375 el último conector va en 23 % cuando el mapa ya
  está al 35 % de la ventana. Por ejemplo, en `< md`, `entry 0% entry 100%`, o el mismo rango sobre la `view()` del
  mapa entero (`[data-cw-heading-map]` como `view-timeline` con nombre) en vez de la de cada pseudo-elemento. Así el
  trazo se completa con las rutas en la mitad de la pantalla.
- Solo `scale`, como propone la idea, y no `stroke-dashoffset`. Mi prototipo del anexo usa `stroke-dashoffset`: no
  copiar esa técnica, porque FR-653 no la acepta.
- La escena tiene `content-visibility: auto`, pero el mapa se pinta antes de entrar en pantalla; en la medición el
  progreso avanzó normal.

### 3.4 ¿Hay un candidato mejor que los recomendados?

- **Sí, uno que no es scroll-driven:** C0, el foco tapado en Servicios (sección 4). Es AA, está en una página de
  conversión y se corrige con CSS. Lo pondría delante de C1, C2 y C4.
- **Entre los scroll-driven, ninguno desplaza a C1, C2 y C4**, pero con dos matices:
  - El patrón de C1 rinde más en **arquitectura**: 19 823 px a 375, 5 capítulos, `ChapterNav` y el subrayado de
    capítulo ya existen. Hoy espera la revisión T1108 y U1, así que no lo meto en la 013. Pero si C1 se escribe como
    patrón reutilizable (un mixin con `timeline-scope`, `view-timeline` y rango `contain`), aplicarlo ahí después es
    casi gratis.
  - **C3 (barra del blog en CSS) queda fuera por decisión del autor**, y está bien. Lo que no conviene dejar fuera es
    la coherencia visual de las dos barras (2.3), ahora que van a compartir regla con movimiento reducido. Es un ajuste
    de estilo, no de técnica.

---

## 4. El defecto de Servicios (C0): foco tapado en el mazo

**Método.**
- `/es/services` a 375×812, recorriendo con Tab las 12 acciones del mazo («Ver qué recibes» y «Quiero esto»).
- Tras cada Tab se espera a que el scroll suave se asiente, y se mira con `elementFromPoint` el centro y los extremos
  del elemento enfocado.

| Motor | Movimiento | Totalmente tapadas | Por quién |
|---|---|---|---|
| Chromium | normal | **7 de 12** | La tarjeta siguiente (`sticky`) |
| Chromium | reducido | 0 | — (sin mazo) |
| WebKit | normal | **8 de 12** | La siguiente, o la última cuando la enfocada ya está «detrás» y recortada con `clip-path` |
| WebKit | reducido | 0 | — |

[Captura](./segunda-opinion/evidencia/foco-servicios-375.jpg): foco en «Ver qué recibes» de la tarjeta 02, cubierto
por la 03. El anillo de foco no se ve.

**Propuesta (solo CSS, no cambia nada para el dedo).** En `.cardItem:focus-within` (`Services.module.scss`, bloque del
mazo), subir el `z-index`, quitar el `clip-path` del estado «detrás» y la escala de profundidad. Se prueba con una e2e
que recorra el mazo con Tab a 375 en Chromium y WebKit. Encaja con U9 de la auditoría, que ya toca esos mismos dos
botones.

---

## 5. Descartes: ¿debería volver alguno?

Ninguno vuelve. Matices:

- **«Pila de tarjetas de Servicios con `view()`»:** bien descartada como reescritura. Pero la pila necesita el arreglo
  de foco (C0). Además, su listener de scroll (`components/site/services/stack.ts`, `addEventListener('scroll',
  update)`) lee la caja de todas las tarjetas en cada evento sin agrupar por frame. Agruparlo con
  `requestAnimationFrame`, como hace `components/blog/scroll.ts`, es higiene invisible.
- **«Barra de lectura de página entera en Sobre mí»:** bien descartada. La altura medida cambia hasta 321 px al
  pintarse las escenas (2.1).
- **«Más efectos en Synergos»:** bien descartado. Pero U1 (los trazos congelados) y la barra encima del header (2.3)
  son correcciones, no efectos nuevos.
- **«Revelar texto al entrar con `view()`»:** bien descartado. Coincido con la research.

---

## 6. Lo que no se verificó

- **Firefox 159**, en ningún candidato. La resolución de `view-timeline-inset: auto` y el rango `contain` en Firefox
  siguen siendo supuestos.
- **Safari 27 real en iPhone:** la barra dinámica, los 120 Hz y las correcciones de 27.3. El WebKit de Playwright en
  Windows no es Safari de iOS.
- **El aspecto final de C1 y C4:** lo medido es el progreso con el CSS inyectado, no un diseño terminado.
- **Contraste y tamaño en C2:** solo se anima la imagen, como propone la idea, y no medí con axe.

## 7. Anexo

[`segunda-opinion/`](./segunda-opinion/) contiene:

- **`mediciones/`**, que se corren desde la raíz de un checkout con `node_modules`, contra la URL de una vista previa:
  - `probar-candidatos.js`: alturas, C1, C2, C4 y el conteo de FR-650;
  - `c1-rangos.js`: los tres rangos de la tabla 3.1;
  - `synergos-congelado.js`: U1 y las líneas con nombre;
  - `foco-servicios.js`: la sección 4;
  - `medir-sitio.js` y `medir-prototipo.js`: el inventario y el prototipo de la investigación paralela.

  Escriben en `test-results/013/`, que está en `.gitignore`.
- **`evidencia/`:** las capturas citadas.
- **`prototipo/hacia-donde-voy.html`:** prototipo aislado de la investigación paralela, anterior a la escena real. Sigue
  sirviendo para dos cosas:
  - comprobar la barra de lectura con `view-timeline` + `contain` + `timeline-scope` frente a la fórmula de
    `lib/blog/progress.ts`: error máximo de 0,0002 en Chromium y WebKit, a 375 y 1440, sin script, frente a 55–77 ms
    de script por recorrido con la versión JS y CPU ×4;
  - reproducir la trampa del reset global.

  Su mapa usa `stroke-dashoffset` y no debe copiarse (ver 3.3).
