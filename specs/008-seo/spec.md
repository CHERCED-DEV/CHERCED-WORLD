# Feature Specification: SEO y dominio propio

**Feature Branch**: `lane/SEO` (sobre `007-pulido-y-conversion`, 960a91b)

**Created**: 2026-11-06

**Status**: Implementado en la lane; pendiente de las respuestas del autor (P-801 a P-807) y de sus pasos fuera del repo

**Input**: pedido del autor del 2026-11-06: "Otro spec que hay que trabajar es el SEO, que donde sea que tecleen yo salga
de primero. Pienso en algún momento comprarle un dominio a este aplicativo, entonces quiero aprovechar y explotar todo
esto." La idea está en [idea.md](./idea.md).

## Principio rector

Rige el de la 002 y la 007: se enriquece, no se reemplaza. El diseño visible no cambia, salvo los textos de metadata y
unos enlaces internos discretos dentro de componentes que ya existen. Cero invención: cada título, descripción y dato
estructurado sale de `content/` o de los diccionarios. Nada interno del empleador ni de clientes, y el JSON-LD no
publica correo, teléfono ni dirección exacta.

## Qué se puede prometer y qué no

- **Sí**: salir primero cuando busquen las formas del nombre que solo son de él ("Camilo Hernández Cediel", "CHERCED",
  "cherced", "CHERCED-WORLD"), sus proyectos ("Synergos", "Synergos Labs") y búsquedas de nicho donde el sitio tiene
  contenido propio y profundo ("director y líneas: agentes de IA en paralelo", "sagas .NET y micro-frontends",
  "spec-driven development con agentes", "AWS EventBridge a Azure Service Bus").
- **No**: nadie puede garantizar el primer lugar para términos genéricos ("software architect", "desarrollador .NET").
  Tampoco para "Camilo Hernández" a secas: es un nombre común y compiten homónimos con perfiles de mucha autoridad
  (redes sociales, directorios, medios). Ahí la spec mide, no promete, y apuesta por la desambiguación: nombre más
  CHERCED, Synergos o el oficio.
- **Fuera del control del repo**: cuándo rastrea Google, los enlaces que llegan desde otros sitios, la verificación en
  Search Console y Bing, y la configuración del dominio en Vercel. Todo eso queda en la
  [guía para el autor](./guia-search-console.md).

## Auditoría del código (2026-11-06)

| # | Pieza | Lo que dice el código | Consecuencia |
|---|---|---|---|
| A1 | Origen canónico | `getSiteUrl()` (`lib/site-url.ts`) lee `VERCEL_URL_CORS`, luego `VERCEL_PROJECT_PRODUCTION_URL` y si no, `localhost:3000`. No había constante: el dominio estaba escrito a mano en `OG_DOMAIN` (`lib/og/template.tsx`), en el enlace en vivo del caso 2 y en la cápsula 2023 | FR-801: `SITE_ORIGIN` es la constante; en producción manda ella. La cápsula conserva su origen porque es un dato histórico (se capturó ahí) |
| A2 | Canonical y `hreflang` | `pageMetadata` y `alternates()` (`lib/i18n/paths.ts`) declaran la canónica del idioma y `es`, `en` y `x-default`. `x-default` es la ruta sin idioma, que el proxy redirige con 307 según la cookie o `Accept-Language`. Contacto, Privacidad, Blog, posts y etiquetas lo declaran por su cuenta | Correcto. La e2e de la 008 lo fija para cada URL del sitemap (SC-803) |
| A3 | Sitemap | 10 páginas, 15 casos y 5 posts en los dos idiomas, más cada etiqueta en el idioma donde tiene posts. Sin `/inbox`, sin el catálogo del blog y sin la API | Correcto. FR-832 agrega la fecha real de `/now`, `/privacy` y `/synergos` |
| A4 | `robots.txt` | Permite todo salvo `/api/` y apunta al sitemap absoluto | Correcto. `/inbox` no se bloquea en `robots.txt` a propósito: es `noindex` por meta, y bloquearlo impediría que el rastreador lea ese `noindex` |
| A5 | `noindex` | `inbox/layout.tsx` (`index: false, follow: false`), el catálogo del blog y la etiqueta en un idioma donde no tiene posts. El 404 nuevo de la PC4 (`app/global-not-found.tsx` y `[lang]/not-found.tsx`) sale con `<meta name="robots" content="noindex">`, que pone Next.js, y sin canónica | Correcto; la 008 lo deja probado (FR-830, e2e) |
| A6 | Etiquetas del blog | El slug del otro idioma o el viejo redirige con 308 al slug propio (T941 de la 007); el sitemap lista solo el propio | Correcto; e2e en la 008 |
| A7 | JSON-LD `Person` (layout) | `sameAs` con LinkedIn y GitHub; faltaba Platzi, que ya se enlaza en Sobre mí. `alternateName` sin "Camilo Hernández Cediel" | FR-810 |
| A8 | JSON-LD `BlogPosting` | El autor va por `@id` al `Person` del layout (decisión R-507 de la 005). Sin migas | Se conserva la decisión. FR-814 agrega `BreadcrumbList` |
| A9 | JSON-LD de casos | Solo `/synergos` tenía `CreativeWork`; las páginas de caso no tenían datos estructurados | FR-813 |
| A10 | `WebSite` y `ProfilePage` | No existían | FR-811 y FR-812 |
| A11 | Imágenes OG | Una por página (`opengraph-image`), con el dominio escrito a mano abajo. En una vista previa Next.js usa `VERCEL_BRANCH_URL` para `og:image` (B7 de la 007) | El texto del dominio lee `SITE_HOST` (FR-801) |
| A12 | RSS y `llms.txt` | Usan `getSiteUrl()` | Heredan el origen canónico sin cambios |
| A13 | Títulos | FR-706 de la 007: Home "Camilo Hernández · Software Solutions Engineer · AI-First"; el resto "Página · Camilo Hernández". Servicios, Portafolio, Blog y AI Lab decían solo el nombre de la sección | FR-821 (con P-805) |
| A14 | Descripciones | Home no decía CHERCED ni Synergos Labs; Sobre mí no decía el nombre; Contacto no decía que ahí está el CV | FR-820 |
| A15 | `alt` | Las imágenes de contenido traen `alt` en ES y EN. Las decorativas usan `alt=""` (iconos junto a su texto, el retrato del AuthorBox junto al nombre, fondos). `MdxImage` pone `alt=""` si falta | Correcto; FR-851 lo deja probado (unitaria y e2e) |
| A16 | Enlaces internos | Home, Sobre mí y el caso 12 llevan a `/synergos`; `/synergos` lleva a los casos 12 y 13; Servicios → Casos; posts → posts relacionados; casos → anterior y siguiente. Faltaban caso → post, post → caso y caso → Servicios | FR-850 |
| A17 | Verificación de buscadores | No hay meta de Google ni de Bing | FR-840 |
| A18 | `/synergos` | Fuera del menú por decisión de la 009; en el sitemap y enlazado desde Home, Sobre mí y el caso 12 | Se queda fuera del menú |
| A19 | Core Web Vitals en el campo | Solo se miden con tráfico real (CrUX, Search Console) | Fuera del repo; se mide cuando haya dominio y datos |

## Requisitos

### Bloque 1: el dominio en un solo sitio (P1)

- **FR-801**: `lib/site-url.ts` exporta `SITE_ORIGIN` (hoy `https://cherced-world.vercel.app`) y `SITE_HOST`. En
  producción (`VERCEL_ENV === 'production'`) `getSiteUrl()` devuelve `SITE_ORIGIN`, aunque las variables digan otra
  cosa; en vista previa y en local se comporta como antes. De ahí salen `metadataBase` (canónica, `hreflang`, `og:url`,
  `og:image` en producción), el sitemap, `robots.txt`, todo el JSON-LD, el RSS, `llms.txt`, el dominio que se lee en
  las imágenes OG y el enlace en vivo del caso 2. Ningún otro archivo escribe el dominio, salvo la cápsula 2023.
- **FR-802**: cambiar de dominio es cambiar `SITE_ORIGIN` y seguir la guía. La redirección permanente desde
  `cherced-world.vercel.app` se configura en Vercel (paso del autor); el repo no toca Vercel, no agrega `vercel.json`
  ni redirecciones por host.

### Bloque 2: la entidad (P1)

- **FR-810**: el `Person` del layout enlaza en `sameAs` LinkedIn, GitHub `CHERCED-DEV` y el perfil de Platzi
  (`https://platzi.com/p/Cherced/`), y suma "Camilo Hernández Cediel" a `alternateName`. Sigue sin correo, teléfono ni
  dirección exacta (`tests/unit/p0/person-jsonld.test.ts`).
- **FR-811**: Home (`/es`, `/en`) publica `WebSite`: `name` "CHERCED-WORLD", `alternateName` ["Camilo Hernández",
  "CHERCED"], `url` el origen, `inLanguage` ["es", "en"], y `author` y `publisher` por `@id` al `Person`.
- **FR-812**: Sobre mí publica `ProfilePage` cuyo `mainEntity` es el mismo `Person` (mismo `@id`), con `isPartOf` al
  `WebSite`.
- **FR-813**: cada caso publica `CreativeWork` con lo que el caso ya dice: título, resumen, URL, idioma, imagen OG,
  tecnologías como `keywords`, el autor por `@id`, el portafolio como `isPartOf` y los repos públicos como
  `SoftwareSourceCode`. Sin fechas, precios ni calificaciones, porque el contenido no los tiene.
- **FR-814**: `BreadcrumbList` en los casos (Inicio › Portafolio › caso) y en los posts (Inicio › Blog › post, con la
  canónica del contenido). Las migas no se dibujan: solo van en el JSON-LD.
- **FR-815**: el `CreativeWork` de `/synergos` declara como `producer` a la organización "Synergos Labs" (de la carrera
  en Sobre mí), con el `Person` como `founder`.

### Bloque 3: títulos y descripciones para lo que la gente busca (P1)

- **FR-820**: descripciones nuevas, en ES y EN, armadas solo con lo que el sitio ya cuenta:

  | Clave | Antes (ES) | Después (ES) | Después (EN) |
  |---|---|---|---|
  | `common:meta.description` y `site:meta.home.description` | Camilo Hernández, Software Solutions Engineer. Diseño sistemas composables y distribuidos con micro-frontends, microservicios .NET y Azure. Trabajo AI-first y spec-driven. | Camilo Hernández (CHERCED), Software Solutions Engineer y fundador de Synergos Labs: micro-frontends, microservicios .NET y Azure, AI-first y spec-driven. | Camilo Hernández (CHERCED), Software Solutions Engineer and founder of Synergos Labs: micro-frontends, .NET microservices and Azure, AI-first and spec-driven. |
  | `site:meta.about.description` | Software Solutions Engineer · AI-First: mi carrera, lo que sé y dónde lo apliqué. | Camilo Hernández (CHERCED), Software Solutions Engineer · AI-First: mi carrera en aerolíneas y fintech, Synergos Labs, lo que sé y mi CV en PDF. | Camilo Hernández (CHERCED), Software Solutions Engineer · AI-First: my career in airlines and fintech, Synergos Labs, what I know and my CV in PDF. |
  | `site:meta.services.description` | Asistentes de IA para tu profesión, fábricas de software a la medida, optimización de procesos con IA, arquitectura y desarrollo de producto. | Asistentes de IA para tu profesión (abogados, ingenieros), fábricas de software a la medida, optimización de procesos con IA y arquitectura de software. | AI assistants for your profession (lawyers, engineers), tailor-made software factories, AI process optimization and software architecture. |
  | `contact:meta.contact.description` | Escríbeme: te respondo en menos de 48 horas. | Escríbeme: te respondo en menos de 48 horas. Aquí también están mi CV en PDF y mi LinkedIn. | Write to me: I'll reply within 48 hours. My CV in PDF and my LinkedIn are here too. |

  **Enmienda de R2.3 de la 012 (2026-11-11), para las búsquedas de P-802.** Home y Sobre mí suman el oficio y la
  ciudad. El autor eligió no presentarse como "desarrollador" en las descripciones: se mantiene la identidad de la 004
  (SC-401) y el inicio sigue tachando "SOY DESARROLLADOR".

  | Clave | Después de R2.3 (ES) | Después de R2.3 (EN) |
  |---|---|---|
  | `common:meta.description` y `site:meta.home.description` | Camilo Hernández (CHERCED), Software Solutions Engineer y AI Engineer en Armenia, Colombia: Angular, microservicios .NET y Azure. Fundador de Synergos Labs. | Camilo Hernández (CHERCED), Software Solutions Engineer and AI Engineer in Armenia, Colombia: Angular, .NET microservices and Azure. Founder of Synergos Labs. |
  | `site:meta.about.description` | Camilo Hernández (CHERCED), Software Solutions Engineer · AI-First en Armenia, Colombia: mi carrera en aerolíneas y fintech, Synergos Labs y mi CV en PDF. | Camilo Hernández (CHERCED), Software Solutions Engineer · AI-First in Armenia, Colombia: my career in airlines and fintech, Synergos Labs and my CV in PDF. |

  "Armenia, Colombia" sale de `profile.availability.location`, "AI Engineer" del rol de "Para reclutadores" y Angular
  de las tecnologías de Sobre mí.

  De dónde sale cada dato: CHERCED es `intro.name`; "fundador de Synergos Labs", el rol "Founder & Software
  Architect" de la carrera; "aerolíneas y fintech", la carrera y la descripción de Sobre mí; "abogados, ingenieros",
  la audiencia "Profesionales independientes" de Servicios; el CV y LinkedIn, los botones de Sobre mí y Contacto. El
  `Person` del JSON-LD y la línea 3 de `llms.txt` toman la descripción nueva de Home.
- **FR-821**: las cuatro páginas de sección cuyo título solo decía el nombre de la sección dicen de qué tratan, con la
  plantilla de FR-706 ("… · Camilo Hernández"). Claves nuevas, para que la imagen OG y el RSS sigan con el nombre corto:

  | Página | Clave nueva | ES | EN |
  |---|---|---|---|
  | Servicios | `site:meta.services.searchTitle` | Servicios de IA y arquitectura de software | AI and software architecture services |
  | Portafolio | `site:meta.portfolio.searchTitle` | Portafolio: casos de estudio de arquitectura e IA | Portfolio: architecture and AI case studies |
  | Blog | `blog:meta.blog.searchTitle` | Blog de arquitectura y agentes de IA | Blog on architecture and AI agents |
  | AI Lab | `ailab:ailab.meta.title` | AI Lab: experimentos de IA en tu navegador | AI Lab: AI experiments in your browser |

- **FR-822**: reglas. El título completo mide 70 caracteres o menos y lleva el nombre; la descripción, entre 40 y 165.
  No cambian los títulos de Home, Sobre mí, Contacto, Ahora y Privacidad, ni los de los casos y los posts: ya dicen el
  nombre o el tema (los casos 13 a 15 ya llevan sus palabras clave desde la 007).

### Bloque 4: técnico (P2)

- **FR-830**: nada `noindex` entra al sitemap. Cada URL del sitemap responde 200, es su propia canónica, declara `es`,
  `en` y `x-default`, tiene una descripción y ningún `<img>` sin `alt`. El 404 es `noindex` y no declara canónica.
- **FR-831**: `robots.txt` deja rastrear todo salvo `/api/` y apunta al sitemap del origen canónico.
- **FR-832**: el sitemap lleva la fecha real de actualización de `/now` (`now.updatedAt`), `/privacy`
  (`privacy.updatedAt`) y `/synergos` (`countedAt`), además de la de los posts.
- **FR-840**: `lib/seo/verification.ts` guarda `SEARCH_VERIFICATION = { google: null, bing: null }`. Con un valor, el
  layout publica `<meta name="google-site-verification">` o `<meta name="msvalidate.01">`; sin valor, nada. No se
  inventa el token y no hay variables de entorno nuevas: el token de verificación no es secreto (va en el HTML) y
  vive versionado, como manda la constitución (VIII).
- **FR-850**: enlaces internos discretos dentro de componentes que ya existen:
  - El caso 2 (CHERCED-WORLD 2026) enlaza los posts 4 y 5, que cuentan cómo se reconstruyó; los posts vuelven al caso.
    La relación vive en `content/related.ts`.
  - Los casos que aparecen en Servicios → Casos (2, 12, 13, 14 y 15) enlazan Servicios con los títulos de sus servicios,
    desde el mismo mapa `SERVICE_CASES`.
  - En el caso, dentro del `nav` "Enlaces del proyecto", con el mismo estilo de los repos ("En el blog" / "Servicios").
    En el post, como una tarjeta más de "Posts relacionados", con "Caso de estudio" donde va la fecha.
  - `/synergos` no entra al menú.
- **FR-851**: las imágenes de contenido tienen `alt` en ES y EN; las decorativas, `alt=""`.

### Bloque 5: medición (P2)

- **FR-860**: el autor mide estas búsquedas en Search Console antes y después del dominio (método en la guía, §5). La
  columna "Antes" se llena con el primer periodo de 28 días con datos; no hay cifras inventadas.

  | # | Búsqueda | Idioma | Página que debería salir | Qué mide | Antes (posición media, fecha) | Después (8 semanas con dominio) |
  |---|---|---|---|---|---|---|
  | Q1 | Camilo Hernández CHERCED | ES | Home | Nombre más marca | por medir | por medir |
  | Q2 | cherced | — | Home | Marca | por medir | por medir |
  | Q3 | CHERCED-WORLD | — | Home | Marca del sitio | por medir | por medir |
  | Q4 | Camilo Hernández Cediel | ES | Sobre mí | Nombre completo | por medir | por medir |
  | Q5 | Camilo Hernandez software engineer | EN | Home o Sobre mí | Nombre sin tilde más oficio | por medir | por medir |
  | Q6 | Camilo Hernández | ES | Home | Nombre común: se mide, no se promete | por medir | por medir |
  | Q7 | Synergos Labs | — | `/synergos` | Proyecto | por medir | por medir |
  | Q8 | Synergos plataforma de composición | ES | `/synergos` o caso 12 | Proyecto | por medir | por medir |
  | Q9 | director y líneas agentes de IA | ES | Caso 13 | Nicho | por medir | por medir |
  | Q10 | sagas .NET micro-frontends | ES | Caso 12 | Nicho | por medir | por medir |
  | Q11 | spec-driven development con agentes | ES | Post 4 o caso 2 | Nicho | por medir | por medir |
  | Q12 | AWS EventBridge Azure Service Bus Redpanda | EN | Caso 15 | Nicho | por medir | por medir |
  | Q13 | asistente de IA para abogados | ES | Servicios o caso 14 | Nicho de servicio | por medir | por medir |
  | Q14 | desarrollador Angular | ES | Home o Sobre mí | Oficio con tecnología (P-802) | por medir | por medir |
  | Q15 | desarrollador .NET | ES | Home o Sobre mí | Oficio con tecnología (P-802) | por medir | por medir |
  | Q16 | desarrollador frontend Colombia | ES | Home | Oficio con país (P-802) | por medir | por medir |
  | Q17 | desarrollador full stack Armenia | ES | Home o Sobre mí | Oficio con ciudad (P-802). La descripción no dice "full stack" por la regla de identidad; Sobre mí y "Para reclutadores" sí lo dicen en el texto | por medir | por medir |
  | Q18 | AI Engineer Colombia | ES y EN | Home | Oficio con país (P-802) | por medir | por medir |

## Fuera de alcance

- La configuración de Vercel (dominio, redirección), el DNS, Search Console, Bing y los perfiles de LinkedIn, GitHub y
  Platzi: los hace el autor con su cuenta ([guía](./guia-search-console.md)).
- Analytics o cualquier servicio de medición nuevo (constitución VIII). Search Console basta.
- Core Web Vitals de campo: se miden con datos reales cuando haya dominio y tráfico.
- Contenido nuevo (el calendario editorial del blog, Q4 de la 005 y T951 de la 007).
- Migas visibles, `hreflang` por región (`es-CO`) y cambios en el menú.

## Preguntas al autor

| # | Pregunta | Supuesto que se tomó | Bloquea |
|---|---|---|---|
| P-801 | ¿Qué dominio piensa comprar y cuándo? | Ninguno todavía: `SITE_ORIGIN` sigue en `https://cherced-world.vercel.app`. El cambio es una línea más los pasos de la guía | El cambio de dominio (FR-802) |
| P-802 | ¿Qué búsquedas quiere ganar primero, con sus palabras? | La tabla de FR-860: variantes del nombre, CHERCED, Synergos y Synergos Labs, y los nichos con contenido propio | Ajustar FR-860 |
| P-803 | ¿Tiene ya Search Console, Bing o Analytics en algún sitio suyo? | No. La guía arranca de cero: verificación por DNS para el dominio nuevo y por meta tag para `cherced-world.vercel.app`. El mecanismo del meta tag está listo y vacío (FR-840) | Llenar `SEARCH_VERIFICATION` |
| P-804 | ¿Qué nombre del sitio debería mostrar Google: "CHERCED-WORLD" o "Camilo Hernández"? | "CHERCED-WORLD", con "Camilo Hernández" y "CHERCED" como `alternateName` del `WebSite` | — |
| P-805 | FR-706 dejó los títulos como "Página · Camilo Hernández". ¿Le sirve que Servicios, Portafolio, Blog y AI Lab digan de qué tratan ("Servicios de IA y arquitectura de software · Camilo Hernández")? | Sí. Volver atrás es usar `meta.*.title` en vez de `searchTitle` en cuatro llamadas | — |
| P-806 | ¿Va también Instagram (`instagram.com/cherced`) en `sameAs`? | No: el pedido nombra LinkedIn, GitHub y Platzi. Agregarlo es una línea en `personSameAs` | — |
| P-807 | P-704 de la 007 sigue abierta: el CV dice `github.com/Cherced` y el sitio, `github.com/CHERCED-DEV`. ¿Son las dos suyas? | `sameAs` usa `CHERCED-DEV`. Si las dos son suyas, conviene enlazar las dos | — |

### Respuestas del autor (2026-11-07)

- **P-801**: va a comprar el dominio, un .com o .net propio, en Vercel o donde salga más económico. Cuando lo tenga se
  cambia `SITE_ORIGIN` (T804).
- **P-802**: quiere salir primero "cuando busquen que necesitan un desarrollador". El primer puesto para "desarrollador"
  a secas no se puede prometer (FR-860 lo explica). Se apunta a búsquedas de desarrollador con nicho y ubicación:
  "desarrollador Angular", "desarrollador .NET", "desarrollador frontend Colombia", "desarrollador full stack Armenia",
  "AI Engineer Colombia", además de las de su nombre. Se miden en la tabla de FR-860.
- **P-803**: no tiene Search Console ni Analytics. La guía arranca de cero.
- **P-806**: sí. Instagram entra en `sameAs` ("a ver si me sigue más gente"). Hecho en `personSameAs`.
- **P-807**: las dos cuentas son suyas: `Cherced` es de cuando estudiaba y `CHERCED-DEV` de cuando ya trabajaba. El CV
  nuevo lleva las dos; el sitio sigue enlazando `CHERCED-DEV`.
- El resto del SEO queda a criterio del orquestador.

## Criterios de éxito

- **SC-801**: el dominio solo aparece escrito en `lib/site-url.ts` (y en la cápsula 2023, que es historia). Lo
  comprueba `tests/unit/seo/canonical-origin.test.ts`.
- **SC-802**: con `VERCEL_ENV=production`, `robots.txt`, el sitemap, el JSON-LD, el RSS y `llms.txt` salen con
  `SITE_ORIGIN` aunque `VERCEL_URL_CORS` diga otra cosa (unitaria).
- **SC-803**: cada URL del sitemap responde 200, es su propia canónica, declara `es`, `en` y `x-default`, no es
  `noindex` y no tiene `<img>` sin `alt` (`tests/e2e/seo/seo.spec.ts`).
- **SC-804**: los títulos de FR-821 y las descripciones de FR-820 salen en el HTML en ES y EN, con o sin JS.
- **SC-805**: el caso 2 enlaza los posts 4 y 5 y Servicios; el post 4 vuelve al caso 2; los casos 12 a 15 enlazan
  Servicios; los casos de 2022–2023 no llevan enlaces nuevos. En escritorio, móvil y sin JS.
- **SC-806**: cada JSON-LD tiene la forma de FR-810 a FR-815 (unitarias) y sale en el HTML del servidor (e2e sin JS).
- **SC-807** (fuera del repo, lo mide el autor): propiedad verificada en Search Console, sitemap enviado sin errores, la
  prueba de resultados enriquecidos de Google sin errores en Home, Sobre mí, un caso y un post, y Q1 a Q4 y Q7 en
  posición 1 a las 8 semanas del dominio.
