import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import styles from '@/components/site/about/About.module.scss'
import { AboutCareer } from '@/components/site/about/AboutCareer'
import { AboutDescription } from '@/components/site/about/AboutDescription'
import { AboutFigures } from '@/components/site/about/AboutFigures'
import { BrainScene } from '@/components/site/about/BrainScene'
import { aboutFigures } from '@/components/site/about/figures'
import { SceneNav } from '@/components/site/about/SceneNav'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { SectionTitle } from '@/components/site/SectionTitle'
import { getProjects, getSite } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

const ABOUT_SCENES = { who: 'scene-who', career: 'scene-career', knowledge: 'scene-knowledge' } as const

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
  const projects = getProjects()
  const present = t(dict, 'about.present')
  const figures = aboutFigures(about, projects.length, new Date())
  const since = figures.find((figure) => figure.id === 'years')?.since

  return (
    <div className={styles.page}>
      <BackgroundIntensity value="subtle" />
      <SceneNav
        label={t(dict, 'about.scenes')}
        scenes={[
          { id: ABOUT_SCENES.who, label: t(dict, 'about.scene.who') },
          { id: ABOUT_SCENES.career, label: t(dict, 'about.career') },
          { id: ABOUT_SCENES.knowledge, label: t(dict, 'about.scene.knowledge') },
        ]}
      />
      <AboutDescription id={ABOUT_SCENES.who} lang={lang} title={t(dict, 'about.title')} description={about.description} image={about.image}>
        <AboutFigures
          title={t(dict, 'about.figures')}
          figures={figures}
          labels={{
            years: {
              label: t(dict, 'about.figure.years'),
              note: since ? t(dict, 'about.figure.yearsNote', { year: since }) : undefined,
            },
            projects: { label: t(dict, 'about.figure.projects') },
            technologies: { label: t(dict, 'about.figure.technologies') },
            airlines: { label: t(dict, 'about.figure.airlines'), note: t(dict, 'about.figure.airlinesNote') },
          }}
        />
      </AboutDescription>
      <AboutCareer
        id={ABOUT_SCENES.career}
        lang={lang}
        title={t(dict, 'about.career')}
        presentLabel={present}
        openLabel={t(dict, 'about.openJob')}
        closeLabel={t(dict, 'about.close')}
        entries={about.career}
      />
      <section
        id={ABOUT_SCENES.knowledge}
        className={`${styles.section} ${styles.scene}`}
        aria-labelledby="about-knowledge"
        data-cw-about="knowledge"
        data-cw-scene="knowledge"
      >
        <SectionTitle id="about-knowledge">{t(dict, 'about.scene.knowledge')}</SectionTitle>
        <BrainScene
          lang={lang}
          about={about}
          projects={projects}
          labels={{
            level: (value) => t(dict, 'about.level', { value }),
            present,
            skillsSummary: t(dict, 'about.skillsWords'),
            map: {
              lobes: t(dict, 'about.brain.lobes'),
              sources: t(dict, 'about.brain.sources'),
              sourcesWord: t(dict, 'about.brain.sourcesWord'),
              projectsWord: t(dict, 'about.brain.projectsWord'),
              feeds: t(dict, 'about.brain.feeds'),
              none: t(dict, 'about.brain.none'),
              core: getSite().home.name.toUpperCase(),
              path: t(dict, 'about.brain.path'),
              platzi: { href: about.courses.platzi.href, label: about.courses.platzi.label[lang], newTab: t(dict, 'a11y.newTab') },
            },
          }}
        />
      </section>
    </div>
  )
}
