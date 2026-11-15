# 026 — Texto → diagrama (A9)

Del catálogo de la 003 (A9, variante B), habilitado por la 018. Depende de la 020.

Estado: construida el 2026-11-15 como la tarjeta A9 del tema «Con Gemini».

## Qué hace

"Un BFF que llama a tres servicios y una cola" se vuelve un diagrama de arquitectura en vivo, con el estilo visual de
la arquitectura de Synergos del sitio. Se puede pedir un cambio ("agrega un caché") y el diagrama se actualiza.

## Cómo

- Gemini de texto con salida estructurada: nodos, conexiones y grupos en JSON con esquema.
- El sitio dibuja el diagrama con su propio SVG; nunca ejecuta código generado por el modelo.
- Exportar como SVG o PNG.

## Costo estimado

- Menos de 0,01 USD por diagrama.

## Requisitos

- **FR-2601** Esquema validado en el servidor y límite de 40 nodos.
- **FR-2602** Pedir cambios sobre el diagrama actual, con historial de deshacer.
- **FR-2603** Accesible: el diagrama tiene una descripción en texto y una lista navegable de nodos.
- **FR-2604** Consentimiento de la 020.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2601 | ¿Reutilizar el dibujo de la arquitectura de Synergos o uno nuevo en pixel art? | Reutilizar el de Synergos |

## Cómo quedó (2026-11-15)

- **Servidor (FR-2601):** `POST /api/ailab/diagram` pide a `gemini-3.8-flash` el diagrama como JSON con esquema y lo
  valida con Zod (ids únicos, conexiones y grupos válidos, máximo 40 nodos y 5 grupos). Límite: 10 por visitante y
  100 en total al día.
- **Dibujo (P-2601):** reutiliza el motor de la pizarra de la 034, que acomoda por capas y dibuja en SVG con el verde y
  el negro del sitio. Nunca ejecuta código del modelo.
- **Cambios (FR-2602):** "Pide un cambio" manda el diagrama actual y la petición; el historial guarda los últimos 20 y
  "Deshacer" vuelve al anterior.
- **Exportar:** SVG y PNG (a doble resolución).
- **Accesible (FR-2603):** el SVG tiene una descripción y debajo hay una lista navegable de nodos y conexiones.
- **Consentimiento (FR-2604):** el común de la 020, que vale para la sesión.
- **Simulador:** sin la clave, un diagrama de ejemplo y un cambio visible.
