# 028 — Mini Cherced en todo el sitio

Ola 2 de la 018. Se cruza con la 019 (el chibi del pie que corre al AI Lab). Depende de la 020.

Estado: spec. No construida.

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
