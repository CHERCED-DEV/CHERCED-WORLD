# Release 1: notas (R4.4)

Borrador del 2026-11-12, al día el 2026-11-14. Producción (`main`) sigue siendo el sitio de 2023, con su último cambio
del 2026-11-01. El release lleva a producción todo lo que hay en `dev`: las specs 001 a 018, la 029 y la 031, en más de 600 commits.

## Lo que ve un visitante

- **Inicio:** el hero con el título actual, el CV en español e inglés y la entrada "Para reclutadores". Un scroll
  pasa del hero a "Ahora trabajo en" (C8), y debajo están los "Proyectos destacados" con el enlace al portafolio.
- **Sobre mí:** las tres escenas, el mapa de tecnologías, la carrera y el índice como pestaña de cristal fija.
- **Servicios:** el mazo de servicios con su detalle.
- **Portafolio:** 15 casos con época y filtros por época y tecnología, en un carrusel que en el celular se recorre
  con el dedo. Cada caso de estudio trae destacados, capas, stack, galería y, si existe, el sitio en vivo. Synergos y
  los casos 2, 13, 14 y 15 traen además sus decisiones en tarjetas.
- **Synergos:** la vitrina y la arquitectura por dentro, que se lee en capas en el celular.
- **Blog:** 7 posts en español e inglés, etiquetas, catálogo, series, comentarios y reacciones. Cada post se puede
  escuchar ("Escuchar este post"). En el celular, la pestaña de navegación muestra el título en curso con la línea de
  lectura y abre el índice.
- **AI Lab:** 13 experimentos. Once corren en el navegador: voz, plugins y skills, el buscador por palabras y por
  significado, el simulador de sagas, las vitrinas y dos juegos. Ningún modelo se descarga sin permiso. Dos corren en
  Google:
  - **"Habla con mi portafolio"** (018): Mini Cherced, el chibi pixel art del autor, conversa por voz con Gemini Live,
    conoce todo el sitio y te lleva a la página que pidas. Su panel "Cómo pensó" (031) muestra la traza de cada
    respuesta: herramientas, tiempos, tokens y costo en dólares y pesos.
  - **"¿Encajo en tu vacante?"** (029): el reclutador pega una vacante y ve, requisito por requisito, la evidencia
    publicada en el sitio, con un resumen en PDF y un enlace a Contacto con el mensaje ya escrito.
- **Ahora (`/now`), Contacto y Privacidad.** El formulario de contacto tiene antispam. Privacidad explica qué se
  guarda al ingresar con Google.
- **Cuentas:** "Ingresar" en la barra, con la cuenta de Google. Con la cuenta se comenta sin escribir nombre ni correo,
  y desde "Mi cuenta" se cierra la sesión o se borra la cuenta con sus comentarios.
- **Navegación estándar:** las páginas con secciones usan la misma pestaña y los mismos puntos.
- **Celular:** dock inferior, hojas y gestos. Todo el sitio está en español e inglés, y al cambiar de idioma se
  queda en la misma página.
- **Pie:** el botón "Cuidado, no tocar".

## Lo que ve el autor

- El buzón privado (`/inbox`): mensajes, comentarios, posts y ajustes. La sesión vence a los 7 días, cambiar la
  contraseña cierra todas las sesiones y el hash usa scrypt con N=2^17.
- Publicar desde el panel (016): el Taller del blog publica, actualiza y despublica posts sin compilar ni hacer
  commit.
- **Personas** (017): dar a una cuenta de Gmail permiso para escribir posts, leer mensajes o moderar comentarios;
  bloquear o borrar cuentas. Los posts de un invitado llegan "En revisión" y solo el autor los publica, con la firma del
  invitado.
- El ícono del buzón lleva a los visitantes a Contacto y al autor, al panel (D-R1).

## Calidad

- **SEO:** títulos, descripciones, canónicas, `hreflang`, JSON-LD, imágenes para redes y sitemap. Se revisaron las
  92 URLs (R4.2).
- **Seguridad:** cabeceras (`frame-ancestors 'self'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`). La
  revisión de R4.1 no encontró nada alto. El ingreso con Google usa PKCE, `state` y `nonce`, y la sesión de las
  cuentas va en su propia cookie httpOnly.
- **Pruebas:** más de 2.160 unitarias, lint y tipos, que Vercel corre antes de compilar, más las e2e de cada cambio.
  La suite exhaustiva se detuvo por decisión del autor: se prueba lo que se entrega (R4.3).

## Conocido, para después del release

- Ítems 6 a 12 de la auditoría de diseño. El 7 y el 11 necesitan el texto del autor.
- Decidir si se quitan los enlaces de temas del hero del AI Lab, que repiten la pestaña.
- Botón de WhatsApp (R2.9): falta el número y dónde va.
- El post 2 (D-R2).
- R5.3: dominio, Search Console, Bing, enlaces y medición.

## Antes de publicar (puertas)

1. El CV nuevo del autor (R2.5).
2. El ingreso con Google configurado (R3.9): el cliente OAuth y `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en
   Vercel, para Production y Preview. Pasos en `../017-cuentas-e-ingreso/configurar-google.md`. Sin ellas, "Ingresar"
   lleva a una página que dice que el ingreso todavía no está activo.
3. Gemini activo (018): la clave nueva (la primera apareció en el chat) en `GEMINI_API_KEY` de Vercel, para
   Production y Preview, y saldo prepagado en AI Studio. Pasos en `../018-ia-de-google/configurar-gemini.md`. Sin
   ella, "Habla con mi portafolio" y "¿Encajo en tu vacante?" dicen que todavía no están activos.
4. El QA del autor en su teléfono y su tablet (R4.4), sobre la dirección fija de `dev`:
   https://cherced-world-git-dev-cherceddevs-projects.vercel.app
   - Inicio: un scroll del hero al panel y otro de vuelta; la vitrina y "Ver los 15 proyectos".
   - Portafolio: los filtros, el carrusel con el dedo y un caso de estudio completo, con sus tarjetas de decisiones.
   - Sobre mí, Servicios, Synergos y la arquitectura: la pestaña y los puntos.
   - El post 7 en el celular: la pestaña con la línea de lectura, el índice y "Escuchar este post".
   - Contacto: enviar un mensaje de prueba y verlo en el buzón.
   - Ingresar con Google, comentar un post con la cuenta y aprobar el comentario en el panel.
   - Personas: dar un permiso a otra cuenta de Gmail y ver que entra solo a lo suyo.
   - Cambiar de idioma y de tema en dos páginas.
   - AI Lab → "Habla con mi portafolio": conversar por voz en el teléfono, preguntarle por un proyecto y pedirle que te
     lleve a una página. Abrir "Cómo pensó" y ver el costo de cada respuesta.
   - AI Lab → "¿Encajo en tu vacante?": pegar una vacante real, abrir la evidencia de una fila, sacar el resumen en PDF
     y ver que Contacto llega con el mensaje escrito.
5. La confirmación explícita del autor para pasar `dev` a `main` (R5.1) y el smoke en producción (R5.2). El mismo día,
   el autor crea la contraseña del panel en producción con el código de un solo uso de los logs.
