# 021 — "Escuchar este post" con voz de Gemini

Pedido del autor, 2026-11-14: "el motor de lectura es muy básico, debería ser más humano, por eso debemos ponerle
Gemini". Depende de la 020.

Estado: spec. No construida.

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
