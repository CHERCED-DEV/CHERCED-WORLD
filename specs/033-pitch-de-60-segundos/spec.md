# 033 — Pitch de 60 segundos por caso

Pedido del autor, 2026-11-14 (funcionalidades para entrevistas). Para el reclutador que tiene un minuto. Depende de la
020 y del motor de voz de la 021.

Estado: spec. No construida.

## Qué hace

Cada caso de estudio y la vitrina de Synergos tienen un botón "Escucha el pitch (60 s)". Suena la voz de Gemini
contando el problema, la decisión clave, el resultado y el stack, con subtítulos sincronizados. En inglés y en español.

## Cómo

1. **Guion.** Gemini propone un guion de unas 140 palabras por caso e idioma, a partir del contenido del caso. El autor
   lo revisa y lo aprueba; el guion aprobado queda versionado como contenido (no se genera en vivo).
2. **Audio.** Con el motor de la 021: TTS una sola vez por guion, idioma y voz, cacheado en Vercel.
3. **Reproductor.** Botón, barra de progreso, subtítulos por frase y transcripción visible sin JavaScript.

## Costo

- Guiones: menos de 0,01 USD en total. Audio: ~0,014 USD por minuto; los 15 casos más Synergos en dos idiomas,
  ~0,45 USD, una sola vez.

## Requisitos

- **FR-3301** Guion aprobado por el autor antes de publicarse (campo `approved` en el contenido).
- **FR-3302** Transcripción del pitch renderizada en el servidor, para SEO y sin JavaScript.
- **FR-3303** Si el audio no está disponible, el botón no aparece y queda la transcripción.
- **FR-3304** Un enlace "Escucha el pitch" en la entrada "Para reclutadores" del inicio, con los 3 casos destacados.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-3301 | ¿La voz del pitch es la misma de Mini Cherced? | Sí, para que suene a un mismo personaje |
