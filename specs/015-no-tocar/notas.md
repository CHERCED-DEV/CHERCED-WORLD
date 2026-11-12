# 015 · "Cuidado, no tocar" (nota de la sesión)

Huevo de pascua de humor que pidió el autor el 2026-11-12: "me gusta mucho o tengo mucho humor".

## Lo que decidió el autor

- **Referencias.** Iván Femat "la Mole", comediante mexicano, por la energía de cansón tierno; los soldaditos de
  Metal Slug por el estilo de pixel; "Goku pequeñito" y un cameo de transformación. El personaje es original: un
  mini-autor pixelado (barba, gafas de escudo verdes, camiseta negra, reloj) sacado de su retrato. No copia
  personajes, nombres ni looks con derechos. El cameo es un "MODO CANSÓN MÁXIMO" genérico, con aura verde
  `#25ED9E` y el pelo parado, nunca dorado.
- **Lugar.** El footer, debajo de `footer.egg`. Solo dos líneas en `components/shell/SiteFooter.tsx`, con aviso
  previo a la sesión que creó esta.
- **Tono.** Aprobó las 10 frases propuestas. Se suman dos de nivel, en el mismo tono, que salen con la memoria.
- **Cómo se calma.** Esc o el botón "Quieto" lo dejan quieto al instante: se sienta con los brazos cruzados y hace
  pucheros (WCAG 2.2.2). Solo se va si el visitante vuelve a tocar "No tocar" pasado 1 minuto; antes ruega y cuenta
  los segundos.
- **Memoria.** Sin IA por ahora: el navegador cuenta cuántas veces lo despertaron (`cw-fun-wakes`), y con eso sube de
  nivel, habla y pica más seguido y saluda con "Volviste". La IA que aprende queda como evolutivo.

## Cómo funciona

- `components/fun/NoTocar.tsx` es de servidor y solo pasa la etiqueta. `NoTocarButton.tsx` carga `Buddy.tsx` con
  `import()` al primer toque. Sin JS, el botón no se muestra (`cw-js-only`).
- El muñeco solo finge: dibuja un "¡pic!" sobre el control más cercano y no dispara clics, no navega ni mueve el
  foco. La capa tiene `pointer-events: none`; solo "Quieto" recibe el puntero.
- Sigue el puntero, el dedo (se pone encima del toque) o el foco de teclado (se para al lado, no encima).
- Con movimiento reducido aparece quieto en la esquina inferior derecha y solo habla.
- Las frases van a una región `role="status"` educada. Las automáticas salen como mucho una cada 8 s; las respuestas
  a una acción del visitante salen siempre.
- A los 30 s entra en modo cansón máximo: el pelo se para y le queda aura.
- El sprite son cuadrículas de texto en `sprite.ts`, convertidas en rectángulos SVG con contorno de sticker.

## Pendientes para otras sesiones

- **Suite exhaustiva (resuelto).** La auditoría de interacción ya delega `[data-cw-no-tocar]` en
  `tests/e2e/fun/no-tocar.spec.ts` (commit `bf3881d`). La suite lo verá cuando se relance sobre `integracion-hijas`.
- **Privacidad.** `privacy.technical.body` dice que en el navegador solo quedan preferencias. El contador de
  despertares es un dato más del mismo tipo; conviene nombrarlo ("y cuántas veces despertaste al muñeco"). El archivo
  no es de esta sesión.

## Pruebas

- Unitarias en `tests/unit/fun`: frases, temporizador, pausa, memoria y sprite.
- E2E en `tests/e2e/fun` con `E2E_PORT=3700`. Por pedido del autor, se corren al final, cuando esté satisfecho con lo
  que vea en la vista previa.
