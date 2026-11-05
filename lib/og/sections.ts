import commonEn from '@/content/i18n/en/common.json'
import commonEs from '@/content/i18n/es/common.json'
import contactEn from '@/content/i18n/en/contact.json'
import contactEs from '@/content/i18n/es/contact.json'
import siteEn from '@/content/i18n/en/site.json'
import siteEs from '@/content/i18n/es/site.json'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import type { OgInput } from './template'

export type OgSection = 'home' | 'about' | 'services' | 'portfolio' | 'contact' | 'now'

export const OG_DEFAULT_ID = 'og'

const dictionaries: Record<Locale, Dictionary> = {
  es: Object.freeze({ ...commonEs, ...siteEs, ...contactEs }),
  en: Object.freeze({ ...commonEs, ...siteEs, ...contactEs, ...commonEn, ...siteEn, ...contactEn }),
}

export function ogSection(lang: Locale, section: OgSection): OgInput {
  const dict = dictionaries[lang]
  switch (section) {
    case 'home':
      return { lang, title: t(dict, 'brand.author'), line: site.home.title[lang] }
    case 'about':
      return { lang, title: t(dict, 'meta.about.title'), line: t(dict, 'og.about.line') }
    case 'services':
      return { lang, title: t(dict, 'meta.services.title'), line: t(dict, 'og.services.line') }
    case 'portfolio':
      return { lang, title: t(dict, 'meta.portfolio.title'), line: t(dict, 'og.portfolio.line', { count: projects.length }) }
    case 'contact': {
      const availability = site.profile?.availability
      return {
        lang,
        title: t(dict, 'contact.title'),
        line: t(dict, 'og.contact.line', {
          location: availability?.location[lang] ?? '',
          timezone: availability?.timezone ?? '',
        }),
      }
    }
    case 'now':
      return { lang, title: t(dict, 'nowPage.title'), line: t(dict, 'meta.now.description') }
  }
}

export function ogCase(lang: Locale, id: string): OgInput | null {
  const project = projects.find((item) => item.id === id)
  return project ? { lang, title: project.title, line: project.summary[lang] } : null
}
