import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Locale, PostMeta } from '@/content/types'

const POSTS_DIR = join(process.cwd(), 'content', 'posts')
const LANGS: Locale[] = ['es', 'en']

export function readMeta(file: string): PostMeta {
  const source = readFileSync(file, 'utf8')
  const match = source.match(/export const meta = (\{[\s\S]*?\n\})/)
  if (!match?.[1]) throw new Error(`Sin "export const meta" en ${file}`)
  return new Function(`return (${match[1]})`)() as PostMeta
}

type Loader = () => Promise<{ default: () => null; meta: PostMeta }>

export function registryFromDisk(): Record<string, Partial<Record<Locale, Loader>>> {
  const registry: Record<string, Partial<Record<Locale, Loader>>> = {}
  for (const entry of readdirSync(POSTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const loaders: Partial<Record<Locale, Loader>> = {}
    for (const lang of LANGS) {
      const file = join(POSTS_DIR, entry.name, `${lang}.mdx`)
      if (existsSync(file)) loaders[lang] = async () => ({ default: () => null, meta: readMeta(file) })
    }
    if (Object.keys(loaders).length > 0) registry[entry.name] = loaders
  }
  return registry
}
