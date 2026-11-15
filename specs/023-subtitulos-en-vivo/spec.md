# 023 — Subtítulos en vivo español ↔ inglés (V6)

Del catálogo de la 003 (V6, camino B), habilitado por la 018. Depende de la 020.

Estado: construida el 2026-11-15 como tarjeta **V6** (ver «Cómo quedó»). Falta la primera sesión real con Gemini (~0,05 USD), con permiso del autor.

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

## Cómo quedó (2026-11-15)

- **Tarjeta V6** en «Con Gemini», justo después de Mini Cherced (V5).
- **Modelo:** en vez de `gemini-3.5-live-translate-preview`, que no se pudo validar sin gastar a ciegas, usa el mismo
  modelo de Live de V5 (`gemini-3.8-live`, ya probado por el autor) con una instrucción de intérprete que solo deja
  traducir: no responde, no saluda y no comenta. Cambiar al modelo de traducción es cambiar una constante cuando se
  pruebe.
- `POST /api/ailab/subtitles` pide un token de un solo uso con esa instrucción, sin herramientas, con las dos
  transcripciones y una sesión de 3 minutos (`createLiveToken` ahora acepta otra configuración de Live). El audio va
  directo del navegador a Google, como en V5.
- **FR-2301** Dirección español → inglés o inglés → español con chips, y «Escuchar la traducción en voz» apagado por
  defecto (P-2301). Apagado, el audio que llega no se reproduce.
- **FR-2302** Pantalla negra con el original arriba, más pequeño, y la traducción abajo, grande y legible a 320 px. Un
  desplegable guarda lo que va de la sesión.
- **FR-2303** Consentimiento único de Gemini (020) antes de abrir el micrófono.
- **FR-2304** Descarga en `.srt` de la traducción o bilingüe (original y traducción en cada subtítulo), con el mismo
  exportador de V1.
- Topes: 3 sesiones por visitante al día y 30 en total. El gasto sale en el panel.
- Traduce al final de cada frase (cuando detecta la pausa), no palabra por palabra.
- Sin la clave de Gemini, el simulador reproduce un ejemplo grabado en la dirección elegida.
- Tests: `tests/unit/x0/gemini-subtitles.test.ts`; el catálogo, la página y los e2e cuentan 18 experimentos.
