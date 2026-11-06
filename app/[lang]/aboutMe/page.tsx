import type { Metadata } from 'next'
import { BackgroundIntensity } from '@/components/motion'
import styles from '@/components/site/about/About.module.scss'
import { AboutCareer } from '@/components/site/about/AboutCareer'
import { AboutDescription } from '@/components/site/about/AboutDescription'
import { AboutFigures } from '@/components/site/about/AboutFigures'
import { BrainScene } from '@/components/site/about/BrainScene'
import { Certifications } from '@/components/site/about/Certifications'
import { aboutFigures } from '@/components/site/about/figures'
import { SceneNav } from '@/components/site/about/SceneNav'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { SectionTitle } from '@/components/site/SectionTitle'
import { formatFact, synergosFacts } from '@/content/synergos'
import { getProjects, getSite } from '@/lib/content'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: LangParams }

const ABOUT_SCENES = { who: 'scene-who', career: 'scene-career', knowledge: 'scene-knowledge' } as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const [site, common] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'common')])
  return pageMetadata({
    lang,
    path: '/aboutMe',
    title: t(site, 'meta.about.title'),
    description: t(site, 'meta.about.description'),
    common,
    ogImageFile: true,
  })
}

export default async function AboutMePage({ params }: Props) {
  const lang = await resolveLang(params)
  const [dict, common, portfolio] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'common'), getDictionary(lang, 'portfolio')])
  const { about } = getSite()
  const projects = getProjects()
  const present = t(dict, 'about.present')
  const figures = aboutFigures(about, new Date())
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
          lang={lang}
          title={t(dict, 'about.figures')}
          figures={figures}
          labels={{
            years: {
              label: t(dict, 'about.figure.years'),
              note: since ? t(dict, 'about.figure.yearsNote', { year: since }) : undefined,
            },
            pieces: {
              label: t(dict, 'about.figure.pieces'),
              note: t(dict, 'about.figure.piecesNote', {
                capabilities: formatFact(synergosFacts.capabilities, lang),
                orchestrators: formatFact(synergosFacts.orchestrators, lang),
              }),
            },
            adrs: { label: t(dict, 'about.figure.adrs'), note: t(dict, 'about.figure.adrsNote') },
            tests: { label: t(dict, 'about.figure.tests'), note: t(dict, 'about.figure.testsNote') },
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
        prevLabel={t(portfolio, 'case.prev')}
        nextLabel={t(portfolio, 'case.next')}
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
            map: {
              lobes: t(dict, 'about.brain.lobes'),
              sources: t(dict, 'about.brain.sources'),
              sourcesWord: t(dict, 'about.brain.sourcesWord'),
              appliedWord: t(dict, 'about.brain.appliedWord'),
              projectsWord: t(dict, 'about.brain.projectsWord'),
              principles: t(dict, 'about.principles'),
              words: t(dict, 'about.skillsWords'),
              feeds: t(dict, 'about.brain.feeds'),
              core: getSite().home.name.toUpperCase(),
              path: t(dict, 'about.brain.path'),
              platzi: { href: about.courses.platzi.href, label: about.courses.platzi.label[lang], newTab: t(dict, 'a11y.newTab') },
              terminal: {
                input: t(dict, 'about.terminal.input'),
                hint: t(dict, 'about.terminal.hint'),
                output: t(dict, 'about.terminal.output'),
              },
              sheet: {
                close: t(common, 'dialog.close'),
                prev: t(portfolio, 'case.prev'),
                next: t(portfolio, 'case.next'),
              },
            },
          }}
        />
        <Certifications
          lang={lang}
          items={about.certifications ?? []}
          profileHref={about.courses.platzi.href}
          labels={{
            title: t(dict, 'about.certifications'),
            profile: about.courses.platzi.label[lang],
            newTab: t(dict, 'a11y.newTab'),
          }}
        />
      </section>
    </div>
  )
}
