# 028 — Mini Cherced en todo el sitio

Ola 2 de la 018. Se cruza con la 019 (el chibi del pie que corre al AI Lab). Depende de la 020.

Estado: construida el 2026-11-15 (ver «Cómo quedó»). Quedan para el autor la voz (P-1802) y los gestos nuevos.

## Qué hace

Mini Cherced deja de vivir solo en la tarjeta V5 y acompaña al visitante por todo el sitio:

- Se despierta desde el chibi del pie (015) o desde una entrada propia, sin sumar llamados que se repitan.
- **La conversación sigue al navegar:** si te lleva al blog, sigue hablando ahí, porque vive en el layout y no en la
  página.
- Sabe en qué página estás y puede explicarla ("estás en el caso 14, ¿quieres ver sus decisiones?").
- Puede señalar cosas en pantalla: hace scroll a una sección y la resalta.

## Refinamientos de V5 que entran aquí

- Elegir la voz de Gemini (P-1802) y probar 2 o 3.
- Que recuerde lo hablado durante la visita (sin guardarlo en el servidor).
- Gestos nuevos: señalar con el brazo al abrir una página y celebrar al terminar.
- Ajustes de lo que pidió el autor: esquivar clics y la reacción de las gafas, ya hechos en la 018.

## Costo

El mismo de V5 (~0,10 USD por conversación de 5 minutos) y los mismos topes.

## Requisitos

- **FR-2801** El agente vive en el layout de `/[lang]` y la sesión de Live sobrevive a la navegación.
- **FR-2802** Herramienta nueva `resaltar_seccion(id)`, solo con ids que existen en la página.
- **FR-2803** Un solo punto de entrada visible; decide el autor dónde (P-1804).
- **FR-2804** Se cierra con Esc, y con `prefers-reduced-motion` no corre por la pantalla.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2801 | ¿Dónde vive la entrada? | En el chibi del pie, sin botón nuevo en el dock |

## Cómo quedó (2026-11-15)

- **FR-2801** `GlobalAgent` vive en `app/[lang]/layout.tsx` y monta el mismo `AgentStage` en modo `persistent`: al navegar no
  hace `teardown`, así que la sesión de Live (o el simulador) y la transcripción siguen en la página nueva. Verificado en dev:
  «llévame al blog» pasó de `/es/ai-lab` a `/es/blog` con la conversación viva.
- **FR-2802** Dos herramientas nuevas en `lib/ai/agent/tools.ts`: `pagina_actual` (ruta, título y secciones señalables) y
  `resaltar_seccion(id)`, que solo acepta ids que devuelve `pagina_actual` (`lib/ai/agent/page-context.ts`). Hace scroll y
  pone un contorno verde 2,4 s; con `prefers-reduced-motion` el scroll es instantáneo y sin transición.
- **FR-2803 / P-2801** La entrada es el chibi del pie: cuando está despierto muestra «¿Hablamos?» junto a «Calma». La tarjeta
  V5 suma «Llévalo contigo por el sitio», que abre el mismo panel. No hay botón nuevo en el dock.
- **FR-2804** El panel flota abajo a la derecha (en móvil, encima del dock). Esc lo minimiza sin cortar la conversación; × lo
  cierra y cuelga. No corre por la pantalla.
- El simulador también entiende «¿qué hay en esta página?»: lee la página, resalta la primera sección y cuenta las tres
  primeras, para que el modo local lo demuestre sin Gemini.
- Recordar lo hablado durante la visita queda cubierto por el panel persistente: la conversación vive mientras no lo cierres,
  y no se guarda en el servidor.
- Pendiente del autor: probar 2 o 3 voces de Gemini (P-1802, sigue «Puck») y los gestos de señalar y celebrar del sprite.
- Tests: `tests/unit/agent/page-context.test.ts` (lectura, resaltado, herramientas y simulador) y las listas de herramientas
  en `tools.test.ts` y `session.test.ts`.
- **Probada con Gemini Live real (2026-11-26):** en el post 7, «¿qué hay en esta página?» usó `pagina_actual`, explicó el post y resaltó la sección correcta; «llévame al AI Lab» navegó con la conversación viva. Ajuste tras la prueba: el saludo recibe la página desde la que se abrió y la personalidad dice que acompaña por todo el sitio, para que no diga «bienvenido al AI Lab» en un post.
