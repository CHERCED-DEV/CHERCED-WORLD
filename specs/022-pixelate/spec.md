# 022 — Pixélate: tu foto como chibi pixel art

Propuesta de la 018 (ola 3), en la línea del pedido del autor del 2026-11-14 ("cosas súper locas y bonitas", "me
gusta mucho el pixel art"). Depende de la 020.

Estado: spec. No construida.

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
