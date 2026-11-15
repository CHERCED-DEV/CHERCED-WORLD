# 033 — Pitch de 60 segundos por caso

Pedido del autor, 2026-11-14 (funcionalidades para entrevistas). Para el reclutador que tiene un minuto. Depende de la
020 y del motor de voz de la 021.

Estado: construida y publicada en dev el 2026-11-15, con la voz del navegador. El autor aprobó los cinco guiones ("Sí, apruébalos"). La voz de Gemini espera la 021.

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

## Cómo quedó (2026-11-15)

- **Guiones (FR-3301):** `content/pitches.ts`, en ES y EN, para los cinco casos de 2026: Synergos, Director y líneas,
  CHERCED-WORLD, el espacio legal y el puente de eventos. Los escribí yo solo con lo que publica cada caso, sin
  Gemini, y las cifras de Synergos salen de `synergosFacts`. Camilo los aprobó el 2026-11-15 y quedaron en
  `approved: true`.
- **Reproductor:** `CasePitch` aparece al final del caso cuando el guion está aprobado. Usa el mismo `ListenPlayer` de
  "Escuchar este post", con la voz del navegador. El texto se renderiza en el servidor, así que se lee sin
  JavaScript y sirve para SEO (FR-3302). Sin voz en el navegador, queda el texto (FR-3303).
- **Pendiente:**
  - la voz de Gemini, que llega con la 021 (P-3301);
  - los guiones de los casos de 2022 y 2023.
- **Para reclutadores (FR-3304):** la ventana del inicio lista "Escucha el pitch (60 s)" con los tres primeros casos
  aprobados (Synergos, Director y líneas y CHERCED-WORLD), y cada enlace lleva al pitch dentro de su caso.
