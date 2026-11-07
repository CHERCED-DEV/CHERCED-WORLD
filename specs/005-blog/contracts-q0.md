# Contrato Q0: base del blog de la 005

**Dueño**: Q0 · **Estado**: congelado en el tag `q0-frozen` · **Base**: [contracts-p0.md de la
004](../004-contenido-presente/contracts-p0.md), [contracts-m0.md de la 006](../006-movil-vivo/contracts-m0.md),
[data-model.md](./data-model.md) y [research.md](./research.md)

**Tag**: `q0-frozen` apunta al último commit de `lane/Q0`, el que agrega este documento, con `npm run verify`,
`npm run test:fast` (1223 unitarias y 58 de humo) y las e2e de q0 en verde. `npm audit` solo reporta 8 moderadas que
ya estaban; no hay dependencias, servicios ni variables nuevas. Por la carga de la máquina, las e2e de l4 y
r4 que pide T609 no se corrieron en la lane: quedan para el orquestador al integrar (§11).

Todo lo de la 001, la 002, la 004 y la 006 sigue vigente. Q0 agrega tipos, copy, utilidades y el `BlogPosting`; ningún
componente cambia. Las lanes Q1 a Q5 programan contra este documento. Si falta algo, se pide como enmienda a Q0.

## 1. Tipos (`content/types.ts`, A-501)

| Tipo | Forma | Notas |
|---|---|---|
| `PostMeta` | los campos de hoy + `featured?: true`, `updated?: string`, `series?: PostSeriesRef`, `cover?: 'generated'` | `image` sigue obligatoria: ningún consumidor cambia. |
| `PostSeriesRef` | `{ id: string; part: number }` | El tipo con nombre de `PostMeta.series`. |
| `PostSeries` | `{ id: string; name: Localized }` | Vive en `content/posts/series.ts`, como data-model §2. |

Reglas, que cuida `tests/unit/q0/meta.test.ts` sobre los MDX reales:

- `featured`: como máximo un post por idioma. Si hay más de uno, `featuredPost` elige el más reciente y la prueba falla.
- `updated`: `AAAA-MM-DD` válido e igual o posterior a `date`.
- `series.id` existe en `content/posts/series.ts`; `part` es un entero de 1 en adelante, único en la serie y el idioma.
- `cover`: solo `'generated'`. La tarjeta y el post usan `GeneratedCover` (Q1) en vez de `image`.
- Etiquetas: dos etiquetas distintas de un mismo idioma no comparten slug, y ninguna cae en el slug de respaldo
  (`section`).

`content/posts/series.ts` exporta `series: PostSeries[] = []`. Ninguna serie está decidida; la primera la crea el autor
al publicar su primera parte (Q4).

**Aclaración de integración con la 010 (2026-11-07, orquestador)**: las traducciones de un post pueden usar variantes
de una misma ilustración con texto en su idioma, como `synergos-es.svg` y `synergos-en.svg` (FR-1024 de la 010).
No cambia `PostMeta`: cada versión conserva `image` obligatoria, medidas reales y equivalentes y `alt` traducido.
La prueba de paridad comprueba las medidas; la prueba de assets valida que cada fichero exista y tenga esas medidas.

## 2. Copy (A-504)

`site.blog.welcome` (en `content/site.ts`) y `meta.blog.description` (en `blog.json`) pasan al texto de la spec en ES y
EN. Claves nuevas de `content/i18n/{es,en}/blog.json`, con el texto de la tabla "Copy", palabra por palabra:

| Grupo | Claves | Marcadores | Lane |
|---|---|---|---|
| Índice | `index.featured`, `index.now`, `index.archive`, `index.filter`, `index.allTags`, `index.tagResults`, `index.tagResults.one`, `index.search`, `index.noResults`, `index.clear`, `index.rss` | `tagResults`: `{count}` y `{tag}`; `noResults`: `{query}` | Q1 |
| Post | `callout.{decision,tradeoff,learned}`, `series.position`, `related.title`, `author.line`, `author.cta`, `post.translatedFrom`, `post.updated` | `series.position`: `{series}`, `{n}` y `{total}`; `translatedFrom`: `{lang}`; `updated`: `{date}` | Q2 |
| Escuchar (bloqueado) | `listen.{play,pause,resume,stop,status}` | `status`: `{heading}` | Q2, con T628 |

- **D-Q3**: `index.tagResults.one` ("{count} post con «{tag}»" / "{count} post tagged “{tag}”") es la forma en
  singular. Úsala cuando `count === 1`.
- `post.translatedFrom` recibe el nombre del idioma de `languageName(meta.originalLang, lang)` (§3.6): "Escrito
  originalmente en inglés." / "Originally written in Spanish.". No hay claves de nombres de idioma.
- Ninguna clave en uso cambió de texto, salvo `meta.blog.description`. `post.originalLanguage` y `post.fallbackNotice`
  (el aviso de fallback de hoy) siguen igual.
- Para el título de la página de etiqueta, `index.tagResults` sirve tal cual. Cualquier otro texto se pide como enmienda.

## 3. Utilidades (`lib/blog/`)

Todo se exporta desde `@/lib/blog`. **El índice es solo de servidor**, porque reexporta `source.ts`, que importa
`server-only`. Un Client Component importa del módulo puro (`@/lib/blog/tags`, `@/lib/blog/feed` y los demás), como ya
hacen `Toc` y `ReadingProgress`.

### 3.1 Etiquetas (`tags.ts`, puro)

| Export | Forma | Regla |
|---|---|---|
| `tagSlug(tag)` | `string` | `slugify` de `slug.ts`: sin tildes, minúsculas y guiones. Es estable: `tagSlug(tagSlug(x)) === tagSlug(x)` |
| `tagPath(lang, tag)` | `string` | `/{lang}/blog/tag/<slug>`. Acepta la etiqueta visible o el slug |
| `postTags(posts)` | `BlogTag[]` = `{ slug, label, count }[]` | Una por slug, con la etiqueta visible del primer post que la trae. Ordena por `count` y luego por `label`. Para la fila de filtros |
| `postsWithTag(posts, tag)`, `hasTag(post, tag)` | | Comparan por slug |
| `uniqueTagSlugs(posts)` | `string[]` | Sin duplicados, ordenados |

**Enmienda de la 007 (B9, T941): etiquetas bilingües.** Cada etiqueta vive en `content/posts/tags.ts` como `{ es, en }`,
y cada MDX escribe las suyas con el nombre de su idioma. El slug sigue siendo `tagSlug` del nombre, así que es propio de
cada idioma (`/es/blog/tag/arquitectura`, `/en/blog/tag/architecture`). `loadPost` entrega las etiquetas en el idioma
de la página, también en un fallback. Se suman `findTag`, `tagIn`, `tagsIn`, `tagSlugIn`, `tagKey` (identidad entre
idiomas, la usan `hasTag` y los relacionados) y `tagAlternates`. `tagPath(lang, tag)` acepta el nombre o el slug de
cualquier idioma y da el slug de `lang`. `allTagSlugs()` suma los slugs de los dos idiomas de cada etiqueta en uso: el
de otro idioma, o el viejo (`/es/blog/tag/architecture`), responde 308 al de la página. Los alternates y el sitemap
enlazan cada etiqueta con su slug en el otro idioma. El edge case de R-503 sigue: una etiqueta sin posts en un idioma
da ahí la lista vacía, con su nombre en ese idioma.

### 3.2 Grupos y destacado (`groups.ts`, puro)

| Export | Forma | Regla |
|---|---|---|
| `featuredPost(posts)` | `T \| null` | El de `featured`; si no hay, el más reciente. En un empate de fecha gana el primero de la lista recibida |
| `groupByYear(posts, exclude = [])` | `{ year, label: 'now' \| 'archive', posts }[]` | Del año más nuevo al más viejo. `now` es el año más reciente **con posts**, calculado antes de `exclude`. Cada grupo va del más nuevo al más viejo; los grupos que quedan vacíos se omiten |
| `postYear(date)` | `number` | |

Receta del índice (Q1):

```ts
const posts = await blogPosts(lang)
const featured = featuredPost(posts)
const groups = groupByYear(posts, featured ? [featured.id] : [])
```

- **D-Q2**: el destacado se saca con `exclude`, no filtrando antes. Si fuera el único post del año más reciente,
  filtrarlo antes haría que el año anterior se titulara "Ahora".
- Hoy ningún post trae `featured`: el destacado es `post5`, que empata en fecha con `post4` (2026-11-02) y va después en
  el registro.

### 3.3 Relacionados (`related.ts`, puro)

`relatedPosts(post, posts, exclude = [], limit = RELATED_LIMIT)`, con `RELATED_LIMIT = 3`:

- excluye el post actual y los `exclude` (Q2 pasa los ids de `PostNav`);
- solo entran los que comparten al menos una etiqueta, comparadas por slug y contadas una vez;
- ordena por etiquetas en común y luego por fecha.

### 3.4 Series (`series.ts`, puro)

| Export | Forma | Regla |
|---|---|---|
| `findSeries(id, source = series)` | `PostSeries \| null` | El nombre localizado está en `name` |
| `partsOfSeries(posts, seriesId)` | `T[]` | Las de esa serie, ordenadas por `part` |
| `seriesPosition(parts, postId)` | `{ n, total } \| null` | `n` es la posición entre las partes publicadas (desde 1) y `total`, cuántas hay. Con partes sin publicar no sale "parte 3 de 2" |

### 3.5 Feed (`feed.ts`, puro)

| Export | Forma |
|---|---|
| `FeedItem` | `{ title, link, guid, description, pubDate, categories }`. `link` y `guid` son la URL absoluta del post; `categories`, sus etiquetas visibles |
| `toFeedItems(posts, lang, base = getSiteUrl())` | `FeedItem[]`, del más nuevo al más viejo |
| `escapeXml(value)` | Escapa `& < > " '` y quita los caracteres que XML 1.0 no admite. Los `FeedItem` traen texto **crudo**: escápalo una sola vez, al serializar |
| `rfc822Date(iso)` | `'Mon, 02 Nov 2026 00:00:00 GMT'`. Una fecha inválida lanza `RangeError` |
| `feedPath(lang)`, `feedUrl(lang, base?)` | `/{lang}/feed.xml` y su URL absoluta (para `atom:link rel="self"`) |
| `feedAlternates(lang)` | `{ 'application/rss+xml': '/{lang}/feed.xml' }`, para `metadata.alternates.types` |
| `FEED_CONTENT_TYPE` | `'application/rss+xml; charset=utf-8'` |

### 3.6 Formato (`format.ts`)

- `languageName(of, lang)`: el nombre del idioma `of` en el idioma `lang`, con `Intl.DisplayNames` ("inglés",
  "Spanish"). Es para `post.translatedFrom`.
- `parsePostDate` ahora también rechaza un mes fuera de rango: antes, `2026-13-01` pasaba como `2027-01-01`. Ningún
  post se afecta.

### 3.7 Lo que lee el registro (`source.ts`, `server-only`, async)

| Export | Forma | Regla |
|---|---|---|
| `blogPosts(lang)` | `Promise<ListedPost[]>` | `listPosts` en el orden de `orderPosts` (fecha y luego registro). Trae los fallbacks, como el índice de hoy |
| `ownPosts(lang)` | `Promise<ListedPost[]>` | Los mismos, sin fallbacks: solo los que tienen versión en `lang` |
| `allTagSlugs()` | `Promise<string[]>` | La unión de los dos idiomas sobre `ownPosts` (R-503). Es el `generateStaticParams` de `/blog/tag/[tag]` |
| `tagSlugsIn(lang)` | `Promise<string[]>` | Las etiquetas con posts en ese idioma |
| `seriesParts(seriesId, lang)` | `Promise<ListedPost[]>` | `partsOfSeries` sobre `ownPosts(lang)` |
| `feedItems(lang, base?)` | `Promise<FeedItem[]>` | `toFeedItems` sobre `ownPosts(lang)`: un post sin traducción solo sale en el feed de su idioma |

**D-Q1**: data-model §4 mostraba `allTagSlugs`, `seriesParts` y `feedItems` síncronas. Son `async` porque el registro
carga cada MDX con `import()`. Cada una tiene su versión pura (`uniqueTagSlugs`, `partsOfSeries` y `toFeedItems`), que
recibe los posts y es la que se prueba con dobles.

## 4. JSON-LD `BlogPosting` (`lib/seo/blog-posting.ts`, A-502)

```ts
blogPostingJsonLd(meta: PostMeta, lang: Locale, url: string, base: URL = getSiteUrl()): BlogPostingJsonLd
```

| Campo | Valor |
|---|---|
| `@context`, `@type` | `https://schema.org`, `BlogPosting` |
| `headline`, `description` | `meta.title`, `meta.description` |
| `datePublished` | `meta.date` |
| `dateModified` | `meta.updated`, solo si existe |
| `inLanguage` | `meta.lang`: el idioma del contenido. En un fallback es el idioma que realmente se lee |
| `image` | `{base}{postOgImagePath(lang, id)}` = `{base}/{lang}/blog/{id}/opengraph-image/og` |
| `keywords` | `meta.tags` |
| `url` | el `url` recibido |
| `isPartOf` | `{ '@type': 'Blog', url: '{base}/{lang}/blog' }` |
| `author` | `{ '@id': personId(base) }`, el mismo `@id` del `Person` del layout, sin repetir sus datos |

Receta (Q2, T627), en `app/[lang]/blog/[id]/page.tsx`:

```tsx
<script type="application/ld+json" data-cw-blog-posting dangerouslySetInnerHTML={{ __html: jsonLdScript(blogPostingJsonLd(post.meta, lang, url)) }} />
```

- `jsonLdScript` (de `lib/seo/person.ts`) escapa `<`. `lib/seo/person.ts` no cambió.
- En un fallback, pasa como `url` la canónica (`postUrl(meta.lang, id)`), que es la que ya declara `postAlternates`.
- **Para Q3**: `image` da por hecho que `app/[lang]/blog/[id]/opengraph-image.tsx` usa `generateImageMetadata` con
  `OG_DEFAULT_ID` (`'og'`), como la receta de contracts-p0 §7. Hasta que Q3 integre, esa URL responde 404.

## 5. Sitemap (`app/sitemap.ts`, A-507)

- Suma `/{lang}/blog/tag/<slug>` por cada etiqueta, **solo en los idiomas donde tiene posts**. Sus `alternates` enlazan
  solo esos idiomas; `x-default` va únicamente si la etiqueta existe en los dos.
- Los posts declaran `lastModified` = `updated ?? date`.
- El resto no cambia: las mismas páginas, los 15 casos y los posts en ambos idiomas.
- **D-Q4**: el plan decía `allTagSlugs × idiomas`. Las etiquetas son por idioma, así que la página del otro idioma es la
  lista vacía de R-503. Ponerla en el sitemap invita a indexar una página sin contenido y declara un `hreflang` falso. La
  página vacía sigue existiendo para quien llega por un enlace compartido.
- Hasta que Q1 integre T614, esas URLs responden 404. `tests/e2e/l3` solo marca respuestas 5xx.

## 6. Contratos entre lanes (los del plan, ya con su forma final)

| Contrato | Proveedor | Consumidores | Forma |
|---|---|---|---|
| URL de etiqueta | `lib/blog/tags.ts` | Q1, Q2, Q3 | `tagPath(lang, tag)` = `/{lang}/blog/tag/<tagSlug(tag)>` |
| Páginas de etiqueta | `lib/blog/source.ts` | Q1 | `allTagSlugs()` para `generateStaticParams`; la lista con `postsWithTag(await ownPosts(lang), slug)`, que es lo mismo que publica el sitemap. Con `blogPosts`, un post sin traducción aparecería en la etiqueta del otro idioma en vez de la lista vacía del edge case |
| Grupos por año | `lib/blog/groups.ts` | Q1 | `featuredPost(posts)` y `groupByYear(posts, [featured.id])` |
| Relacionados | `lib/blog/related.ts` | Q2 | `relatedPosts(post, posts, exclude)`, hasta 3, con `exclude` = los ids del anterior y el siguiente de `PostNav` |
| Series | `lib/blog/series.ts` y `source.ts` | Q2 | `findSeries(id)`, `seriesParts(id, lang)` y `seriesPosition(parts, postId)` |
| Feed | `lib/blog/feed.ts` y `source.ts` | Q3, y Q1 y Q2 (`alternates`) | `feedItems(lang)`, `escapeXml`, `rfc822Date`, `feedUrl` y `feedAlternates(lang)` |
| `BlogPosting` | `lib/seo/blog-posting.ts` | Q2 | §4 |
| Imagen OG del post | Q3 | Q2 (vía `BlogPosting.image`) | `/{lang}/blog/{id}/opengraph-image/og` |
| Portada generada | Q1 (`components/blog/index/GeneratedCover.tsx`) | Q2 | `{ title, date, tags, lang, variant }`, data-model §6 |

`alternates` con el feed, en el índice, la página de etiqueta y el post:

```ts
alternates: { ...alternates(blogPath(lang)), types: feedAlternates(lang) }
```

## 7. Para Q1 y Q2 (006, T857)

- **Tarjetas con portada y `float={1}` (Q1)**: `PostMeta` trae `image` siempre y `cover: 'generated'` cuando no hay
  portada propia. `GeneratedCover` recibe `title`, `date`, `tags` y `lang` de la meta. `GlassSurface float={1}` es de
  contracts-m0 §5; Q0 no lo toca.
- **Índice del post en una hoja (Q2)**: los encabezados siguen saliendo de `buildOutline` (`TocHeading[]`), sin cambios.
  La hoja es `BottomSheet` (contracts-m0 §9). La barra de progreso en el header pide una enmienda de M0, no de Q0.

## 8. Lo que Q0 no hace

- **T628 (P-505)** sigue bloqueada: Q0 solo deja el copy `listen.*`, con paridad, sin consumidor.
- **P-501 a P-504** no tocan Q0: son de Q2 (P-503) y de Q4 (P-501, P-502, P-504).
- No se escribió ningún post ni se cambió el texto de los que existen. Ninguno trae todavía `featured`, `updated`,
  `series` ni `cover`.

## 9. Desviaciones

| ID | Qué | Por qué |
|---|---|---|
| D-Q1 | `allTagSlugs`, `seriesParts` y `feedItems` son `async` y viven en `source.ts` (`server-only`); suman `blogPosts`, `ownPosts` y `tagSlugsIn` | §3.7 |
| D-Q2 | `groupByYear` recibe `exclude` | §3.2 |
| D-Q3 | `index.tagResults.one`, clave en singular que no estaba en la tabla | Hoy casi todas las etiquetas tienen un solo post, y "1 posts con «carrera»" no es correcto |
| D-Q4 | El sitemap lista cada etiqueta solo en los idiomas donde tiene posts | §5 |
| D-Q5 | `seriesPosition` cuenta la posición entre las partes publicadas, no el número de `part` | El edge case "el total cuenta solo las publicadas" |
| D-Q6 | Exports de apoyo que el data-model no nombraba: `postTags`, `postsWithTag`, `hasTag`, `uniqueTagSlugs`, `postYear`, `RELATED_LIMIT`, `findSeries`, `seriesPosition`, `toFeedItems`, `rfc822Date`, `feedPath`, `feedUrl`, `FEED_CONTENT_TYPE`, `languageName`, `postOgImagePath` y el tipo `BlogPostingJsonLd` | Que Q1, Q2 y Q3 no repitan la normalización de slugs, las fechas ni las rutas |
| D-Q7 | `blogPostingJsonLd` recibe `base` opcional (como `personJsonLd`), e `inLanguage` es `meta.lang` | Pruebas sin variables de entorno, y un fallback no declara un idioma que no es el del texto |
| D-Q8 | `parsePostDate` rechaza meses fuera de rango | Era un error: `2026-13-01` pasaba como fecha válida |

## 10. Pruebas que protegen este contrato

| Prueba | Qué cuida |
|---|---|
| `tests/unit/q0/tags.test.ts` | Slugs con mayúsculas, tildes y espacios, estables; `tagPath`; `postTags`; filtro por slug; unión de los dos idiomas en el registro real |
| `tests/unit/q0/groups.test.ts` | "Ahora" es el año más reciente con posts, no el del calendario; orden; destacado fuera de la grilla y decidido antes; `featuredPost` con ninguno, uno y dos marcados |
| `tests/unit/q0/related.test.ts` | Hasta 3; orden por coincidencias y fecha; sin el propio, el anterior ni el siguiente; sin relacionados de relleno |
| `tests/unit/q0/series.test.ts` | `series.ts` vacío; partes ordenadas; posición y total solo con las publicadas |
| `tests/unit/q0/feed.test.ts` | Escape de las cinco entidades y de caracteres inválidos; RFC 822; fechas inválidas; rutas; solo los posts con versión en el idioma |
| `tests/unit/q0/meta.test.ts` | Reglas de §1 sobre los MDX reales, cada una probada también fallando |
| `tests/unit/q0/blog-posting.test.ts` | Campos de R-507, `@id` igual al del `Person`, `dateModified` opcional, idioma del contenido y `<` escapado |
| `tests/unit/q0/copy.test.ts` | Tabla "Copy" palabra por palabra en ES y EN, singular, nota de traducción y claves en uso sin cambios |
| `tests/unit/q0/sitemap.test.ts` | Etiquetas por idioma con sus `alternates`, y el resto del sitemap igual |
| `tests/unit/q0/signatures.ts` | Firmas de §1, §3 y §4 a nivel de tipos (lo revisa `npm run typecheck`) |
| `tests/e2e/q0/blog-base.spec.ts` | Bienvenida y meta description nuevas sin JS, en ES y EN; etiquetas en `/sitemap.xml` |

## 11. Impacto en pruebas de otras lanes

| Prueba | Qué pasa | Quién la ajusta |
|---|---|---|
| `tests/e2e/l4/blog.spec.ts:62` › "el índice muestra bienvenida, átomo y una tarjeta enlazada por post" (`no-js`) | Busca la bienvenida vieja ("Hice este espacio para compartir más sobre mí"), que FR-503 reemplaza. Ajuste de una línea: buscar "Notas de un arquitecto que trabaja con agentes" | Orquestador o Q1 (T612), al integrar |
| `tests/e2e/l3` (escaneo de privacidad) | Recorre el sitemap: verá las URLs de etiqueta con 404 hasta que integre Q1. Solo marca 5xx | — |
