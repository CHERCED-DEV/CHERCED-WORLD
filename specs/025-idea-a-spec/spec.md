# 025 — De idea a spec, ADR y haiku del commit (A7, A8 y C3)

Del catálogo de la 003 (A7, A8 y C3, camino B), habilitado por la 018. Depende de la 020.

Estado: spec. No construida.

## Qué hace

Tres herramientas que muestran cómo trabaja Camilo con Spec Kit, en una sola tarjeta con pestañas:

- **De idea a spec:** una línea de idea genera `spec.md`, `plan.md` y `tasks.md` al estilo de este mismo repo.
- **Generador de ADR:** describes una decisión y sale el ADR con contexto, opciones, trade-off y disparador de
  revisión, con el formato de las tarjetas de decisiones del portafolio.
- **Haiku del commit:** pegas un diff y sale un mensaje de commit serio y un haiku.

## Cómo

- Gemini de texto (`gemini-3.5-flash-lite` o `gemini-3.8-flash`) con respuesta en streaming y salida estructurada.
- Ejemplos reales del repo (specs y ADR públicos) como guía de estilo en la instrucción.
- Se descarga el resultado como `.md`. No se guarda nada en el sitio.

## Costo estimado

- Menos de 0,01 USD por uso. Es lo más barato del laboratorio.

## Requisitos

- **FR-2501** Respuesta en streaming, con el texto apareciendo mientras se genera.
- **FR-2502** Descargar como `.md` o copiar.
- **FR-2503** Límite de entrada: 2.000 caracteres para la idea y 20.000 para el diff.
- **FR-2504** Consentimiento de la 020 (el texto va a Google).

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2501 | ¿Los ejemplos de estilo salen de specs reales del repo? | Sí, solo de los públicos |
