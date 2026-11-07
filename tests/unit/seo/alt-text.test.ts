import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import type { ImageRef } from '@/content/types'
import { readMeta } from '../l5/support/mdx-registry'

const POSTS = join(process.cwd(), 'content', 'posts')

function mdxFiles(): string[] {
  return readdirSync(POSTS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => readdirSync(join(POSTS, entry.name)).filter((file) => file.endsWith('.mdx')).map((file) => join(POSTS, entry.name, file)))
}

function images(): Array<{ at: string; image: ImageRef }> {
  return [
    { at: 'about.image', image: site.about.image },
    ...projects.flatMap((project) => [
      { at: `project ${project.id}`, image: project.image },
      ...(project.gallery ?? []).map((image, index) => ({ at: `project ${project.id} gallery ${index}`, image })),
    ]),
  ]
}

describe('texto alternativo de las imágenes de contenido (FR-851)', () => {
  it('cada imagen de casos y del retrato tiene alt en ES y EN, distinto del nombre del archivo', () => {
    for (const { at, image } of images()) {
      for (const lang of ['es', 'en'] as const) {
        const alt = image.alt[lang].trim()
        expect(alt.length, `${at} ${lang}`).toBeGreaterThan(10)
        expect(alt, `${at} ${lang}`).not.toMatch(/\.(png|jpe?g|webp|svg)$/i)
      }
    }
  })

  it('cada post trae alt en su imagen y ninguna imagen Markdown va sin alt', () => {
    const files = mdxFiles()
    expect(files.length).toBeGreaterThan(5)
    for (const file of files) {
      expect(readMeta(file).image.alt.trim().length, file).toBeGreaterThan(3)
      const source = readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(/!\[\s*\]\(/)
      expect(source, file).not.toMatch(/<img(?![^>]*\balt=)[^>]*>/i)
    }
  })
})
