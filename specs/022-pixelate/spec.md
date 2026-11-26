# 022 — Pixélate: tu foto como chibi pixel art

Propuesta de la 018 (ola 3), en la línea del pedido del autor del 2026-11-14 ("cosas súper locas y bonitas", "me
gusta mucho el pixel art"). Depende de la 020.

Estado: construida el 2026-11-15 como tarjeta **P1** (ver «Cómo quedó»).

## Qué hace

El visitante sube una foto suya (o se toma una con la cámara) y Gemini la convierte en un chibi pixel art con el
estilo de Mini Cherced: cabeza grande, contorno verde `#25ED9E`, fondo negro de pantalla CRT. Puede descargarla y,
si quiere, verla parada junto a Mini Cherced en el escenario.

## Cómo

- Modelo de imagen de Gemini ("Nano Banana 2", `gemini-3.1-flash-image`) con edición a partir de la foto y una
  instrucción fija de estilo que no se puede cambiar desde el navegador.
- La foto va al servidor, que la reduce y la manda a Gemini. **No se guarda:** ni la foto ni el resultado.
- Moderación: si Gemini rechaza la imagen, el escenario dice que no pudo y no muestra nada.

## Costo estimado

- ~0,045 USD por imagen a 512 px; ~0,067 a 1024 px. No hay cuota gratis para imágenes.
- Tope sugerido: 2 imágenes por visitante al día y 20 en total al día (~1,3 USD diarios como máximo).

## Requisitos

- **FR-2201** Subir o tomar una foto; solo imágenes, máximo 5 MB, reducidas en el servidor.
- **FR-2202** Consentimiento explícito: la foto va a Google para generar la imagen y no se guarda en el sitio.
- **FR-2203** Resultado descargable en PNG, con la marca del AI Lab en una esquina.
- **FR-2204** Topes por visitante y por día (FR-2002) y mensaje claro al llegar al tope.
- **FR-2205** Accesible: el resultado lleva texto alternativo y la carga se anuncia.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2201 | ¿Se puede usar con fotos de otras personas? | El aviso pide que sea la propia o con permiso |
| P-2202 | ¿Resolución? | 512 px, para gastar menos |

## Cómo quedó (2026-11-15)

- **Tarjeta P1** en «Con Gemini», después de A8.
- **FR-2201** Se sube, se arrastra, se pega o se toma con la cámara (`capture="user"` en el móvil). JPG, PNG o WebP hasta
  5 MB; el navegador la reduce a 768 px en JPEG antes de enviarla (el servidor rechaza más de ~2 MB). Hay «Probar con la
  foto de Camilo», el retrato público de «Sobre mí», para verlo sin subir una cara.
- `POST /api/ailab/pixel` manda la foto a `gemini-3.1-flash-image` con `responseModalities: ['IMAGE']` y una instrucción de
  estilo fija en el servidor (`PIXEL_STYLE`): chibi, píxeles cuadrados, contorno `#25ED9E`, fondo negro CRT, sin texto.
- **P-2202** Pide 512 px (`imageConfig.imageSize: '512'`, cuadrada). Si el modelo no acepta ese campo, responde 400 sin
  costo y se reintenta sin el tamaño.
- **FR-2202** Consentimiento único de Gemini (020) más el aviso de la tarjeta: la foto va a Google, no se guarda nada y
  debe ser propia o con permiso (P-2201).
- **FR-2203** El navegador pinta el resultado en 512 × 512 sobre negro, con la marca «AI LAB · CHERCED-WORLD» en la esquina,
  y lo deja descargar en PNG. Se muestra parado junto a Mini Cherced en un escenario CRT.
- Moderación: si Gemini bloquea la foto o no devuelve imagen, la ruta responde `refused` y la tarjeta dice que no pudo, sin
  mostrar nada.
- **FR-2204** 2 imágenes por visitante al día y 20 en total (~1 USD diario como máximo). El gasto sale en el panel.
- **FR-2205** El resultado lleva texto alternativo y la carga se anuncia en una región `status`.
- Sin la clave de Gemini, el simulador pixela la foto en el navegador (48 × 48, colores reducidos y líneas de CRT).
- Tests: `tests/unit/x0/gemini-pixel.test.ts`; el catálogo, la página y los e2e cuentan 17 experimentos.
- **Probada con Gemini real (2026-11-26):** el retrato de «Sobre mí» salió como chibi de 512 × 512 en 8 s, con gafas moradas y barba, junto a Mini Cherced.
