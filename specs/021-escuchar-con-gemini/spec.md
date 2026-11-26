# 021 — "Escuchar este post" con voz de Gemini

Pedido del autor, 2026-11-14: "el motor de lectura es muy básico, debería ser más humano, por eso debemos ponerle
Gemini". Depende de la 020.

Estado: construida el 2026-11-15 (ver «Cómo quedó»). Pendientes del autor: elegir las voces (P-2101) y decidir la pregeneración (P-2102).

## Qué hace

"Escuchar este post" (005) y la tarjeta V3 dejan de usar las voces del navegador y pasan a una voz natural de Gemini
(TTS), en español y en inglés, con la misma pausa, el mismo "seguir escuchando" y el mismo resaltado por frase.

## Cómo

- El servidor convierte cada fragmento del post (las mismas frases que hoy lee el motor) en audio con Gemini TTS
  (`gemini-3.8-flash-tts`, configurable) y lo sirve como un archivo de audio.
- **Se paga una sola vez por fragmento:** la ruta responde con caché larga de Vercel, con la clave del post, el
  idioma, el fragmento y la voz. Un post que no cambia no se vuelve a generar.
- Si Gemini no está disponible, el lector vuelve a las voces del navegador sin romperse.
- La voz se elige entre 2 o 3 voces de Gemini por idioma, y la velocidad la controla el reproductor.

## Costo estimado

- 0,0135 USD por minuto de audio hasta el 31 de diciembre de 2026; el doble desde 2027.
- Un post de 10 minutos cuesta ~0,14 USD por idioma y por voz, una sola vez. Los 7 posts en dos idiomas, ~2 USD.

## Arreglos que vienen con esto

- **Bug de V3 visto por el autor:** los selectores de voz y velocidad no se dejan usar, y el de velocidad se sale por la
  derecha de la tarjeta.

## Requisitos

- **FR-2101** Audio por fragmento, cacheado en Vercel, con la voz y el idioma en la clave.
- **FR-2102** Mismo reproductor y mismos controles que hoy, más el selector de voces de Gemini.
- **FR-2103** Respaldo automático a la voz del navegador si Gemini falla, sin mensaje de error al lector.
- **FR-2104** Nada del visitante va a Google: solo el texto público del post.
- **FR-2105** Los selectores de V3 funcionan con mouse, teclado y toque, y caben a 320 px.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2101 | ¿Qué voces? | Una masculina y una femenina por idioma, a elegir por el autor |
| P-2102 | ¿Pregenerar todos los posts antes de 2027 para pagar la mitad? | Sí, al subir esto |

## Cómo quedó (2026-11-15)

- **FR-2101** `GET /api/listen?s=…&l=…&v=…&t=…` (`app/api/listen/route.ts`) convierte una frase en WAV con
  `gemini-3.8-flash-tts` y responde con `s-maxage` de un año e `immutable`. Además guarda el audio en la caché de datos
  de Vercel (`unstable_cache`, clave: fuente, idioma, voz y hash de la frase), que sobrevive a los despliegues: una frase
  se paga una vez. El lector adelanta la frase siguiente mientras suena la actual.
- **FR-2104** Solo se convierte texto público: la ruta valida que la frase exista en el MDX del post (o en el post
  publicado desde el panel, el pitch del caso o el ejemplo de V3), sin importar el formato. Se probó con las 354 frases
  de los 7 posts en los dos idiomas: todas pasan. Una frase inventada recibe 403 y no cuesta nada.
- **Topes:** 150 frases nuevas por visitante al día y 600 en total (~2 USD al día como máximo). Solo cuentan las frases
  que se generan; las que ya están en caché no. El gasto sale en el panel como «Voz de Gemini en los posts».
- **FR-2102** El reproductor del post y el pitch de 60 s de los casos usan el mismo motor (`lib/ailab/voice/tts.ts`) con
  un adaptador de Gemini (`lib/ai/listen/client.ts`): misma pausa, «Seguir escuchando», Esc y resaltado por frase. Si
  Gemini está disponible aparecen dos chips de voz: Charon (grave) y Kore (clara); la elección se recuerda en el
  navegador.
- **FR-2103** Si Gemini no está, falla o se alcanza un tope, el lector sigue con la voz del navegador desde esa frase,
  sin mensaje de error.
- **FR-2105** El bug de V3: los selectores se bloqueaban mientras leía. Ahora voz, velocidad y motor se cambian en
  plena lectura y el lector retoma desde la frase actual (`speak(..., { from })`). La velocidad y las voces de Gemini son
  chips de radio nativos de 44 px que funcionan con toque, mouse y teclado y caben a 320 px. V3 ofrece «Motor de voz:
  Gemini o tu navegador» cuando hay Gemini; sin Gemini se ve igual que antes.
- P-2102 (pregenerar los posts antes de 2027) queda para el autor: generar los 7 posts en dos idiomas cuesta ~2 USD y
  no se hizo sin su permiso. Basta con escuchar cada post una vez con cada voz.
- Tests: `tests/unit/listen/listen.test.ts` (validación, corpus, WAV, ruta, adaptador, respaldo y `from`).
- **Probada con Gemini real (2026-11-26):** el post 7 sonó frase a frase con Charon, cada frase un WAV válido (el título, 3,3 s), con la siguiente adelantada. La caché devuelve el mismo audio en 40 ms. En `next dev`, una petición con `Cache-Control: no-cache` se salta la caché a propósito; en producción el navegador no la manda.
