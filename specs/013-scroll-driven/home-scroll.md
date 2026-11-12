# 013 C8: varios scroll seguidos en el inicio (nota de home-scroll)

Pedido del autor: "La gente normalmente no hace un solo scroll, hace varios scroll y entonces cuando bajo de más me
voy a ubicar en la parte de arriba y bueno, se mueve otra vez."

## Lo que pasaba (medido)

Medido con Chromium de Playwright sobre el build de producción, antes del rebase sobre `integracion-hijas` (por eso
el pie está en 1172; con el pie de la 015 el máximo a 1280×800 es 1240). Los golpes de rueda reales se simulan con
`chrome.gpuBenchmarking.smoothScrollBy(..., precise_scrolling_deltas: false)`, que es como Chrome recibe una rueda de
mouse. `page.mouse.wheel` manda deltas precisos, como un trackpad: con ellos cada evento vuelve a la parada más
cercana y no reproduce el mouse. A 1280×800 las paradas eran hero 0, panel 804 y pie 1172.

| Gesto (1280×800 salvo que se diga) | Antes | Después |
| --- | --- | --- |
| 1 golpe de rueda desde el hero | 0 → 804 | 0 → 804 |
| 1 golpe de rueda desde el panel, hacia arriba | 804 → 0 | 804 → 0 |
| 3 golpes en 120 ms desde el hero | 0 → 804, quieto, y solo → 1172 (pie) | 0 → 804 → 1004 |
| 2 golpes separados 350 ms | 0 → 804 → 1172 (pie) | el segundo golpe avanza ≤ 210 px |
| Un gesto de 10 golpes (1000 px) desde el hero | 0 → 1172 (pie) | 0 → 1008 |
| Trackpad (8 deltas de 30 px) bajo el panel | rebota hacia el panel | avanza libre, sin rebote |
| Dedo, arrastre lento de 180 px bajo el panel (390×844) | vuelve al panel (817) | se queda donde se suelta |
| Dedo, arrastre corto en el hero | vuelve al hero | vuelve al hero |
| Flecha abajo desde el panel | salta al pie | avanza 40 px |
| `End` y luego `PageUp` | — | llega al pie y vuelve al panel |

## La causa

1. **El pie era una parada a un solo golpe del panel.** Con rueda imprecisa, cuando termina la animación de un golpe
   Chromium salta a la parada siguiente en la dirección del golpe, contada desde donde quedó
   (`cc/input/input_handler.cc`, `CreateSnapStrategy`, rama de rueda imprecisa → `CreateForDirection(current_offset,
   delta)`). Con tres paradas, el segundo golpe de cualquier ráfaga, o el que llega mientras corre la animación del
   snap, encuentra el pie como "siguiente": la página llega al panel, se queda quieta y luego sigue sola hasta el pie.
   Eso es el "se mueve otra vez". Subiendo pasa lo mismo: pie → panel → hero.
2. **No son las animaciones.** El panel y la tarjeta solo animan `opacity` y `scale` dentro de la parada, y el
   `scroll-padding` no cambia durante el paso (medido cuadro a cuadro en 390×844). Las paradas no se mueven.
3. **`mandatory` con pocas paradas** obliga a terminar siempre en una de ellas. Entre el panel y el pie no había
   dónde quedarse, y en celular y trackpad cualquier arrastre en esa zona volvía al panel o se iba al pie.

## Opciones medidas

| Opción | Resultado | Decisión |
| --- | --- | --- |
| `proximity` | Un golpe se queda en 100 px y ya no pasa al panel | No: rompe lo aprobado |
| Quitar solo la parada del pie | Bajo el panel rebota 804 → 904 → 804 y el pie queda inalcanzable | No |
| Solo `scroll-snap-stop: always` | Con rueda no cambia nada: Chromium mira la parada desde donde terminó el golpe | Solo no basta |
| Snap solo entre hero y panel, libre debajo | Los golpes de más ya no saltan al pie; el dedo y el trackpad recorren libre | **Sí** |

## El cambio

`components/site/home/Home.module.scss`, bloque de C8:

- El `#footer` deja de ser parada.
- El panel conserva `scroll-snap-align: start` y suma `scroll-margin-block-end: 100rem`. Su área de snap llega hasta
  el final de la página, así que desde su borde superior hacia abajo es un área más alta que la pantalla y se recorre
  libre (la misma regla de "si una parada no cabe, se recorre libre"). Hacen falta entre 590 y 624 px según el tamaño
  y el idioma, con el pie de la 015 (medido en 38 tamaños de 320×480 a 2560×1440, en vertical y apaisado). Las
  unidades de viewport no alcanzan en apaisado; `100rem` (1600 px) crece con el texto, igual que el pie, y deja
  holgura si el pie crece.
- El panel lleva `scroll-snap-stop: always`: un flick de dedo o de trackpad desde el hero, o `PageUp` desde el pie, no
  pasan de largo el panel.
- **Actualización del 2026-11-12 (R3.6, vitrina "Proyectos destacados"):** debajo del panel ahora hay otro panel con
  la misma clase `.panel`. El snap quedó en `.now .panel` para que la vitrina no sea una tercera parada, y el margen
  sube a `300rem` (4.800 px), porque del borde inferior del panel al final hay entre 1.230 px (768) y 1.360 px (375 y
  1440). En la prueba, `PageUp` desde el pie ya no llega al panel de un golpe: sube por páginas y la última parada
  es el panel.
- No cambia nada visual, ni el banner, ni las animaciones, ni el movimiento reducido.

## Lo que el CSS no puede arreglar (límites de Chromium)

- **Rueda dentro de la zona libre:** en un área más alta que la pantalla, Chromium suma un paso al terminar cada golpe
  (904 → 1004 → 1104 con un golpe de 100 px). Bajo el panel, cada golpe avanza cerca del doble. Pasaba igual antes
  en los portátiles donde el banner no cabe (1366×650, 1536×750, 1920×800).
- **Subir con varios golpes:** si un golpe hacia arriba termina por encima del borde del panel, Chromium busca la
  parada siguiente hacia arriba, que es el hero. Desde el pie pasaba igual antes con 4 golpes o más.
- **Que los golpes extra se queden en el panel:** con JS tampoco se puede sin secuestrar la rueda: en una ráfaga solo
  el primer evento `wheel` es cancelable.

## Para la spec (FR-1308)

Texto propuesto, para quien tenga `spec.md`:

> **FR-1308 (C8, snap):** en el inicio, con JS y sin movimiento reducido, la raíz lleva `scroll-snap-type: y mandatory`
> con dos paradas: el banner del hero (`end`, que en pantallas normales cae en 0) y el panel de "Ahora trabajo en"
> (`start`, con `scroll-snap-stop: always`). Un golpe de rueda, una flecha o un deslizamiento pasan del hero al panel y
> de vuelta. Del borde superior del panel hacia abajo se recorre libre hasta el pie: el área de snap del panel llega al
> final de la página (`scroll-margin-block-end`). Si una parada no cabe en la pantalla, se recorre libre.

## Pruebas

En `tests/e2e/rel/scroll-driven.spec.ts`, bloque C8:

- La flecha pasa del hero al panel y vuelve, avanza libre bajo el panel, `End` llega al pie y `PageUp` vuelve al panel.
- Ráfaga de rueda con deltas precisos bajo el panel: avanza sin rebotar ni saltar al pie.
- Rueda de mouse (navegador propio con `--enable-gpu-benchmarking`): el segundo golpe no salta al pie, uno de vuelta
  regresa al panel y otro al hero.
- Celular: el arrastre corto en el hero vuelve al hero y bajo el panel se queda donde se suelta.

Con el `Home.module.scss` de antes y estas pruebas, fallan las 7 que tocan el cambio, por la razón esperada: el pie
sigue siendo parada, la ráfaga de trackpad rebota hacia el panel, el segundo golpe de rueda llega al pie (1240, el
máximo tras el rebase: el pie de la 015 es más alto) y el dedo vuelve al panel (817). Con el cambio pasan todas.

Los toques sintéticos de flick por CDP salieron inestables con la máquina cargada: también con el CSS de antes
quedaban a media altura. Los flicks fuertes conviene probarlos en el teléfono.
