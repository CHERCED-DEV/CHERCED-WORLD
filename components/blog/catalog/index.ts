import type { LoadedPost } from '@/lib/content'
import type { PostLoader, PostModule } from '@/content/posts/registry'
import { otherLocale, type Locale } from '@/lib/i18n'

export const CATALOG_ID = 'catalog'

const catalog: Partial<Record<Locale, PostLoader>> = {
  es: () => import('./es.mdx') as Promise<PostModule>,
}

export async function loadCatalog(lang: Locale): Promise<LoadedPost> {
  const own = catalog[lang]
  const loader = own ?? catalog[otherLocale(lang)]
  if (!loader) throw new Error('[blog] El catálogo no tiene ningún idioma')
  const mod = await loader()
  return { Content: mod.default, meta: mod.meta, fallback: !own }
}
