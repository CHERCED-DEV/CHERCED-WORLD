import { describe, expect, it, vi } from 'vitest'
import { formatPostDate } from '@/lib/blog/format'
import { locales } from '@/lib/i18n'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { OG_SIZE } from '@/lib/og/template'
import { blogPostingJsonLd, postOgImagePath } from '@/lib/seo/blog-posting'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { default: Image, generateImageMetadata } = await import('@/app/[lang]/blog/[id]/opengraph-image')
const { ownPosts } = await import('@/lib/blog/source')
const { postIds } = await import('@/lib/content')

const BASE = new URL('https://cherced-world.test')

function pngSize(png: Buffer): [number, number] {
  expect(png.subarray(1, 4).toString('latin1')).toBe('PNG')
  return [png.readUInt32BE(16), png.readUInt32BE(20)]
}

describe('imagen OG de cada post (FR-520, R-502)', () => {
  it('post4 lleva título, fecha y etiquetas en el alt de cada idioma', async () => {
    expect(await generateImageMetadata({ params: Promise.resolve({ lang: 'es', id: 'post4' }) })).toEqual([
      {
        id: 'og',
        alt: 'De un portafolio de 2023 a uno hecho con Spec-Driven Development y agentes: 2 de noviembre de 2026 · desarrollo guiado por especificaciones · agentes de IA · nextjs · arquitectura',
        size: { width: 1200, height: 630 },
        contentType: 'image/png',
      },
    ])
    const [en] = await generateImageMetadata({ params: { lang: 'en', id: 'post4' } })
    expect(en?.alt).toBe(
      'From a 2023 portfolio to one built with Spec-Driven Development and agents: November 2, 2026 · spec-driven-development · ai-agents · nextjs · architecture',
    )
  })

  it('las etiquetas con espacios y tildes se muestran tal cual, no como slug', async () => {
    const [image] = await generateImageMetadata({ params: { lang: 'es', id: 'post2' } })
    expect(image?.alt).toBe(
      'El futuro de la humanidad y la inteligencia artificial: 6 de abril de 2023 · inteligencia artificial · opinión',
    )
  })

  it.each(locales)('cada post en %s tiene una imagen de 1200 × 630 con su título, su fecha y sus etiquetas', async (lang) => {
    const posts = await ownPosts(lang)
    expect(posts.map((post) => post.id).sort()).toEqual(postIds().sort())
    for (const post of posts) {
      const images = await generateImageMetadata({ params: Promise.resolve({ lang, id: post.id }) })
      expect(images, `${lang}/${post.id}`).toHaveLength(1)
      const [image] = images
      expect(image).toMatchObject({ id: OG_DEFAULT_ID, size: OG_SIZE, contentType: 'image/png' })
      expect(image?.alt.startsWith(`${post.title}: ${formatPostDate(post.date, lang)}`), `${lang}/${post.id}`).toBe(true)
      for (const tag of post.tags) expect(image?.alt, `${lang}/${post.id}`).toContain(` · ${tag}`)
    }
  })

  it.each(locales)('la URL de la imagen en %s es la que publica el BlogPosting de Q0', async (lang) => {
    for (const post of await ownPosts(lang)) {
      const [image] = await generateImageMetadata({ params: { lang, id: post.id } })
      expect(postOgImagePath(lang, post.id)).toBe(`/${lang}/blog/${post.id}/opengraph-image/${image?.id}`)
      expect(blogPostingJsonLd(post, lang, `${BASE.origin}/${lang}/blog/${post.id}`, BASE).image).toBe(
        `https://cherced-world.test/${lang}/blog/${post.id}/opengraph-image/og`,
      )
    }
  })

  it('no inventa imagen para un post o un idioma que no existen', async () => {
    expect(await generateImageMetadata({ params: Promise.resolve({ lang: 'es', id: 'no-existe' }) })).toEqual([])
    expect(await generateImageMetadata({ params: { lang: 'fr', id: 'post4' } })).toEqual([])
    await expect(Image({ params: Promise.resolve({ lang: 'es', id: 'no-existe' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    })
    await expect(Image({ params: Promise.resolve({ lang: 'fr', id: 'post4' }) })).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    })
  })

  it.each(locales)('el post de título más largo en %s se pinta como PNG de 1200 × 630', async (lang) => {
    const longest = [...(await ownPosts(lang))].sort((a, b) => b.title.length - a.title.length)[0]
    if (!longest) throw new Error('sin posts')
    const response = await Image({ params: Promise.resolve({ lang, id: longest.id }) })
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(pngSize(Buffer.from(await response.arrayBuffer()))).toEqual([1200, 630])
  }, 60_000)
})
