import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runInNewContext } from 'node:vm'
import type { Locale, PostMeta } from '@/content/types'

export const POSTS_DIR = path.resolve(process.cwd(), 'content', 'posts')

export type PostFile = { id: string; lang: Locale; file: string; meta: PostMeta; paragraphs: string[]; source: string }

const META_BLOCK = /^export const meta = (\{[\s\S]*?\n\})\n/

export function readPostFile(id: string, lang: Locale): PostFile | null {
  const file = path.join(POSTS_DIR, id, `${lang}.mdx`)
  if (!existsSync(file)) return null
  const source = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const match = META_BLOCK.exec(source)
  if (!match) throw new Error(`${id}/${lang}.mdx no empieza con export const meta`)
  const meta = runInNewContext(`(${match[1]})`) as PostMeta
  const paragraphs = source
    .slice(match[0].length)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
  return { id, lang, file, meta, paragraphs, source }
}
