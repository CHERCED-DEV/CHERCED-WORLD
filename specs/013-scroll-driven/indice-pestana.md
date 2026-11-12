# Índice de Sobre mí como pestaña fija (013, fuera de C1 a C8)

Pedido del autor: en el celular el índice de escenas se veía como una fila de píldoras suelta. Lo quería como una pieza
flotante pegada al header, con una punta redonda y la otra cuadrada contra el marco, fija, guiada por scroll y con el
cristal del sistema.

## Qué cambió

- **Celular y tableta (< 768 px).** El índice es una pestaña pegada al borde izquierdo, 8 px bajo el header. La esquina
  contra el marco va recta, sin borde izquierdo ni filo de luz, y la punta interior es redonda. Mide 48 px de alto y
  cada enlace 46 px, así que los toques cumplen los 44 px.
- **Al bajar se compacta.** El cristal se desliza fuera del marco y deja solo el número y la escena actual, por ejemplo
  "02 Carrera", con la línea de progreso de C1. La línea no se duplica: es la misma `::after` del enlace, que viaja con
  la píldora.
- **Al subir, al tocarla o al llegarle el foco de teclado se despliega** con las cuatro escenas. El toque que la
  despliega no navega ni mueve la página. Se vuelve a compactar después de 48 px de scroll.
- **El indicador de la escena activa se desliza** de una píldora a otra (FLIP con `transform`) en vez de saltar.
- **Etiquetas en minúscula en < 768 px.** En mayúsculas espaciadas las cuatro medían 488 px y no cabían en 362; ahora
  caben en español desde 375 px y en inglés desde 412 px. Si no caben, la pista se desplaza con un desvanecido en el
  borde y la escena activa queda centrada.
- **Tab ya no mueve la página.** Con el índice viejo, recorrer las escenas con Tab subía la página unos 336 px por
  enlace, porque el navegador creía que el `scroll-padding-top` tapaba el índice sticky. Ahora los enlaces llevan
  `scroll-margin-block` amplio y el foco se queda donde está.
- **Escritorio (≥ 768 px): igual que lo aprobado.** Sigue centrada, en mayúsculas, con números y sin compactarse: hay
  espacio para las cuatro escenas y anclarla al marco la separaría del contenedor de 1248 px. Solo gana el indicador
  que se desliza, que en reposo se ve igual que antes.

## Decisiones

- **Sin blur propio en celular.** El presupuesto de cristal es de 3 superficies (FR-602): header, dock y menú ya suman 3
  con el menú abierto, y el lóbulo activo del mapa usa otra. La pestaña usa `glass(strong)`, `glass-grain`,
  `glass-depth` y `glass-edge`, que en celular dan el fondo sólido con grano, borde de luz y profundidad del resto de las
  tarjetas.
- **Solo `translate`, `transform` y `opacity`** (FR-653). La pestaña es `sticky`, no `fixed`: conserva su lugar arriba,
  así que el héroe no se mueve, y deja de verse con el final de la página, antes del pie.
- **La dirección del scroll sale de `useScrollDirection`**, el mismo hook del dock. La línea de cada escena sigue siendo
  CSS guiado por scroll (`view-timeline` con `@supports`).
- **Movimiento reducido:** no se compacta ni anima, y el indicador salta.
- **Sin JS:** queda fija y entera, con la primera escena marcada.
- **Estilos en `SceneNav.module.scss`.** En `About.module.scss` quedan solo `timeline-scope` y las `view-timeline` de
  las escenas.

## Pruebas

- Unitarias: `tests/unit/rel/scene-nav.test.ts` cubre estado, geometría, marcado sin JS y la guarda de movimiento.
- E2E: `tests/e2e/rel/indice-pestana.spec.ts`:
  - posición fija a 375, 390 y 412 px;
  - compactar y desplegar en ES y EN;
  - toque;
  - indicador;
  - movimiento reducido;
  - teclado con WCAG 2.4.11;
  - axe en claro y oscuro;
  - escritorio;
  - sin JS.

## Pendiente del autor

- Los puntos de escena de la derecha (< 480 px, 006) siguen como estaban. Con la pestaña compacta mostrando la escena
  actual y su línea, ahora repiten esa información. ¿Se quedan o se retiran?
