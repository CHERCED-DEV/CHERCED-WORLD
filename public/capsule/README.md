# Cápsula 2023

Capturas del sitio CHERCED-WORLD en su versión 2023, tomadas mientras seguía en línea y antes del
corte al evolutivo (FR-117, tarea T100).

- **Fecha de captura**: 2026-11-01
- **Origen**: https://cherced-world.vercel.app
- **Herramienta**: Playwright (Chromium), formato WebP sin pérdida
- **Tamaños**: escritorio 1440×900 y móvil 390×844 (viewport CSS, escala 1)

## Archivos

| Ruta | Escritorio | Móvil |
|------|------------|-------|
| `/` | `home-desktop.webp` (1440×900) | `home-mobile.webp` (390×844) |
| `/aboutMe` | `aboutMe-desktop.webp` (1440×900) | `aboutMe-mobile.webp` (390×844) |
| `/services` | `services-desktop.webp` (1440×900) | `services-mobile.webp` (390×1533, página completa) |
| `/portfolio` | `portfolio-desktop.webp` (1425×2085, página completa) | `portfolio-mobile.webp` (390×2392, página completa) |
| `/portfolio/1` | `portfolio-1-desktop.webp` (1440×900) | `portfolio-1-mobile.webp` (390×844) |
| `/blog` | `blog-desktop.webp` (1433×1847, página completa) | `blog-mobile.webp` (390×2423, página completa) |
| `/blog/post1` | `blog-post1-desktop.webp` (1440×900) | `blog-post1-mobile.webp` (390×844) |
| `/contactMe` | `contactMe-desktop.webp` (1440×900) | `contactMe-mobile.webp` (390×1269, página completa) |

`/inbox` no se capturó: es privada.

## Cómo se tomaron

- Se esperó a que terminara la intro (unos 4,5 s, una vez por sesión) y se comprobó en cada ruta que
  ya no estuviera en pantalla, que el contenido hubiera cargado y que las imágenes visibles
  estuvieran completas.
- Por defecto se capturó el viewport. Se tomó la página completa solo donde el viewport cortaba el
  contenido principal: el carrusel de proyectos en `/portfolio`, la lista de posts en `/blog`, las
  tres tarjetas de `/services` en móvil y el formulario de `/contactMe` en móvil.
- En `/services`, `/blog` y `/contactMe` el desplazamiento ocurre dentro de un contenedor de altura
  fija. Para la página completa se le quitó esa altura solo durante la captura y se recorrió la
  página para que cargaran las imágenes diferidas. El contenido no se modificó.
- En móvil se ocultaron las barras de desplazamiento del navegador de escritorio, que un teléfono
  no muestra. No se emuló agente de usuario ni pantalla táctil: es el mismo Chromium con viewport
  de 390×844.
- Las capturas de página completa en escritorio miden 1425 o 1433 px de ancho porque la barra de
  desplazamiento de la ventana queda fuera de la imagen.

## Privacidad

- `/blog/post1` se capturó solo en viewport: los comentarios de visitantes quedan más abajo y no
  aparecen en ninguna imagen.
- El formulario de `/contactMe` aparece vacío.
- El ícono de correo del encabezado muestra el contador público de mensajes sin leer que el sitio
  2023 exponía a cualquier visitante (valor 1 al momento de la captura). No incluye ningún dato
  de los mensajes.
