import 'server-only'
import { defaultLocale, type Locale, type Namespace } from './config'
import type { Dictionary } from './translate'

type Loader = () => Promise<{ default: Record<string, string> }>

const loaders: Record<Locale, Record<Namespace, Loader>> = {
  es: {
    common: () => import('@/content/i18n/es/common.json'),
    site: () => import('@/content/i18n/es/site.json'),
    motion: () => import('@/content/i18n/es/motion.json'),
    contact: () => import('@/content/i18n/es/contact.json'),
    admin: () => import('@/content/i18n/es/admin.json'),
    privacy: () => import('@/content/i18n/es/privacy.json'),
    blog: () => import('@/content/i18n/es/blog.json'),
    experience: () => import('@/content/i18n/es/experience.json'),
    home: () => import('@/content/i18n/es/home.json'),
    portfolio: () => import('@/content/i18n/es/portfolio.json'),
    ailab: () => import('@/content/i18n/es/ailab.json'),
  },
  en: {
    common: () => import('@/content/i18n/en/common.json'),
    site: () => import('@/content/i18n/en/site.json'),
    motion: () => import('@/content/i18n/en/motion.json'),
    contact: () => import('@/content/i18n/en/contact.json'),
    admin: () => import('@/content/i18n/en/admin.json'),
    privacy: () => import('@/content/i18n/en/privacy.json'),
    blog: () => import('@/content/i18n/en/blog.json'),
    experience: () => import('@/content/i18n/en/experience.json'),
    home: () => import('@/content/i18n/en/home.json'),
    portfolio: () => import('@/content/i18n/en/portfolio.json'),
    ailab: () => import('@/content/i18n/en/ailab.json'),
  },
}

export async function getDictionary<N extends Namespace>(lang: Locale, ns: N): Promise<Dictionary> {
  const base = (await loaders[defaultLocale][ns]()).default
  if (lang === defaultLocale) return Object.freeze({ ...base })
  const own = (await loaders[lang][ns]()).default
  return Object.freeze({ ...base, ...own })
}
