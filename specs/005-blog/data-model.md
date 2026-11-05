# Data model 005

Cambios de tipos y contratos del blog. Las enmiendas A-5xx están en el [plan](./plan.md).

## 1. `PostMeta` (A-501, `content/types.ts`)

```ts
export type PostMeta = {
  featured?: true
  updated?: string
  series?: { id: string; part: number }
  cover?: 'generated'
}
```

El tipo de arriba solo muestra los campos nuevos. Los de hoy se quedan: `id`, `lang`, `originalLang`, `title`,
`description`, `date`, `tags`, `image` y `author`.

- `image` sigue obligatoria, así que ningún consumidor deja de compilar en `q0-frozen`.
- `featured`: como máximo un post por idioma. Si hay más de uno, gana el más reciente y una prueba avisa.
- `updated`: fecha ISO `AAAA-MM-DD`, igual o posterior a `date`.
- `series.id` debe existir en `content/posts/series.ts`, y `part` es un entero de 1 en adelante, único dentro de la
  serie y del idioma.
- `cover: 'generated'`: la tarjeta y el post usan `GeneratedCover` en vez de `image` (R-502).
  - Propuesta para el post 3, cuya imagen hoy es el logo de la marca. Lo confirma el autor en la revisión de Q1.

## 2. Series (`content/posts/series.ts`, nuevo)

```ts
export type PostSeries = { id: string; name: Localized }

export const series: PostSeries[] = []
```

Arranca vacío: ninguna serie está decidida. "Building Synergos" es el ejemplo del handoff, no una decisión. La primera
serie la crea el autor al publicar su primera parte.

## 3. Copy del blog (A-504)

- `site.blog.welcome` y `meta.blog.description`: la sección "Copy" de la spec.
- Claves nuevas de `blog.json`: las de la tabla "Copy" de la spec (`index.*`, `callout.*`, `series.position`,
  `related.title`, `author.*`, `post.translatedFrom`, `post.updated` y `listen.*`).

## 4. Utilidades de `lib/blog` (Q0)

| Función | Firma | Regla |
|---|---|---|
| `tagSlug` | `(tag: string) => string` | `slugify` de `lib/blog/slug.ts` |
| `tagPath` | `(lang, tag) => string` | `/{lang}/blog/tag/<slug>` |
| `allTagSlugs` | `() => string[]` | Unión de los dos idiomas, sin duplicados (R-503) |
| `groupByYear` | `(posts) => { year: number; label: 'now' \| 'archive'; posts }[]` | Año más reciente con posts = `now` (R-504) |
| `featuredPost` | `(posts) => post \| null` | El de `featured`; si no hay, el más reciente |
| `relatedPosts` | `(post, posts, exclude: string[]) => post[]` | Hasta 3, por etiquetas en común y luego por fecha |
| `seriesParts` | `(seriesId, lang) => post[]` | Partes publicadas en el idioma, ordenadas por `part` |
| `feedItems` | `(lang) => FeedItem[]` | Posts con versión en `lang`, del más nuevo al más viejo |
| `feedAlternates` | `(lang) => Metadata['alternates']['types']` | `{ 'application/rss+xml': '/{lang}/feed.xml' }` |

```ts
export type FeedItem = {
  title: string
  link: string
  guid: string
  description: string
  pubDate: string
  categories: string[]
}
```

## 5. `BlogPosting` (A-502, `lib/seo/blog-posting.ts`)

```ts
export function blogPostingJsonLd(meta: PostMeta, lang: Locale, url: string): Record<string, unknown>
```

Los campos están en research R-507. `author` es `{ "@id": "{base}/#person" }`, sin repetir los datos del `Person`.

## 6. Componentes con contrato

| Componente | Lane | Props | Regla |
|---|---|---|---|
| `components/blog/index/GeneratedCover.tsx` | Q1 (lo usa Q2) | `{ title, date, tags, lang, variant: 'card' \| 'cover' }` | Solo HTML y CSS, sin imagen; contraste AA sobre cristal |
| `components/blog/mdx/Callout.tsx` | Q2 | `{ type: 'decision' \| 'tradeoff' \| 'learned'; children }` | `<aside>` con título visible (`callout.<type>`) |
| `components/blog/post/AuthorBox.tsx` | Q2 | `{ lang }` | Retrato según el tema, `author.line` y enlace a Contacto, desde `content/site.ts` |
| `components/blog/post/ListenPlayer.tsx` | Q2, **bloqueado** | `{ lang, target }` | Contrato de research R-508 |

## 7. Rutas nuevas

| Ruta | Render | Lane |
|---|---|---|
| `/{lang}/blog/tag/[tag]` | Estático (`generateStaticParams` con la unión; `dynamicParams = false`) | Q1 |
| `/{lang}/feed.xml` | Estático (`force-static`) | Q3 |
| `/{lang}/blog/[id]/opengraph-image` | Estático | Q3 |
