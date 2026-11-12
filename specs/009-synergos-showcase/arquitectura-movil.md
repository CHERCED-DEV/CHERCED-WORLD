# Arquitectura de Synergos en el celular y capas guiadas por scroll

**Estado:** hecho el 2026-11-12, espera el visto bueno del autor en su teléfono.
**Pedido del autor (2026-11-12):** "Está muy bien, no quiero que sientas que no lo es, pero en el responsive falla.
Cambia mucho en la coordinación de los espacios y en la explicación de la experiencia." Además pidió scroll guiado:
"que el usuario no sienta que está baje y baje texto, sino que de alguna manera animada el texto se va pasando como en
capas".

Se construye sobre la página aprobada el 2026-11-12 (R1.3). No se agregó contenido de Synergos: todo sale de
`content/synergos-architecture.ts`.

## Auditoría (antes)

375, 390 y 412 px, 768 y 1440 px, claro y oscuro, ES y EN, en Chromium.

| Código | Gravedad | Dónde | Hallazgo |
|---|---|---|---|
| AM1 | Alta | Flujo de cinco pasos (los tres diagramas) | Debajo de 740 px de contenedor el diagrama era un SVG alto: cada tarjeta medía unos 300 px, con el número arriba a la izquierda, el ícono a media altura y el título y el detalle centrados en el resto del ancho. El texto quedaba corrido a la derecha y lejos del ícono. Cinco tarjetas ocupaban unos 1700 px a 390. El mismo SVG se usaba en la columna de "Islas" a 1440. |
| AM2 | Alta | Riel de capítulos | Las píldoras partían el texto en dos líneas y medían 160 px o más. La activa no se movía al riel: desde el capítulo 03, la píldora marcada quedaba fuera de la vista. La barra de scroll se veía en los navegadores que la muestran. |
| AM3 | Media | Cifras del hero | Las tres cifras compartían una fila flexible: la columna de "piezas desplegables" era más ancha, y en el iPhone del autor la tercera caía sola en otra fila. |
| AM4 | Media | Encabezado de cada capítulo | En el celular el encabezado y la introducción iban centrados. Eran cinco líneas centradas con interlineado de 1,85, que se leían pesadas. |
| AM5 | Baja | "18 /" y "Lo construido y el siguiente paso." | En el celular mezclaban centrado e izquierda. |
| AM6 | Baja | Riel a 1440 | "Un tipo y dos compiladores" partía en dos líneas y el resto iba en una. |
| AM7 | Baja | Dock | Al bajar, el dock tapaba la tarjeta que pasaba por debajo. El final de la página ya reserva el espacio del dock (`--cw-dock-space`). |

## Qué cambió

- **Flujo (AM1).** Cuando el contenedor mide menos de 740 px, el diagrama es una lista HTML en una sola columna. Cada
  paso lleva un ícono de 44 px a la izquierda y, a su derecha, el número, el título y el detalle, todo alineado a la
  izquierda. La flecha baja por la columna de los íconos. Cada paso mide 102 px, así que los cinco caben en una
  pantalla del celular. Desde 740 px sigue el SVG ancho aprobado, con "Leer el diagrama como texto". En el celular la
  lista ya es el texto, así que ese desplegable no se repite. Se quitó el SVG alto.
- **Índice (AM2, AM6).** El riel horizontal se quitó: por decisión del autor, la página usa la navegación estándar
  (`components/site/section-nav/SectionNav`), la misma pestaña con puntos de Sobre mí.
  - `app/[lang]/synergos/arquitectura/page.tsx` la monta antes de la vista, con los capítulos de
    `architectureChapters(lang)` y el nombre "Secciones de arquitectura" / "Architecture sections".
  - El componente pone la línea de progreso de cada capítulo y elige el capítulo activo con la línea de lectura del
    blog. Antes se elegía por la proporción visible de cada sección, y "Patrones" (unos 7000 px en el celular) perdía
    siempre contra el borde de "Islas".
  - Las secciones y las anclas `#patron-*` bajan su `scroll-margin-top` de 160 a 16 px. El `scroll-padding-top` de la
    página ya cuenta la pestaña (128 px en escritorio, 132 en el celular).
- **Cifras (AM3).** En el celular van en una fila de tres columnas iguales: la cifra arriba y la etiqueta debajo.
- **Ritmo y lectura (AM4, AM5).** Debajo de `md`:
  - el encabezado del capítulo, la introducción, "18 /" y la frase de la fábrica van alineados a la izquierda;
  - la introducción pasa a un interlineado de 1,7;
  - los bloques de cada capítulo se separan 32 px (`--cw-space-6`).
- **Capas guiadas por scroll.**
  - Cada bloque de un capítulo entra como una capa al aparecer: sube 32 px, pasa de `scale(.97)` a 1 y de opacidad
    0 a 1. Los bloques son el encabezado, los diagramas, los textos, el código, los grupos de patrones y las tarjetas
    de la fábrica.
  - El efecto usa `view()` en `entry 0%` a `entry 30vh`, con el inset `auto` de `view()`, que respeta el
    `scroll-padding` del dock. En reposo, todo lo que está en la mitad de arriba de la pantalla queda en 1.
  - Solo se animan `transform` y `opacity` (FR-653).
  - Va dentro de `@supports`, de `prefers-reduced-motion: no-preference` y de `:root[data-js]`. Con movimiento
    reducido o sin JS, la página es estática.
  - Con las capas activas, el `Reveal` del capítulo entero queda quieto para no sumar dos entradas.
  - No hay scroll-snap.
- **Lo que ya existía.** La línea bajo cada capítulo y la barra de lectura de la U1 de la 012 siguen igual. En el
  celular, la línea del capítulo arranca a la izquierda, junto con el encabezado.
- **Explicación de cómo se recorre la página.** Debajo de la frase del hero va una línea corta, sin acciones nuevas:
  - ES: "Cinco capítulos, del CMS a la fábrica. Cada tema enlaza a sus fuentes públicas y el índice marca el capítulo
    en el que vas."
  - EN: "Five chapters, from the CMS to the factory. Each topic links to its public sources, and the index marks the
    chapter you are reading."
  - No habla de animación, así que vale también con movimiento reducido. El autor puede pedir quitarla.
- **Capítulos como datos (cambio de alcance del 2026-11-12).** La pestaña y los puntos de Sobre mí pasan a ser la
  navegación estándar de todas las páginas.
  - `content/synergos-architecture.ts` exporta `SYNERGOS_ARCHITECTURE_CHAPTERS`, con id estable, número y etiqueta en
    ES y EN, y `architectureChapters(lang)`.
  - La página arma con eso las secciones y el índice estándar.

## Pruebas

- **Unitarias:**
  - `tests/unit/s2/architecture-layers.test.ts`:
    - las animaciones solo usan `transform` y `opacity`;
    - cada `animation-timeline` está guardada por `@supports` y por movimiento reducido;
    - las capas solo existen con `:root[data-js]`;
    - la página no usa scroll-snap ni declara sus propias líneas de capítulo;
    - los capítulos son datos con id, número y etiqueta en ES y EN, y la ruta se los pasa a `SectionNav` en orden;
    - cada diagrama tiene cinco pasos en HTML con número, título y detalle.
  - `architecture-render` ahora cuenta las tres listas de pasos.
- **E2e** (`tests/e2e/s2/arquitectura-capas.spec.ts`, con `E2E_PORT=3600`):
  - las capas entran al bajar y quedan en 1 en reposo;
  - en cada capítulo, lo que se lee está en 1;
  - con movimiento reducido y sin JS, nada se anima;
  - la página monta la navegación estándar con los cinco capítulos y sin el riel viejo;
  - al llegar a cada capítulo, la pestaña lo marca (también "Patrones") y el encabezado queda debajo de ella;
  - el flujo alinea ícono y texto;
  - el recorrido en escritorio sigue siendo el SVG ancho;
  - las cifras van en una fila pareja a 375, 390 y 412;
  - el último paso de cada flujo queda libre del dock.
- **Ajustada:** `synergos-arquitectura.spec.ts`.
  - En el celular, el flujo se lee en la lista y no en el desplegable.
  - La espera de la navegación del caso al atlas sube de 5 a 15 s. Con la máquina cargada por otras sesiones, la
    navegación funciona pero tarda 4,9 s.
- **No se corrió la exhaustiva.**

## Pendiente

- El autor revisa en su teléfono la vista previa y las capturas, antes y después, a 390 px.
