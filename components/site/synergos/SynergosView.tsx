import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Project } from '@/content/types'
import { showcaseVerticals, synergosShowcase, SYNERGOS_HARNESS_REPO } from '@/content/synergos-showcase'
import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, GlowOrb, GridLines, Hairline } from '@/components/ui/graphics'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { projectTitle } from '@/lib/content/project-title'
import { localizedPath, type Locale } from '@/lib/i18n'
import { fillTemplate } from '../portfolio/carousel'
import { LiveDiagram, type LiveDiagramLabels } from '../portfolio/LiveDiagram'
import { PortfolioIcon } from '../portfolio/PortfolioIcon'
import { caseDiagram, caseStudyRepos } from '../portfolio/projects'
import { SectionTitle } from '../SectionTitle'
import { AssemblyLine } from './AssemblyLine'
import {
  countedText,
  lanes,
  LINE_STATES,
  lineLabel,
  lineSummary,
  stateLabel,
  MILESTONE_STATES,
  rainDrops,
  showcaseFigures,
  tallLayout,
  tasksText,
  wideLayout,
} from './model'
import styles from './Synergos.module.scss'

export type SynergosViewLabels = { newTab: string; github: string; diagram: LiveDiagramLabels }

export type SynergosViewProps = { lang: Locale; project: Project; build: Project | null; labels: SynergosViewLabels }

const STAGGER = 60

const RAIN = rainDrops(42)

function External({ label }: { label: string }) {
  return (
    <>
      <Icon name="external" size={18} />
      <span className="cw-visually-hidden">{label}</span>
    </>
  )
}

export function SynergosView({ lang, project, build, labels }: SynergosViewProps) {
  const copy = synergosShowcase.copy
  const lines = synergosShowcase.lines
  const repos = caseStudyRepos(project)
  const harness = [...(build ? caseStudyRepos(build) : []), ...repos].find((repo) => repo.label === SYNERGOS_HARNESS_REPO) ?? null
  const diagram = caseDiagram(project, lang)
  const items = lanes(lines, lang)
  const count = lines.length
  const lineLabels = {
    title: fillTemplate(copy.line.diagram[lang], { count }),
    desc: lineSummary(lines, lang),
    director: copy.line.director[lang],
    release: copy.line.release[lang],
    scope: copy.line.scope[lang],
  }
  const counted = countedText(lang)
  const caseHref = localizedPath(lang, `/portfolio/${project.id}`)

  return (
    <div className={styles.page} data-cw-synergos="">
      <GlassSurface as="header" className={styles.hero} edge grain depth light data-cw-synergos-section="hero">
        <GridLines fade="radial" />
        <GlowOrb tone="accent" size="lg" x="85%" y="0%" />
        <CornerMarks />
        <p className={styles.eyebrow}>
          <span className={styles.live} aria-hidden="true" />
          {copy.hero.eyebrow[lang]}
        </p>
        <SectionTitle as="h1" id="synergos-title" size="lg">
          {projectTitle(project, lang)}
        </SectionTitle>
        <p className={styles.lede}>{project.summary[lang]}</p>
        {project.role ? <p className={styles.intro}>{project.role[lang]}</p> : null}
        <nav className={styles.actions} aria-label={copy.hero.links[lang]}>
          <div className={styles.primary}>
            {project.links.live ? (
              <a
                href={project.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: 'solid', size: 'lg', className: styles.button })}
                data-cw-synergos-link="catalog"
              >
                <PortfolioIcon name="live" />
                {copy.hero.catalog[lang]}
                <External label={labels.newTab} />
              </a>
            ) : null}
            <Link href={caseHref} className={buttonClassName({ variant: 'glass', size: 'lg', className: styles.button })} data-cw-synergos-link="case">
              {copy.hero.caseStudy[lang]}
            </Link>
          </div>
          {repos.length > 0 ? (
            <div className={styles.code}>
              <p className={styles.codeLabel}>{copy.hero.code[lang]}</p>
              <ul className={styles.repos}>
                {repos.map((repo) => (
                  <li key={repo.href}>
                    <a
                      href={repo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClassName({ variant: 'glass', size: 'md', className: styles.repo })}
                      data-cw-synergos-repo={repo.label}
                    >
                      <PortfolioIcon name="code" className={styles.repoIcon} />
                      <span className={styles.repoText}>
                        <span className={styles.repoHost}>{labels.github}</span>
                        <span className={styles.repoName}>{repo.label}</span>
                      </span>
                      <External label={labels.newTab} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </nav>
      </GlassSurface>

      <section className={styles.section} aria-labelledby="synergos-what" data-cw-synergos-section="what">
        <div className={styles.head}>
          <SectionTitle id="synergos-what">{copy.what.title[lang]}</SectionTitle>
          <p className={styles.lead}>{copy.what.lead[lang]}</p>
        </div>
        {diagram.length > 0 ? <LiveDiagram layers={diagram} labels={labels.diagram} /> : null}
        <p className={styles.note} data-cw-synergos-backend="">
          {fillTemplate(copy.what.backend[lang], synergosShowcase.backend)}
        </p>
      </section>

      <section className={styles.section} aria-labelledby="synergos-verticals" data-cw-synergos-section="verticals">
        <div className={styles.head}>
          <SectionTitle id="synergos-verticals">{copy.verticals.title[lang]}</SectionTitle>
          <p className={styles.lead}>{copy.verticals.lead[lang]}</p>
        </div>
        <ul className={styles.verticals}>
          {showcaseVerticals().map((line, index) => (
            <Reveal
              as="li"
              key={line.id}
              delay={index * STAGGER}
              className={styles.vertical}
              data-cw-glass="subtle"
              data-cw-light=""
              data-state={line.state}
              data-cw-vertical={line.id}
            >
              <div className={styles.verticalHead}>
                <h3 className={styles.verticalName}>{line.name[lang]}</h3>
                {stateLabel(line.state, lang) ? (
                  <span className={styles.state} data-state={line.state}>
                    {stateLabel(line.state, lang)}
                  </span>
                ) : null}
              </div>
              <p className={styles.verticalText}>{line.does[lang]}</p>
              <p className={styles.tasks}>
                <span className={styles.tasksBar} aria-hidden="true">
                  <span style={{ '--cw-ratio': line.total > 0 ? line.done / line.total : 0 } as CSSProperties} />
                </span>
                <span>{tasksText(line, lang)}</span>
              </p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="synergos-line" data-cw-synergos-section="line">
        <div className={styles.head}>
          <SectionTitle id="synergos-line">{copy.line.title[lang]}</SectionTitle>
        </div>
        <GlassSurface className={styles.panel} edge grain depth light>
          <svg className={styles.rain} viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {RAIN.map((drop, index) => (
              <text key={index} x={drop.x} y={drop.y} className={styles.rainText}>
                {drop.text}
              </text>
            ))}
          </svg>
          <CornerMarks />
          <p className={styles.eyebrow}>
            <span className={styles.live} aria-hidden="true" />
            {copy.line.eyebrow[lang]}
          </p>
          <p className={styles.panelLead}>{fillTemplate(copy.line.lead[lang], { count })}</p>
          <div className={styles.stage} data-cw-line="">
            <AssemblyLine layout={wideLayout(items)} variant="wide" labels={lineLabels} />
            <AssemblyLine layout={tallLayout(items)} variant="tall" labels={lineLabels} />
          </div>
          <ul className={styles.legend} aria-label={copy.line.legend[lang]}>
            {LINE_STATES.map((state) => (
              <li key={state} data-state={state}>
                {copy.states[state][lang]}
              </li>
            ))}
          </ul>
          <details className={styles.alt} data-cw-line-list="">
            <summary className={styles.altSummary}>{fillTemplate(copy.line.list[lang], { count })}</summary>
            <ol className={styles.altList}>
              {lines.map((line) => (
                <li key={line.id} data-cw-line-item={line.id} data-state={line.state}>
                  <strong>{lineLabel(line, lang)}</strong>
                  {' · '}
                  {[stateLabel(line.state, lang), tasksText(line, lang)].filter(Boolean).join(' · ')}
                  <span className={styles.altText}>{line.does[lang]}</span>
                </li>
              ))}
            </ol>
          </details>
        </GlassSurface>
      </section>

      <section className={styles.section} aria-labelledby="synergos-mvp" data-cw-synergos-section="mvp">
        <div className={styles.head}>
          <SectionTitle id="synergos-mvp">{copy.mvp.title[lang]}</SectionTitle>
        </div>
        <div className={styles.mvp}>
          <GlassSurface as="section" className={styles.milestonesPanel} aria-labelledby="synergos-milestones" edge grain depth light>
            <h3 id="synergos-milestones" className={styles.subheading}>
              {copy.mvp.milestones[lang]}
            </h3>
            <Hairline glint />
            <p className={styles.mvpLead}>
              {copy.mvp.lead[lang]} {copy.mvp.noDate[lang]}
            </p>
            <ol className={styles.milestones}>
              {synergosShowcase.milestones.map((milestone) => (
                <li key={milestone.id} className={styles.milestone} data-state={milestone.state} data-cw-milestone={milestone.id}>
                  <span className={styles.milestoneIcon} aria-hidden="true" />
                  <span className={styles.milestoneText}>
                    <span className="cw-visually-hidden">{copy.mvp.states[milestone.state][lang]}: </span>
                    {milestone.text[lang]}
                    {milestone.detail ? <small className={styles.milestoneDetail}>{milestone.detail[lang]}</small> : null}
                  </span>
                </li>
              ))}
            </ol>
            <ul className={styles.milestoneLegend} aria-hidden="true">
              {MILESTONE_STATES.map((state) => (
                <li key={state} data-state={state}>
                  <span className={styles.milestoneIcon} />
                  {copy.mvp.states[state][lang]}
                </li>
              ))}
            </ul>
          </GlassSurface>
          <GlassSurface as="section" className={styles.figuresPanel} aria-labelledby="synergos-figures" edge grain depth light>
            <h3 id="synergos-figures" className={styles.subheading}>
              {copy.figures.title[lang]}
            </h3>
            <Hairline glint />
            <dl className={styles.figures}>
              {showcaseFigures(lang).map((figure) => (
                <div key={figure.id} className={styles.figure} data-cw-synergos-figure={figure.id}>
                  <dt className={styles.figureLabel}>
                    {figure.label}
                    {figure.note ? <span className={styles.figureNote}>{figure.note}</span> : null}
                  </dt>
                  <dd className={styles.figureValue}>
                    {figure.accent ? <em>{figure.accent}</em> : null}
                    {figure.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.counted} data-cw-synergos-counted="">
              {counted.before}
              <time dateTime={synergosShowcase.countedAt}>{counted.date}</time>
              {counted.after}
            </p>
          </GlassSurface>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="synergos-build" data-cw-synergos-section="build">
        <div className={styles.head}>
          <SectionTitle id="synergos-build">{copy.build.title[lang]}</SectionTitle>
        </div>
        <div className={styles.build}>
          {build ? (
            <GlassSurface as="article" className={styles.buildCard} aria-labelledby="synergos-build-case" edge grain light data-cw-synergos-build="case">
              <h3 id="synergos-build-case" className={styles.buildTitle}>
                {projectTitle(build, lang)}
              </h3>
              <p className={styles.buildText}>{build.summary[lang]}</p>
              <Link
                href={localizedPath(lang, `/portfolio/${build.id}`)}
                className={buttonClassName({ variant: 'glass', size: 'md', className: styles.button })}
                data-cw-synergos-link="build-case"
              >
                {copy.build.caseLink[lang]}
              </Link>
            </GlassSurface>
          ) : null}
          {harness ? (
            <GlassSurface as="article" className={styles.buildCard} aria-labelledby="synergos-build-harness" edge grain light data-cw-synergos-build="harness">
              <h3 id="synergos-build-harness" className={styles.buildTitle}>
                {harness.label}
              </h3>
              <p className={styles.buildText}>{copy.build.harness[lang]}</p>
              <a
                href={harness.href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: 'glass', size: 'md', className: styles.button })}
                data-cw-synergos-link="harness"
              >
                {fillTemplate(copy.build.harnessLink[lang], { repo: harness.label })}
                <External label={labels.newTab} />
              </a>
            </GlassSurface>
          ) : null}
        </div>
      </section>
    </div>
  )
}
