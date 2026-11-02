import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import styles from '@/components/site/about/About.module.scss'
import { AboutCareer } from '@/components/site/about/AboutCareer'
import { AboutCourses } from '@/components/site/about/AboutCourses'
import { AboutDescription } from '@/components/site/about/AboutDescription'
import { AboutEducation } from '@/components/site/about/AboutEducation'
import { AboutLanguages } from '@/components/site/about/AboutLanguages'
import { AboutSkills } from '@/components/site/about/AboutSkills'
import { AboutTechnologies } from '@/components/site/about/AboutTechnologies'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { getSite } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [site, common] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'common')])
  const { about } = getSite()
  return pageMetadata({
    lang,
    path: '/aboutMe',
    title: t(site, 'meta.about.title'),
    description: t(site, 'meta.about.description'),
    common,
    image: { url: about.image.src, width: about.image.width, height: about.image.height, alt: about.image.alt[lang] },
  })
}

export default async function AboutMePage({ params }: Props) {
  const lang = await resolveLang(params)
  const dict = await getDictionary(lang, 'site')
  const { about } = getSite()
  const present = t(dict, 'about.present')
  const level = (value: number) => t(dict, 'about.level', { value })

  return (
    <div className={styles.page}>
      <BackgroundIntensity value="subtle" />
      <AboutDescription lang={lang} title={t(dict, 'about.title')} description={about.description} image={about.image} />
      <AboutCareer lang={lang} title={t(dict, 'about.career')} presentLabel={present} entries={about.career} />
      <AboutSkills lang={lang} title={t(dict, 'about.skills')} skills={about.skills} />
      <AboutTechnologies
        title={t(dict, 'about.technologies')}
        tech={about.skills.tech}
        levelLabel={level}
        showMore={t(dict, 'about.showMore')}
        showLess={t(dict, 'about.showLess')}
      />
      <AboutCourses lang={lang} title={t(dict, 'about.courses')} newTab={t(dict, 'a11y.newTab')} courses={about.courses} />
      <AboutEducation lang={lang} title={t(dict, 'about.education')} presentLabel={present} entries={about.education} />
      <AboutLanguages lang={lang} title={t(dict, 'about.languages')} languages={about.languages} levelLabel={level} />
    </div>
  )
}
