# Inventario de contenido: Evolutivo CHERCED-WORLD 2026

**Propósito**: dejar listo el contenido que migra la lane Foundation (L0): qué existe, qué se corrige, qué
decidió el autor, qué falta y los textos bilingües que requerían decisión editorial.
**Created**: 2026-11-01
**Feature**: [spec.md](./spec.md) (FR-004, FR-064, FR-075, FR-083)
**Formato**: agnóstico. El formato final de los archivos de contenido lo define `/speckit.plan`.

## 1. Decisiones del autor (2026-11-01)

| ID | Tema | Decisión |
|----|------|----------|
| D-01 | Carrera desactualizada (Newshore "Jul 22 – Actually") | Queda pendiente (P-01). No se publica la sección de carrera sin el texto del autor. |
| D-02 | Ícono de Facebook que apunta a una noticia de BBC Mundo | Se reemplaza por el perfil real del autor (URL pendiente, P-02). |
| D-03 | Descripciones en tercera persona con tono genérico | Se reescriben en primera persona, con los mismos hechos y sin agregar ninguno. |
| D-04 | Skills como barras de porcentaje | Se conservan con los mismos valores y se rediseñan en glass. |
| D-05 | Asistente | Responde sin modelo externo, solo con contenido publicado (spec FR-096). |

## 2. Pendientes del autor

Estos huecos se publican solo cuando el autor entregue el texto. Mientras tanto, la lane L0 deja el campo
marcado como pendiente y la sección afectada no se muestra.

| ID | Pendiente | Dónde aplica |
|----|-----------|--------------|
| P-01 | Experiencia 2022–2026: fecha de fin en Newshore y empleos posteriores (empresa, cargo, fechas, una línea de qué hace) | Sobre mí → Carrera |
| P-02 | URL del perfil real de Facebook | Footer → redes |
| P-03 | Estado en 2026 de "Ingeniería de Sistemas, UNAD (2020 – Actually)": ¿en curso o graduado, y en qué año? | Sobre mí → Educación |
| P-04 | Valores de skills: se conservan los de 2023 (D-04). Si el autor quiere actualizarlos a 2026, los entrega aquí | Sobre mí → Skills |
| P-05 | Derechos de uso de dos imágenes de terceros (ver sección 7) | Blog post3, assets |
| P-06 | Revisión del borrador de la política de privacidad (responsable, finalidad, conservación y canal para consultar o eliminar datos) | Página de privacidad (FR-036) |

## 3. Inventario de fuentes (2023)

| Bloque | Fuente en el repo 2023 | Volumen | Estado |
|--------|------------------------|---------|--------|
| Header y footer | `pages/api/customCMS/CMS.ts` → `layOut` | logo, menú, back-to-top, 4 redes, copyright | Corregir (C-01, D-02) |
| Banner del home | `CMS.ts` → `homeBanner` | 3 textos, 3 redes | Traducir |
| Sobre mí: descripción | `CMS.ts` → `aboutMe.description` | 1 párrafo | Reescrito (sección 6) |
| Sobre mí: carrera | `CMS.ts` → `aboutMe.career` | 4 empleos | Reescrito; Newshore pendiente (P-01) |
| Sobre mí: skills | `CMS.ts` → `aboutMe.skills` | 10 viñetas, 12 tecnologías con % | Traducir; barras se conservan |
| Sobre mí: educación | `CMS.ts` → `aboutMe.education` | 3 títulos | Corregir fechas; UNAD pendiente (P-03) |
| Sobre mí: cursos | `CMS.ts` → `aboutMe.courses` | 4 escuelas, 4 descripciones, enlace a Platzi | Traducir |
| Sobre mí: idiomas | `CMS.ts` → `aboutMe.idioms` | 2 idiomas con % | Corregir título (C-05) |
| Servicios | `CMS.ts` → `portfolio.wcfu` y `portfolio.services` | 1 intro, 3 servicios | Intro reescrita; servicios traducidos |
| Intro del portafolio | `CMS.ts` → `portfolio.projects.description` | 3 párrafos | Traducir con corrección ligera |
| Proyectos | `pages/api/projects/database/data.ts` | **11** proyectos (ids 1–11) | Migrar a caso de estudio (sección 8) |
| Contacto | `CMS.ts` → `contactMe` | título, descripción, 4 campos, botón | Corregir (C-08) |
| Intro del blog | `pages/api/blog/blogData/database/blog.cms.ts` | título, bienvenida, formulario | Reescrito (sección 6) |
| Posts | `pages/api/blog/posts/database/posts.data.ts` | 3 posts (`post1`–`post3`) | Migrar (sección 9) |
| Metadatos por página | `<Head>` de cada archivo en `pages/` | 8 títulos y descripciones | Nuevos (sección 5.4) |
| Mensajes de interfaz | componentes (alertas, botones, títulos) | ~25 textos | Nuevos (sección 5) |

## 4. Correcciones mecánicas (ya decididas por la constitución)

| ID | 2023 | Corrección | Dónde |
|----|------|------------|-------|
| C-01 | `@2023 Camilo Hernandez` / `All Rigths Reserved` | `© 2023–<año en curso> Camilo Hernandez. All rights reserved.` | Footer |
| C-02 | `endingDate: "Actually"` / `"actually"` | `Present` / `Actualidad`, o la fecha real (P-01, P-03) | Carrera, educación |
| C-03 | `Bussines Manager` | `Business Manager` | Carrera |
| C-04 | `Desing` (título e ícono) | `Design` | Servicios |
| C-05 | `Idioms` / `idiom` | `Languages` / `Idiomas` | Sobre mí |
| C-06 | `Quantic Theathrum` | `Quantic Theatrum` (coincide con su URL) | Proyecto 1 |
| C-07 | `company knowledge of` | `professional knowledge of` | Sobre mí |
| C-08 | `With 3 years of experience` (desactualizado en 2026) | `Building for the web since 2020` (dato de la carrera: Growup IT, ene 2020) | Contacto |
| C-09 | `And other shools` | `And other schools` | Cursos |
| C-10 | `welcomeMenssage` con "i do this space", "seccion" | Reescrito (sección 6) | Blog |
| C-11 | `send me a post!` (es un formulario de comentarios) | `Leave a comment` | Blog |
| C-12 | Título "Comentarios" y botón "enviar" en un sitio en inglés | Por idioma (sección 5) | Post |
| C-13 | `alt: "separator line"` en las 3 imágenes de posts | Alt real (sección 9) | Posts |
| C-14 | `alt: "My Website"` en la imagen de CHERCED-WORLD | `CHERCED-WORLD portfolio on mobile` | Proyecto 2 |
| C-15 | Fechas "20", "11", "16" | `2020`, `2011`, `2016` | Educación |
| C-16 | Alerta "Thank you for contacting us" | Primera persona: "me" | Contacto |
| C-17 | `blogCms.img.src: /assets/imgs/mePortfolio.jpg` (el archivo no existe) | Usar una imagen existente o retirar | Blog |

## 5. Textos cortos e interfaz (EN / ES)

### 5.1 Navegación y marca

| Clave | EN | ES |
|-------|----|----|
| nav.home | Home | Inicio |
| nav.about | About me | Sobre mí |
| nav.services | Services | Servicios |
| nav.portfolio | Portfolio | Portafolio |
| nav.blog | Blog | Blog |
| nav.contact | Contact me | Contáctame |
| nav.back | Back | Regresar |
| nav.backToTop | BACK TO TOP | VOLVER ARRIBA |
| intro.name | CHERCED | CHERCED |
| intro.role | Front-End Developer | Desarrollador Front-End |
| intro.skip | Skip intro | Saltar intro |
| home.greeting | My name is | Mi nombre es |
| home.name | Camilo | Camilo |
| home.title | I'M A DEVELOPER | SOY DESARROLLADOR |
| footer.rights | All rights reserved. | Todos los derechos reservados. |
| notFound.title | This page drifted out to sea | Esta página se fue mar adentro |
| notFound.cta | Back to home | Volver al inicio |
| error.title | Something went wrong | Algo salió mal |
| error.cta | Try again | Intentar de nuevo |

### 5.2 Formularios y mensajes

| Clave | EN | ES |
|-------|----|----|
| contact.title | Contact | Contacto |
| contact.name | Your name | Tu nombre |
| contact.email | Your email | Tu correo |
| contact.phone | Phone number (optional) | Teléfono (opcional) |
| contact.message | Your message | Tu mensaje |
| contact.submit | Send | Enviar |
| contact.success.title | Sent! | ¡Enviado! |
| contact.success.text | Thanks for reaching out. I'll get back to you soon. | Gracias por escribirme. Te respondo pronto. |
| contact.error.text | Your message couldn't be sent. Nothing was lost, try again in a moment. | No se pudo enviar tu mensaje. No se perdió nada; intenta de nuevo en un momento. |
| contact.rateLimited | You've sent several messages in a short time. Please try again in a few minutes. | Enviaste varios mensajes en poco tiempo. Intenta de nuevo en unos minutos. |
| form.required | This field is required | Este campo es obligatorio |
| form.email.invalid | Enter a valid email | Escribe un correo válido |
| form.tooLong | Maximum {max} characters | Máximo {max} caracteres |
| comments.title | Comments | Comentarios |
| comments.form.title | Leave a comment | Deja un comentario |
| comments.form.name | Your name | Tu nombre |
| comments.form.email | Your email (never shown) | Tu correo (nunca se muestra) |
| comments.form.comment | Your comment | Tu comentario |
| comments.form.submit | Send | Enviar |
| comments.pending | Thanks! Your comment is under review. | ¡Gracias! Tu comentario está en revisión. |
| comments.empty | No comments yet. Be the first. | Aún no hay comentarios. Sé el primero. |
| comments.authorBadge | Author | Autor |
| privacy.consent | I authorize the processing of my personal data as described in the {privacyPolicy}. | Autorizo el tratamiento de mis datos personales según la {privacyPolicy}. |
| privacy.policyLink | privacy policy | política de privacidad |
| privacy.required | You need to accept the privacy policy to send this form. | Para enviar este formulario necesitas aceptar la política de privacidad. |
| nav.privacy | Privacy | Privacidad |
| admin.login.title | Sign in | Iniciar sesión |
| admin.login.password | Password | Contraseña |
| admin.login.error | Couldn't sign in. Check your details and try again. | No se pudo iniciar sesión. Revisa tus datos e intenta de nuevo. |
| admin.login.locked | Too many attempts. Try again in a few minutes. | Demasiados intentos. Intenta de nuevo en unos minutos. |
| admin.setup.title | Create the admin password | Crea la contraseña de administrador |
| admin.setup.code | One-time setup code | Código de configuración de un solo uso |
| admin.setup.passwordHint | At least 12 characters | Mínimo 12 caracteres |
| admin.reply | Reply by email | Responder por correo |
| admin.authorReply | Reply as author | Responder como autor |
| admin.connectionLost | Connection lost. Reconnecting… | Se perdió la conexión. Reconectando… |

### 5.3 Experiencia, idioma y tema

| Clave | EN | ES |
|-------|----|----|
| lang.switch | Español | English |
| theme.dark | Dark theme | Tema oscuro |
| theme.light | Light theme | Tema claro |
| palette.open | Search or jump to… | Busca o salta a… |
| palette.hint | Ctrl/⌘ + K | Ctrl/⌘ + K |
| palette.copyEmail | Copy email | Copiar correo |
| palette.copied | Email copied | Correo copiado |
| assistant.open | Ask my portfolio | Pregúntale a mi portafolio |
| assistant.placeholder | Ask about my experience, projects or services | Pregunta por mi experiencia, proyectos o servicios |
| assistant.unknown | I couldn't find that in my portfolio. Want to ask me directly? | No encontré eso en mi portafolio. ¿Quieres preguntarme directamente? |
| assistant.outOfScope | I can only talk about my work, projects and services. | Solo puedo hablar de mi trabajo, mis proyectos y mis servicios. |
| assistant.unavailable | The assistant isn't available right now. | El asistente no está disponible en este momento. |
| post.readingTime | {n} min read | {n} min de lectura |
| post.originalLanguage | Originally written in Spanish | Escrito originalmente en inglés |
| capsule.title | Time capsule: CHERCED-WORLD 2023 | Cápsula del tiempo: CHERCED-WORLD 2023 |

### 5.4 Metadatos por página

| Página | EN: título · descripción | ES: título · descripción |
|--------|--------------------------|--------------------------|
| Home | `<-CHERCED-WORLD->` · Camilo Hernandez's portfolio: front-end and full-stack web development. | `<-CHERCED-WORLD->` · Portafolio de Camilo Hernandez: desarrollo web front-end y full-stack. |
| Sobre mí | About me · Front-end developer with full-stack experience, building beautiful and functional web apps. | Sobre mí · Desarrollador front-end con experiencia full-stack que construye aplicaciones web bonitas y funcionales. |
| Servicios | Services · Web design, development and maintenance built with modern technologies. | Servicios · Diseño, desarrollo y mantenimiento web con tecnologías modernas. |
| Portafolio | Portfolio · Recent projects and case studies. | Portafolio · Proyectos recientes y casos de estudio. |
| Blog | Blog · Notes on web development, technology and the path that got me here. | Blog · Notas sobre desarrollo web, tecnología y el camino que me trajo hasta aquí. |
| Contacto | Contact me · Let's talk: send me a message. | Contáctame · Hablemos: envíame un mensaje. |
| Inbox | Inbox · (no indexar) | Inbox · (no indexar) |

## 6. Textos largos con decisión editorial (EN / ES)

Reglas aplicadas (D-03): primera persona, mismos hechos, cero datos nuevos, voz cercana del autor.

### 6.1 Sobre mí: descripción

- **EN**: I'm a front-end developer with experience building highly interactive, high-performance web
  applications. I specialize in React and Angular, and I have professional knowledge of HTML, CSS,
  JavaScript, TypeScript, Node.js and Next.js.
- **ES**: Soy desarrollador front-end con experiencia construyendo aplicaciones web muy interactivas y de
  alto rendimiento. Me especializo en React y Angular, y tengo conocimiento profesional de HTML, CSS,
  JavaScript, TypeScript, Node.js y Next.js.

### 6.2 Carrera

**Newshore (a FLYR Labs company) · Frontend Developer · Jul 2022 – [P-01]**

- **EN**: I build the user interface and experience of an airline booking website: buttons, menus and
  forms, and navigation that stays easy for customers. I work closely with the back-end team to integrate
  the system, make sure the site works across devices and browsers, and test and debug technical issues.
- **ES**: Construyo la interfaz y la experiencia de usuario de un sitio de reservas de vuelos: botones,
  menús, formularios y una navegación fácil para los clientes. Trabajo de cerca con el equipo de back-end
  para integrar el sistema, me aseguro de que el sitio funcione en distintos dispositivos y navegadores, y
  hago pruebas y depuración de problemas técnicos.
- Nota: el tiempo verbal depende de P-01. Si el empleo terminó, pasa a pasado.

**Platzi Master [CX] · Frontend Developer · Feb 2022 – Jun 2022**

- **EN**: I completed Platzi Master, an online frontend bootcamp: courses in HTML, CSS, JavaScript and
  React, hands-on projects and personalized mentoring from industry professionals, all aimed at landing a
  job in the field.
- **ES**: Completé Platzi Master, un bootcamp online de frontend: cursos de HTML, CSS, JavaScript y React,
  proyectos prácticos y mentoría personalizada con profesionales de la industria, todo orientado a
  conseguir empleo en el área.

**Growup IT · Frontend Developer · Jan 2020 – Nov 2021**

- **EN**: I improved and optimized the existing code of a commercial services company's website: I found
  and fixed performance issues, rewrote and updated code to current standards, and built and maintained
  CSS styles so the site looked and worked well on every device and browser.
- **ES**: Mejoré y optimicé el código existente del sitio web de una empresa de servicios comerciales:
  encontré y resolví problemas de rendimiento, reescribí y actualicé código a los estándares vigentes, y
  construí y mantuve los estilos CSS para que el sitio se viera y funcionara bien en cualquier dispositivo
  y navegador.

**Squadra Arquitectura · Business Manager · Oct 2016 – May 2020**

- **EN**: I founded and ran a company focused on developing and remodeling hospital architecture: I
  managed and supervised construction projects, negotiated with clients and suppliers, and represented
  the company in public tenders.
- **ES**: Fundé y dirigí una empresa dedicada al desarrollo y la remodelación de arquitectura hospitalaria:
  gestioné y supervisé proyectos de construcción, negocié con clientes y proveedores, y representé a la
  empresa en licitaciones públicas.

### 6.3 Servicios: introducción ("How can I help you?")

- **EN**: How can I help you? I'm a full-stack developer working with the MERN stack (MongoDB, Express,
  React and Node.js). I build end-to-end web applications that are fast, secure and scalable, and I can
  help you reach your business goals by designing and developing custom solutions, optimizing
  performance, and providing ongoing support and maintenance.
- **ES**: ¿Cómo te puedo ayudar? Soy desarrollador full-stack y trabajo con el stack MERN (MongoDB,
  Express, React y Node.js). Construyo aplicaciones web de punta a punta rápidas, seguras y escalables, y
  te puedo ayudar a cumplir tus objetivos de negocio diseñando y desarrollando soluciones a la medida,
  optimizando el rendimiento y dando soporte y mantenimiento continuos.

### 6.4 Servicios

| Servicio | EN | ES |
|----------|----|----|
| Design / Diseño | I can design your website based on your needs and ideas, or create it from scratch while consulting with you along the way. | Puedo diseñar tu sitio a partir de tus necesidades e ideas, o crearlo desde cero consultándote durante el proceso. |
| Development / Desarrollo | Starting from a design of mine or one you send me, I can build a fully functional, responsive website. | A partir de un diseño mío o de uno que me envíes, puedo construir un sitio completamente funcional y responsive. |
| Maintenance / Mantenimiento | If something breaks or needs to change, I can add new features and solutions. | Si algo falla o necesita cambios, puedo agregar nuevas funcionalidades y soluciones. |

### 6.5 Contacto: descripción

- **EN**: Hi, I'm Camilo Hernandez, a full-stack developer with a strong focus on the MERN stack. I've been
  building for the web since 2020, and I've honed my skills creating robust, scalable web applications
  with TypeScript and Next.js.
- **ES**: Hola, soy Camilo Hernandez, desarrollador full-stack con un enfoque fuerte en el stack MERN.
  Construyo para la web desde 2020 y he afinado mis habilidades creando aplicaciones web robustas y
  escalables con TypeScript y Next.js.

### 6.6 Blog: bienvenida

- **EN**: Welcome to CHERCED-WORLD. I made this space to share more about myself. I hope you enjoy your
  time here, and leave me feedback in the comments on each post. Thanks!
- **ES**: Bienvenido a CHERCED-WORLD. Hice este espacio para compartir más sobre mí. Espero que disfrutes
  tu visita; déjame tus comentarios en cada post. ¡Gracias!

### 6.7 Portafolio: introducción

Se conservan los tres párrafos de 2023 (son primera persona y voz del autor), con estas correcciones:
"on the same way return to new people to love this world" → "and, in the same way, help new people fall
in love with this world"; "frontend trident" se mantiene. La lane L0 los traduce al español con las
reglas de la sección 10. "And many more to come!" → "¡Y muchos más por venir!".

## 7. Assets a revisar

| Asset | Problema | Acción |
|-------|----------|--------|
| `public/assets/imgs/funnyPost.jpg` (post3) | Parece un fotograma de una serie de TV, no una foto propia | P-05: confirmar derechos o reemplazar |
| `public/assets/imgs/pc-telefono-lado-izquierdo-fondo-negro_187299-25559.jpg` | El nombre sugiere una imagen de banco con licencia de atribución | P-05: confirmar licencia o retirar |
| `/assets/imgs/mePortfolio.jpg` | Referenciado en el blog, pero el archivo no existe | C-17 |
| `public/assets/icons/facebookIcon.png` | Se conserva si P-02 se resuelve | D-02 |

## 8. Proyectos (11): notas de migración

Ids estables 1–11 (las URLs `/portfolio/<id>` de 2023 siguen funcionando). Enlaces verificados el
2026-11-01 con una petición HTTP.

| Id | Título | Live | GitHub | Notas |
|----|--------|------|--------|-------|
| 1 | Quantic Theatrum | 200 | 200 | C-06 |
| 2 | CHERCED-WORLD | 200 | 200 | Describe la versión 2023; reescribir para el evolutivo (8.1). C-14 |
| 3 | AIRLINE | 200 | 200 | |
| 4 | Newman Club | 200 | 200 | |
| 5 | CENTRIBAL | 200 | 200 | |
| 6 | My Website | 200 | 200 | |
| 7 | E-Shop | 200 | 200 | |
| 8 | GET IT DONE | 200 | 200 | |
| 9 | Studio Ghibli Tracking System | 200 | 200 | p3 en tercera persona ("the developer's skills"): pasar a primera persona (D-03) |
| 10 | Studio Ghibli BackOffice | **404** | **404** | Ambos enlaces muertos: se omiten los botones (US7, escenario 4) |
| 11 | BookingUI system | 200 | 200 | |

Mapeo a caso de estudio (FR-080): `p1` → contexto y rol, `p2` → decisiones, `p3` → resultado, y
`technologies` se conserva. Si un párrafo no encaja en su campo, se deja en "contexto" y el campo vacío se
omite. Nunca se inventa contenido.

### 8.1 CHERCED-WORLD (id 2): descripción del evolutivo

- **EN**: My portfolio, born in 2023 as my playground for learning Next.js, and evolved in 2026 without
  losing its identity. This version adds glassmorphism over the animated GlitteringSea background,
  server-rendered content in English and Spanish, a real admin area with near-real-time notifications,
  a blog with moderated comments, a portfolio assistant that answers from my own content, a command
  palette and a time capsule of the 2023 version.
- **ES**: Mi portafolio, nacido en 2023 como el lugar donde aprendí Next.js, y evolucionado en 2026 sin
  perder su identidad. Esta versión suma glassmorfismo sobre el fondo animado GlitteringSea, contenido
  renderizado en servidor en español e inglés, un área de administración real con avisos casi en tiempo
  real, un blog con comentarios moderados, un asistente que responde a partir de mi propio contenido, una
  command palette y una cápsula del tiempo de la versión 2023.

## 9. Posts (3): notas de migración

| Id | Título | Alt de la imagen (C-13) | Notas |
|----|--------|-------------------------|-------|
| post1 | The Journey to Becoming a Full-Stack Developer | EN: The author smiling with a thumbs up in front of monitors full of code · ES: El autor sonriendo con el pulgar arriba frente a monitores llenos de código | Primera persona; corregir "programming.I" (falta espacio) |
| post2 | The Future of Humanity and Artificial Intelligence | EN: A person and a wireframe humanoid figure facing each other, hands almost touching · ES: Una persona y una figura humanoide de malla, frente a frente, con las manos casi tocándose | Se conserva el texto (es un post de opinión de 2023) |
| post3 | When a Payment Platform Goes Wrong: A Comedy of Errors | EN: A man in a suit in an office, looking at the camera with a serious face · ES: Un hombre de traje en una oficina, mirando a la cámara con cara seria | Narrativa en tercera persona a propósito (es un cuento); se conserva. Imagen: P-05 |

Los 3 posts se publican en ambos idiomas (FR-064). `subtitle: "By Camilo Hernandez"` pasa a metadato de
autor.

## 10. Reglas para traducir lo que falta (lane L0)

1. Primera persona y tono cercano del autor; tuteo en español.
2. Mismos hechos, cifras y fechas. Nada se agrega ni se infiere.
3. Términos técnicos y nombres propios en inglés (React, Next.js, MERN, front-end, responsive).
4. Español neutro latinoamericano (Colombia como referencia).
5. Fechas: `Jan 2020` / `ene 2020`. Porcentajes de skills idénticos en ambos idiomas.
6. Si un texto en inglés de 2023 tiene un error, se corrige primero en inglés y después se traduce.

## 11. Cápsula 2023: selección de commits

Texto fijo para la línea de tiempo (FR-103). Se conservan tal cual, con su fecha.

| Fecha | Commit |
|-------|--------|
| 2023-01-03 | initial commit, and header,submenu,banner commponents |
| 2023-01-08 | true source with a context done, be proud! |
| 2023-01-14 | SOLID arq APLIED |
| 2023-03-01 | been honest, lol its alot of work to make work a blogPost, but we will go lol |
| 2023-03-03 | now im replaining how to do the dispatcher of the posts, so im using a portal to launch a modal and set the coment, and post it... everyday more soon to the target |
| 2023-03-05 | ssh works? |
| 2023-03-06 | i was sending my commits with a other acoounr |
| 2023-03-16 | newBehaivors... index speed are now on green |
| 2023-03-27 | newFont and layoutComponent [...] also getinitialProps like the good practices said jeje |
| 2023-03-28 | here we are, understanding more and more, how to do a better practices to made a nice ssr, pwa |
| 2023-03-30 | semantic styles and new dinamic routes done, its a first deploy ready |
| 2023-03-30 | enecimo intentooooo! vida mk |
| 2023-04-10 | unique its kill my server lol reeeeemoved now |
| 2023-04-11 | comments, and messages, api, with mongoDB working now ! heeeeeelll Yeahhh! |
| 2023-04-19 | not yest but soket custom as microserver ar soon |
| 2023-05-21 | icons |
