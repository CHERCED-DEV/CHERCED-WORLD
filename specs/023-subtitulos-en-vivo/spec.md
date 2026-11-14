# 023 — Subtítulos en vivo español ↔ inglés (V6)

Del catálogo de la 003 (V6, camino B), habilitado por la 018. Depende de la 020.

Estado: spec. No construida.

## Qué hace

El visitante habla en español y aparecen subtítulos en inglés en tiempo real, y al revés. Opcional: escuchar la
traducción en voz. Sirve para mostrar cómo Camilo presentaría en una entrevista en inglés.

## Cómo

- Live API con el modelo de traducción en vivo (`gemini-3.5-live-translate-preview`) y el mismo patrón de V5: token de
  un solo uso desde el servidor, audio directo del navegador a Google, sesión corta.
- Reutiliza el micrófono, el reproductor y el cliente de Live de la 018 (`lib/ai/agent/`).

## Costo estimado

- ~0,005 USD por minuto de audio que entra y ~0,03 por minuto de voz traducida. Solo subtítulos (sin voz), mucho menos.
- Tope sugerido: sesiones de 3 minutos.

## Requisitos

- **FR-2301** Elegir la dirección (ES → EN o EN → ES) y si se escucha la voz traducida.
- **FR-2302** Subtítulos grandes, legibles a 320 px, con el original arriba y la traducción abajo.
- **FR-2303** Consentimiento de la 020 antes de abrir el micrófono.
- **FR-2304** Exportar la transcripción como `.srt`, como hace hoy V1.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2301 | ¿Voz traducida activa por defecto? | No, solo subtítulos |
