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
- **C2** (imagen del carrusel en celular): pendiente. La segunda opinión midió que en celular cada tarjeta ocupa todo
  el ancho, así que el efecto solo se ve durante el gesto.

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
- **FR-1305:** solo se anima `transform`. Nada se oculta: el estado sin animación es legible y completo.
- **FR-1306:** ningún sujeto de una `view-timeline` nueva queda dentro de un contenedor con `overflow: hidden` (la
  causa de U1). Se usa `overflow: clip`.

## Fuera de alcance

C3, C5, C6 y C7 de la idea, y los descartes que lista. C2 hasta que el autor decida.
