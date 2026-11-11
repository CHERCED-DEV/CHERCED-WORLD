# 013 — Animaciones guiadas por scroll donde aportan

**Estado:** en curso, 2026-11-11. Entra antes del Release 1 (R3.5 del plan 012).
**Base:** [research.md](./research.md), [idea.md](./idea.md) y [segunda-opinion.md](./segunda-opinion.md).

## Qué busca

Que el scroll cuente algo donde hoy el visitante no lo sabe: cuánto lleva de cada escena de Sobre mí y cómo se
conecta lo que el autor hace hoy con hacia dónde va. Sin sumar elementos a la pantalla, sin rehacer piezas
aprobadas y sin depender de JavaScript.

## Decisiones del autor (2026-11-11)

- La 013 entra antes del release.
- **C1:** en el índice de Sobre mí, las escenas ya leídas quedan llenas, como capítulos terminados.
- **C4** es el tercer cambio; C3 (barra del blog en CSS) sale de la 013.
- **Barras de lectura:** con movimiento reducido se ven y siguen el scroll, sin efectos. La misma regla para el
  blog y para Synergos.
- **C2** (imagen del carrusel en celular): entra. El autor lo aprobó sabiendo que, como cada tarjeta ocupa todo el
  ancho, el efecto solo se ve durante el gesto ("Sí, hazla").
- **C8** (nuevo, pedido por el autor): en el inicio, el paso del hero a "Ahora trabajo en" pedía mucho scroll. Un
  scroll corto debe pasar de un panel al otro o regresar, en celular y en escritorio, y el cambio debe sentirse.

## Requisitos

- **FR-1301 (C1):** cada píldora del índice de escenas lleva una línea de 2 px que se llena con el avance de su escena
  (`view-timeline` con nombre por escena, `timeline-scope` en `.page`, `animation-range: contain`,
  `view-timeline-inset: auto`). Las escenas de arriba quedan en 1 y las de abajo en 0. En celular (< 480 px), entre un
  punto de progreso y el siguiente baja un hilo de 2 px que se llena con la escena del punto de arriba; el último punto
  no tiene hilo.
- **FR-1302 (C4):** el mapa de "Hacia dónde voy" conserva sus líneas base fijas. Encima, un trazo acento recorre la
  columna y luego cada conector, en orden, sobre la `view()` del mapa (`entry`), de modo que se completa con el mapa a
  media pantalla.
- **FR-1303:** con movimiento reducido, las barras de lectura (blog y Synergos) se ven y siguen el scroll, sin brillo
  ni transiciones.
- **FR-1304:** todo efecto nuevo va dentro de `@supports` de scroll-driven y, salvo las barras de lectura, dentro de
  `prefers-reduced-motion: no-preference`. Sin soporte o con movimiento reducido, C1 no muestra líneas y C4 muestra el
  trazo completo.
- **FR-1305:** solo se animan `transform` (o `scale`) y `opacity` (FR-653). Nada se oculta: en cada parada, el estado es
  legible y completo.
- **FR-1306:** ningún sujeto de una `view-timeline` nueva queda dentro de un contenedor con `overflow: hidden` (la
  causa de U1). Se usa `overflow: clip`.
- **FR-1307 (C2):** en celular (< md), la imagen de cada tarjeta del carrusel de proyectos (`.slideMedia`) va de
  `opacity` 0,55 y `scale` 0,92 en los bordes a 1 en el centro, sobre `view(inline)` de la pista. El texto, los chips y
  "Ver caso" no se animan. En reposo, la tarjeta centrada está en 1.
- **FR-1308 (C8, snap):** en el inicio, con JS y sin movimiento reducido, la raíz lleva `scroll-snap-type: y mandatory`
  con tres paradas: el banner del hero (`end`, que en pantallas normales cae en 0), el panel de "Ahora trabajo en"
  (`start`) y el pie (`end`). Un golpe de rueda, una flecha o un deslizamiento pasan de una parada a la siguiente.
  Si una parada no cabe en la pantalla, el navegador deja recorrerla libre (área mayor que el snapport), así que
  ningún contenido queda inalcanzable.
- **FR-1309 (C8, scroll-driven):** durante el paso, la tarjeta del hero se aleja (`scale` 0,9 y `opacity` 0,35, rango
  `exit-crossing 30%` a `100%`) y el panel llega (`opacity` de 0,35 a 1, rango `entry 0%` a `80%`). Las dos usan
  `view(auto)`, que respeta el `scroll-padding`. En cada parada, la tarjeta y el panel visibles están en 1.
- **FR-1310:** ningún elemento que sea parada del snap, ni sus ancestros, se transforma: Chrome calcula la posición de
  la parada con la caja ya transformada (medido el 2026-11-11: un `translate` de 300 px movió la parada 300 px). Por
  eso C8 anima la tarjeta dentro del banner, no el banner.

## Fuera de alcance

C3, C5, C6 y C7 de la idea, y los descartes que lista.
