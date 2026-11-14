# 037 — Escenario 3D de Mini Cherced: vóxeles con Three.js

Pedido del autor, 2026-11-14: "aunque me gusta mucho el pixel art, me gustaría mejorar el recuadro donde él aparece
con Three.js. Me parece que podríamos llegar a algo sobrio, fino, elegante y brutal. Y quizás el muñequito mejorarlo
más, sin querer decir que deje de ser de 2D, pero que sea mucho más bacano. O sea, puede ser 3D, pero 3D pixelar."

Estado: spec. No construida. Depende de la 018 (Mini Cherced) y convive con la 031 (caja de cristal).

## La idea en una línea

El mismo Mini Cherced, pero hecho de **vóxeles**: cada píxel del sprite se vuelve un cubito. Sigue viéndose pixel
art de frente, y al girar tiene volumen. Todo en un escenario oscuro y sobrio, con una luz verde de marca que respira
con la voz.

## Escenario

- **Sobrio:** fondo negro profundo y un piso de rejilla fina que se pierde en niebla. Sin estrellas ni scanlines
  (P-3701).
- **Luz:** una luz de borde verde (#25ed9e) muy tenue detrás del personaje y una luz principal blanca suave. La luz de
  borde y un anillo en el piso pulsan con el nivel de la voz y reemplazan las barras del medidor.
- **Cámara:** respira lento (oscila 1° o 2°) y sigue un poco el cursor. En celular sigue la inclinación solo si el
  visitante lo permite; si no, queda quieta.
- **Profundidad:** desenfoque suave del fondo y sombra de contacto bajo los pies. Nada de brillos exagerados.

## Personaje en vóxeles

- **Fuente única:** el sprite 32×49 de `components/ailab/agent/avatar-sprite.ts` se extruye a vóxeles. Cada parte
  tiene su propia profundidad: la cabeza más gruesa, el visor salido como pieza emisiva y los audífonos a los lados.
  Si cambia el sprite, cambia el 3D.
- **Animaciones:**
  - respira;
  - gira la cabeza hacia el cursor;
  - la boca se arma por capas de vóxeles según el nivel del audio (los mismos tres cuadros de hoy);
  - parpadea;
  - esquiva los clics hacia un lado;
  - se baja el visor y dice "¿Qué te pasa?";
  - saluda al empezar la conversación.
- **Estados:** escuchando (visor encendido suave), pensando (vóxeles del visor en barrido), hablando (luz de borde
  activa) y apagado (gris, visor apagado).

## Técnica

- **Three.js puro**, sin react-three-fiber, para no sumar peso. Es una dependencia nueva (`three`) y va en la tabla
  de dependencias del README.
- **Un solo `InstancedMesh`** para los vóxeles del cuerpo: una sola llamada de dibujo. La boca y el visor son
  instancias aparte para animarlos.
- **Carga diferida:** Three.js se descarga solo al abrir la tarjeta V5, con `import()` dinámico.
- **Presupuesto:**
  - menos de 160 KB gzip extra en la tarjeta;
  - 60 fps en escritorio y 30 o más en un celular de gama media;
  - `devicePixelRatio` con tope de 1,5;
  - el ciclo se pausa con la pestaña oculta o la tarjeta fuera de pantalla.
- **Respaldo:** sin WebGL, con `prefers-reduced-motion` o si falla la carga, queda el sprite 2D de hoy. No se borra.
- **Accesibilidad:** el canvas es decorativo (`aria-hidden`); el estado, los subtítulos y la caja de cristal siguen
  en texto.

## Requisitos

- **FR-3701** Mismo sprite como fuente de verdad del 2D y del 3D, con una prueba que verifica que el modelo 3D tiene un
  vóxel por cada píxel lleno del sprite.
- **FR-3702** El escenario 3D reacciona al nivel de audio del reproductor (el mismo `level()` de hoy) sin crear otro
  `AudioContext`.
- **FR-3703** Respaldo 2D automático sin WebGL o con movimiento reducido.
- **FR-3704** El ciclo de render se detiene al colgar, al cerrar la tarjeta y con la pestaña oculta.
- **FR-3705** Se aprueba con capturas en escritorio y celular, comparadas con la versión 2D actual, antes de
  reemplazarla.

## Fases

1. Prototipo local con el simulador, sin gastar la API: el personaje en vóxeles, quieto, con luz y piso.
2. Animaciones y reacción a la voz.
3. Revisión del autor en escritorio y celular.
4. Reemplazo, dejando el 2D como respaldo.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-3701 | ¿Se conserva algo del look CRT (scanlines, estrellas)? | No: el escenario nuevo es sobrio |
| P-3702 | ¿Los vóxeles llevan borde oscuro para que se lean como pixel art? | Sí, un borde fino |
| P-3703 | ¿El chibi del footer (015) también pasa a vóxeles? | No por ahora; primero el de V5 |
