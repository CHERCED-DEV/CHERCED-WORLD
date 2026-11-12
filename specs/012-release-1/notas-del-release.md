# Release 1: notas (R4.4)

Borrador del 2026-11-12. Producción (`main`) sigue siendo el sitio de 2023, con su último cambio del 2026-11-01. El
release lleva a producción todo lo que hay en `dev`: las specs 001 a 015, en más de 600 commits.

## Lo que ve un visitante

- **Inicio:** el hero con el título actual, el CV en español e inglés y la entrada "Para reclutadores". Un scroll
  pasa del hero a "Ahora trabajo en" (C8), y debajo están los "Proyectos destacados" con el enlace al portafolio.
- **Sobre mí:** las tres escenas, el mapa de tecnologías, la carrera y el índice como pestaña de cristal fija.
- **Servicios:** el mazo de servicios con su detalle.
- **Portafolio:** 15 casos con época y filtros por época y tecnología, en un carrusel que en el celular se recorre
  con el dedo. Cada caso de estudio trae destacados, decisiones en tarjetas, capas, stack, galería y, si existe, el
  sitio en vivo.
- **Synergos:** la vitrina y la arquitectura por dentro, que se lee en capas en el celular.
- **Blog:** 6 posts en español e inglés, etiquetas, catálogo, series, comentarios y reacciones. En el celular, la
  pestaña de navegación muestra el título en curso con la línea de lectura y abre el índice.
- **AI Lab:** 11 experimentos que corren en el navegador: voz, plugins y skills, el buscador por palabras y por
  significado, el simulador de sagas, las vitrinas y dos juegos. Ningún modelo se descarga sin permiso.
- **Ahora (`/now`), Contacto y Privacidad.** El formulario de contacto tiene antispam.
- **Navegación estándar:** las páginas con secciones usan la misma pestaña y los mismos puntos.
- **Celular:** dock inferior, hojas y gestos. Todo el sitio está en español e inglés, y al cambiar de idioma se
  queda en la misma página.
- **Pie:** el botón "Cuidado, no tocar".

## Lo que ve el autor

- El buzón privado (`/inbox`): mensajes, comentarios, posts y ajustes. La sesión vence a los 7 días, cambiar la
  contraseña cierra todas las sesiones y el hash usa scrypt con N=2^17.
- El ícono del buzón lleva a los visitantes a Contacto y al autor, al panel (D-R1).

## Calidad

- **SEO:** títulos, descripciones, canónicas, `hreflang`, JSON-LD, imágenes para redes y sitemap. Se revisaron las
  92 URLs (R4.2).
- **Seguridad:** cabeceras (`frame-ancestors 'self'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`). La
  revisión de R4.1 no encontró nada alto.
- **Pruebas:** 2.137 unitarias, lint y tipos, que Vercel corre antes de compilar, más las e2e de cada cambio. La
  suite exhaustiva corre aparte y no bloquea el release (R4.3).

## Conocido, para después del release

- La suite exhaustiva está verificando el tiempo de respuesta al tocar los lóbulos de `/es/aboutMe` a 375 px con la
  CPU 4 veces más lenta: dio 370 ms contra un tope de 200 ms.
- Ítems 6 a 12 de la auditoría de diseño. El 7 y el 11 necesitan el texto del autor.
- Decidir si se quitan los enlaces de temas del hero del AI Lab, que repiten la pestaña.
- R5.3: dominio, Search Console, Bing, enlaces y medición.

## Antes de publicar (puertas)

1. El CV nuevo del autor (R2.5).
2. El QA del autor en su teléfono y su tablet (R4.4), sobre la dirección fija de `dev`:
   https://cherced-world-git-dev-cherceddevs-projects.vercel.app
   - Inicio: un scroll del hero al panel y otro de vuelta; la vitrina y "Ver los 15 proyectos".
   - Portafolio: los filtros, el carrusel con el dedo y un caso de estudio completo.
   - Sobre mí, Servicios, Synergos y la arquitectura: la pestaña y los puntos.
   - Un post en el celular: la pestaña con la línea de lectura y el índice.
   - Contacto: enviar un mensaje de prueba y verlo en el buzón.
   - Cambiar de idioma y de tema en dos páginas.
3. La confirmación explícita del autor para pasar `dev` a `main` (R5.1) y el smoke en producción (R5.2).
