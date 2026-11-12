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
- **Riel (AM2, AM6).**
  - No se ve la barra de scroll y cada píldora va en una línea.
  - Al cambiar de capítulo, la píldora activa se centra en el riel (con movimiento reducido, sin animación).
  - Desde `lg`, las píldoras pueden partir línea si no caben, como estaba aprobado.
  - Se corrigió el capítulo activo. Antes se elegía por la proporción visible de cada sección, y "Patrones" (unos
    7000 px en el celular) perdía siempre contra el borde de "Islas": al saltar a Patrones, el riel seguía marcando
    Islas. Ahora el activo es el capítulo que cruza una línea de lectura al 40 % de la pantalla.
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
- **Capítulo activo en el riel.** Cada píldora lleva una línea de 2 px que se llena con el avance de su capítulo. Es
  el mismo método de C1 en Sobre mí: `view-timeline` con nombre por capítulo, `timeline-scope` en `.page`,
  `animation-range: contain` y `view-timeline-inset: auto`. Los capítulos leídos quedan llenos, el actual va a medias
  y los de abajo en cero. Con las líneas activas, la píldora activa deja su subrayado fijo, porque la línea ya cumple
  esa función.
- **Lo que ya existía.** La línea bajo cada capítulo y la barra de lectura de la U1 de la 012 siguen igual. En el
  celular, la línea del capítulo arranca a la izquierda, junto con el encabezado.
- **Explicación de cómo se recorre la página.** No se agregó texto. El hero ya dice "01—05" y ofrece tres accesos
  hacia abajo, y el riel numerado con su línea de avance muestra en qué capítulo va el lector. Sumar otra frase habría
  repetido acciones.

## Pruebas

- **Unitarias:**
  - `tests/unit/s2/architecture-layers.test.ts`:
    - las animaciones solo usan `transform` y `opacity`;
    - cada `animation-timeline` está guardada por `@supports` y por movimiento reducido;
    - las capas solo existen con `:root[data-js]`;
    - la página no usa scroll-snap;
    - el riel no muestra barra de scroll y sus píldoras no parten línea;
    - cada diagrama tiene cinco pasos en HTML con número, título y detalle.
  - `architecture-render` ahora cuenta las tres listas de pasos.
- **E2e** (`tests/e2e/s2/arquitectura-capas.spec.ts`, con `E2E_PORT=3600`):
  - las capas entran al bajar y quedan en 1 en reposo;
  - en cada parada del riel, lo que se lee está en 1;
  - con movimiento reducido y sin JS, nada se anima;
  - la línea de cada píldora se llena con su capítulo;
  - el riel no muestra barra, cada píldora va en una línea y la activa queda a la vista;
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
