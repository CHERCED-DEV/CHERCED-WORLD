# Research 005: decisiones técnicas

Investigación del 2026-11-04 para el [plan](./plan.md). Solo aparecen las decisiones técnicas reales. La plantilla OG
y el JSON-LD de base ya están decididos en la 004 (research R-403 y R-404): aquí solo se ajustan al blog.

## R-501 RSS en el App Router

**Decisión**:

- Un route handler `app/[lang]/feed.xml/route.ts` con `dynamic = 'force-static'` y `generateStaticParams` para `es` y
  `en`. Las URLs quedan en `/es/feed.xml` y `/en/feed.xml`.
- El proxy no corre para rutas con extensión (commit 7e05b91), así que no redirige el feed a otro idioma.
- **Formato**: RSS 2.0 con `atom:link rel="self"`, `Content-Type: application/rss+xml; charset=utf-8` y fechas en RFC
  822.
- Título, descripción y etiquetas se escapan con una función propia de `lib/blog/feed.ts`, sin dependencias.
- **Contenido**: cada post que tiene versión en ese idioma, con título, enlace, descripción, `guid` permanente (la URL),
  fecha y `category` por etiqueta. No se publica el cuerpo completo.
- **Anuncio**: `metadata.alternates.types['application/rss+xml']` en el índice y en los posts, con
  `feedAlternates(lang)`. Next lo pinta en el `<head>`.

**Alternativa descartada**: una librería de feeds. RSS 2.0 son unas pocas etiquetas y no justifica una dependencia
(principio VIII).

## R-502 Imagen OG por post y portada generada

**Decisión**:

- `app/[lang]/blog/[id]/opengraph-image.tsx` reutiliza `renderOgImage` de la 004 con título, fecha y etiquetas.
  Se prerenderiza con `generateStaticParams` sobre posts e idiomas.
- **Portada de las tarjetas**: un post marcado `cover: 'generated'`, o uno nuevo sin portada propia, **no** carga la
  imagen OG como portada. Usa `GeneratedCover`, una portada en HTML y CSS con los mismos tokens: título sobre cristal,
  fecha y etiquetas.
- **Por qué**:
  - No suma una descarga por tarjeta y no afecta el LCP del índice.
  - No obliga a cambiar `images.localPatterns` en `next.config.ts`, que hoy solo permite `/assets/**` y `/capsule/**`.
- La spec decía "usa su imagen OG como portada" (FR-504). El análisis cruzado lo corrigió a "portada generada con la
  misma plantilla visual".

**Alternativa descartada**: usar la imagen OG en `<img>`. Pesa más, retrasa el LCP y pide una enmienda de R0.

## R-503 Filtros por etiqueta estáticos

**Decisión**:

- La ruta `app/[lang]/blog/tag/[tag]/page.tsx` usa `generateStaticParams` con la **unión** de las etiquetas de los dos
  idiomas, normalizadas con `slugify` (`lib/blog/slug.ts`). Así:
  - una etiqueta que solo existe en un idioma responde en el otro con la lista vacía y un enlace al índice, no con un
    404;
  - una etiqueta inexistente en ambos responde 404 (`dynamicParams = false`).
- El índice principal no lee `searchParams`, así que sigue estático (sin regresión de D-05).
- **Búsqueda**: del lado del cliente, sobre el índice que ya existe (`lib/search/client.ts`), filtrado a `kind: 'post'`
  del idioma. Sin JS, la caja de búsqueda no se muestra, y las etiquetas con URL propia son la alternativa (FR-506).

**Alternativa descartada**: `?tag=` y `?q=` en el índice. Vuelven dinámico el render y repiten el arranque lento de
D-05.

## R-504 Separador "Ahora" y "Archivo"

**Decisión**:

- `groupByYear` agrupa por el año de `date`. El grupo con el **año más reciente que tenga posts** se titula "Ahora", y
  los demás, "Archivo".
- No usa el año del calendario: así el índice no cambia solo el 1 de enero sin un post nuevo, y no depende de la hora
  del build.
- El post destacado sale de su grupo para no repetirse.

## R-505 Callouts y diagramas en MDX

**Decisión**:

- `Callout` es un Server Component en `components/blog/mdx/Callout.tsx`, con `type: 'decision' | 'tradeoff' |
  'learned'`, registrado en `mdxComponents` (A-505).
- Se renderiza como `<aside>` con un título visible, que es lo que anuncia el lector de pantalla antes del texto.
- **Diagramas**: SVG dibujados a mano con `MdxImage`, que ya existe, dentro de un contenedor con desplazamiento propio
  para los anchos. Mermaid queda fuera mientras P-503 siga abierta: renderizarlo en el build pide un navegador headless.

## R-506 Series, relacionados y nota de traducción

**Decisión**:

- **Series**: los nombres viven en `content/posts/series.ts`, y cada post declara `series: { id, part }`. El total cuenta
  solo las partes publicadas en el idioma.
- **Relacionados**: hasta 3 posts, con `relatedPosts` ordenando por etiquetas en común y luego por fecha, y excluyendo
  el post actual, el anterior y el siguiente.
- **Nota de traducción**: se muestra cuando `meta.originalLang !== lang` y el post no es un fallback. El aviso de
  fallback que ya existe se queda.

## R-507 JSON-LD `BlogPosting`

**Decisión**:

- `blogPostingJsonLd` arma `headline`, `description`, `datePublished`, `dateModified` (con `updated`), `inLanguage`,
  `image` (la URL de la imagen OG del post), `keywords`, `url`, `isPartOf` (el blog) y `author: { "@id":
  "{base}/#person" }`.
- La página del post lo publica con `jsonLdScript` de la 004, que escapa `<`.

## R-508 "Escuchar este post" (bloqueado)

**Lo que se sabe**:

- En el camino A, el motor es la Web Speech API (`speechSynthesis`) del navegador, que depende de las voces del sistema.
- En algunos navegadores, la voz la genera un servicio en línea del propio navegador. Por eso, la privacidad no es
  "nada sale del dispositivo".

**Decisión**: no se implementa hasta que la 003 decida V3 y su camino (P-505). La tarea queda escrita con el contrato:

- el texto del cuerpo, sin bloques de código ni texto alternativo decorativo;
- el idioma de la página;
- controles operables con teclado y estado con `aria-live`.
