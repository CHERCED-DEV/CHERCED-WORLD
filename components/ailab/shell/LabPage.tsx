import Link from 'next/link'
import { labCatalog, labThemes } from '@/content/ailab/catalog'
import type { LabExperiment } from '@/content/types'
import { SectionTitle } from '@/components/site/SectionTitle'
import { GlowOrb, GridLines, Hairline } from '@/components/ui/graphics'
import { localizedPath, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { ConsentDialog } from './ConsentDialog'
import { LabCardView } from './LabCard'
import { LabClearButton } from './LabClearButton'
import {
  labCardLabels,
  labClearLabels,
  labConsentLabels,
  labDemoCopy,
  labPageLabels,
  labTryLabels,
  type LabCardLabels,
  type LabPageLabels,
} from './labels'
import styles from './LabPage.module.scss'
import type { LabClearLabels, LabConsentLabels, LabTryLabels } from './types'

export type LabCardInput = { experiment: LabExperiment; tryLabels: LabTryLabels; copy: Record<string, string> }

export type LabPageViewProps = {
  lang: Locale
  labels: LabPageLabels
  cardLabels: LabCardLabels
  consentLabels: LabConsentLabels
  clearLabels: LabClearLabels
  cards: LabCardInput[]
}

export function themeSectionId(theme: string): string {
  return `ailab-${theme}`
}

export function LabPageView({ lang, labels, cardLabels, consentLabels, clearLabels, cards }: LabPageViewProps) {
  const groups = labThemes(cards.map((card) => card.experiment))
  const byId = new Map(cards.map((card) => [card.experiment.id, card]))

  return (
    <div className={styles.page} data-cw-ailab="">
      <header className={styles.hero}>
        <GridLines fade="radial" />
        <GlowOrb size="md" x="50%" y="10%" />
        <SectionTitle as="h1" id="ailab-title" size="lg">
          {labels.title}
        </SectionTitle>
        <p className={styles.intro}>{labels.intro}</p>
        <p className={styles.privacy} data-cw-ailab-privacy="">
          <svg className={styles.privacyIcon} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            {labels.privacy}{' '}
            <Link href={localizedPath(lang, '/privacy')} className={styles.privacyLink}>
              {labels.privacyMore}
            </Link>
          </span>
        </p>
        <nav className={styles.themes} aria-label={labels.themesLabel}>
          <ul>
            {groups.map((group) => (
              <li key={group.theme}>
                <a href={`#${themeSectionId(group.theme)}`} className={styles.themeLink} data-cw-ailab-theme-link={group.theme}>
                  {labels.themes[group.theme]}
                  <span className={styles.themeCount} aria-hidden="true">
                    {group.experiments.length}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <LabClearButton labels={clearLabels} />
      </header>

      {groups.map((group) => {
        const headingId = `${themeSectionId(group.theme)}-title`
        return (
          <section
            key={group.theme}
            id={themeSectionId(group.theme)}
            className={styles.theme}
            aria-labelledby={headingId}
            data-cw-ailab-theme={group.theme}
          >
            <div className={styles.themeHead}>
              <h2 id={headingId} className={styles.themeTitle}>
                {labels.themes[group.theme]}
              </h2>
              <Hairline glint className={styles.themeLine} />
            </div>
            {group.theme === 'agents' ? <p className={styles.themeIntro}>{labels.plugins}</p> : null}
            <div className={styles.grid}>
              {group.experiments.map((experiment) => {
                const card = byId.get(experiment.id)
                if (!card) return null
                return (
                  <LabCardView
                    key={experiment.id}
                    lang={lang}
                    experiment={experiment}
                    labels={cardLabels}
                    tryLabels={card.tryLabels}
                    copy={card.copy}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      <ConsentDialog lang={lang} labels={consentLabels} />
    </div>
  )
}

export async function LabPage({ lang, catalog = labCatalog }: { lang: Locale; catalog?: readonly LabExperiment[] }) {
  const [ailab, site, blog] = await Promise.all([getDictionary(lang, 'ailab'), getDictionary(lang, 'site'), getDictionary(lang, 'blog')])
  return (
    <LabPageView
      lang={lang}
      labels={labPageLabels(ailab)}
      cardLabels={labCardLabels(ailab, site, blog)}
      consentLabels={labConsentLabels(ailab)}
      clearLabels={labClearLabels(ailab)}
      cards={catalog.map((experiment) => ({
        experiment,
        tryLabels: labTryLabels(ailab, experiment.title[lang]),
        copy: labDemoCopy(ailab, experiment.id),
      }))}
    />
  )
}
