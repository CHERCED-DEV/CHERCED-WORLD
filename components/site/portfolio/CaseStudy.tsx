import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Project } from '@/content/types'
import { imageSrc } from '@/lib/content/image'
import { projectTitle } from '@/lib/content/project-title'
import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { GlowOrb, Hairline } from '@/components/ui/graphics'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import type { Locale } from '@/lib/i18n'
import { SectionTitle } from '../SectionTitle'
import { typeset } from '../typeset'
import { ShowcaseLink } from '../synergos/ShowcaseLink'
import { PatternLinks } from '../synergos/arquitectura/PatternLinks'
import { AdrCards } from '@/components/ui/AdrCards'
import adrStyles from './AdrCards.module.scss'
import { fillTemplate } from './carousel'
import { CaseGallery, type GalleryLabels } from './CaseGallery'
import styles from './CaseStudy.module.scss'
import type { CaseEvidenceLabels } from './labels'
import { LiveDiagram } from './LiveDiagram'
import { PortfolioIcon, type PortfolioIconName } from './PortfolioIcon'
import { ProjectEmbed, type EmbedLabels } from './ProjectEmbed'
import type { CaseRelatedLink } from './related'
import {
  caseAdrCards,
  caseDiagram,
  caseHighlights,
  caseStorySections,
  caseStudyLinks,
  caseStudyRepos,
  galleryImages,
  type CaseNeighbors,
  type CaseStudyLabels,
} from './projects'
import { stackGroups, type StackLayer } from './stack'
import { projectMediaName } from './transition'

export const EMBED_ANCHOR = 'en-vivo'

export type CaseStudyExtraLabels = {
  eyebrow: string
  highlights: string
  seeLive: string
  stackIntro: string
  layers: Record<StackLayer, string>
  usage: string
  usageOne: string
  pager: string
  prev: string
  next: string
  all: string
  gallery: GalleryLabels
  embed: EmbedLabels
}

export type CaseStudyExtras = {
  labels: CaseStudyExtraLabels
  neighbors: CaseNeighbors | null
  usage: Record<string, number>
  portfolioHref: string
  evidence?: CaseEvidenceLabels
  showcase?: string
  related?: CaseRelatedLink[]
}

const RELATED_ICONS: Record<CaseRelatedLink['kind'], PortfolioIconName> = { post: 'pen', services: 'spark' }

export type CaseStudyProps = { project: Project; lang: Locale; labels: CaseStudyLabels; extras?: CaseStudyExtras }

const LAYER_ICONS: Record<StackLayer, PortfolioIconName> = {
  interface: 'pen',
  language: 'code',
  framework: 'layers',
  data: 'database',
  architecture: 'grid',
  craft: 'spark',
}

export function CaseStudy({ project, lang, labels, extras }: CaseStudyProps) {
  const title = projectTitle(project, lang)
  const evidence = extras?.evidence
  const cards = evidence ? caseAdrCards(project, lang) : []
  const sections = caseStorySections(project, lang, labels, cards.length > 0)
  const links = caseStudyLinks(project, labels)
  const repos = caseStudyRepos(project)
  const related = extras?.related ?? []
  const story = (
    <GlassSurface variant="standard" className={styles.body}>
      {sections.map((section) => (
        <section key={section.id} id={`section-${section.id}`} className={styles.block} aria-labelledby={`case-${section.id}`} data-cw-case-section={section.id}>
          <h2 id={`case-${section.id}`} className={styles.heading}>
            {section.heading}
          </h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className={styles.text}>
              {typeset(paragraph, lang)}
            </p>
          ))}
          {section.cards && evidence ? <AdrCards cards={cards} labels={evidence.adr} className={adrStyles.list} cardClassName={adrStyles.card} /> : null}
        </section>
      ))}
      {!extras && project.technologies.length > 0 ? (
        <section className={styles.block} aria-labelledby="case-technologies">
          <h2 id="case-technologies" className={styles.heading}>
            {labels.technologies}
          </h2>
          <ul className={styles.chips}>
            {project.technologies.map((name) => (
              <li key={name} className={styles.chip}>
                {name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {links.length > 0 || repos.length > 0 || related.length > 0 ? (
        <nav className={styles.links} aria-label={labels.links}>
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName({ variant: extras || link.id !== 'live' ? 'glass' : 'solid', size: 'lg' })}
              data-cw-case-link={link.id}
            >
              {link.label}
              <Icon name="external" size={18} />
              <span className="cw-visually-hidden">{labels.newTab}</span>
            </a>
          ))}
          {related.length > 0 ? (
            <ul className={styles.repos} data-cw-case-related="">
              {related.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={item.href}
                    className={buttonClassName({ variant: 'glass', size: 'lg', className: styles.repo })}
                    data-cw-case-related-link={item.kind}
                  >
                    <PortfolioIcon name={RELATED_ICONS[item.kind]} className={styles.repoIcon} />
                    <span className={styles.repoText}>
                      <span className={styles.repoHost}>{item.host}</span>
                      <span className={styles.repoName} lang={item.lang}>
                        {item.name}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {repos.length > 0 ? (
            <ul className={styles.repos} data-cw-case-repos="">
              {repos.map((repo) => (
                <li key={repo.href}>
                  <a
                    href={repo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClassName({ variant: 'glass', size: 'lg', className: styles.repo })}
                    data-cw-case-repo={repo.label}
                  >
                    <PortfolioIcon name="code" className={styles.repoIcon} />
                    <span className={styles.repoText}>
                      <span className={styles.repoHost}>{labels.github}</span>
                      <span className={styles.repoName}>{repo.label}</span>
                    </span>
                    <Icon name="external" size={18} />
                    <span className="cw-visually-hidden">{labels.newTab}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>
      ) : null}
    </GlassSurface>
  )

  if (!extras) {
    return (
      <article className={styles.page} aria-labelledby="case-title" data-cw-case={project.id}>
        <div className={styles.media}>
          <Image
            src={imageSrc(project.image, lang)}
            alt={project.image.alt[lang]}
            width={project.image.width}
            height={project.image.height}
            sizes="(min-width: 768px) 260px, 210px"
            preload
            className={styles.image}
          />
        </div>
        <SectionTitle as="h1" id="case-title" size="lg">
          {title}
        </SectionTitle>
        {story}
      </article>
    )
  }

  const extra = extras.labels
  const highlights = caseHighlights(project, lang)
  const images = galleryImages(project, lang)
  const groups = stackGroups(project.technologies)
  const landscape = project.image.width >= project.image.height
  const neighbors = extras.neighbors
  const diagram = evidence ? caseDiagram(project, lang) : []

  return (
    <article className={styles.page} aria-labelledby="case-title" data-cw-case={project.id}>
      <header
        id="section-hero"
        className={styles.hero}
        data-orientation={landscape ? 'landscape' : 'portrait'}
        data-cw-glass="standard"
        data-cw-light=""
      >
        <GlowOrb tone="accent" size="lg" x={landscape ? '50%' : '78%'} y={landscape ? '100%' : '50%'} />
        <div className={styles.heroText}>
          {neighbors ? (
            <p className={styles.eyebrow}>
              {fillTemplate(extra.eyebrow, {
                n: String(neighbors.position).padStart(2, '0'),
                total: String(neighbors.total).padStart(2, '0'),
              })}
            </p>
          ) : null}
          {evidence ? (
            <p className={styles.era} data-cw-case-era={project.era}>
              <span className="cw-visually-hidden">{evidence.era}: </span>
              {evidence.eras[project.era]}
            </p>
          ) : null}
          <SectionTitle as="h1" id="case-title" size="lg" className={styles.title}>
            {title}
          </SectionTitle>
          <p className={styles.lede}>{typeset(project.summary[lang], lang)}</p>
          {project.links.live || extras.showcase ? (
            <div className={styles.heroActions}>
              {project.links.live ? (
                <a href={`#${EMBED_ANCHOR}`} className={buttonClassName({ variant: 'solid', size: 'lg', className: styles.seeLive })} data-cw-case-see-live="">
                  <PortfolioIcon name="live" />
                  {extra.seeLive}
                </a>
              ) : null}
              {extras.showcase ? <ShowcaseLink lang={lang} label={extras.showcase} from="case" /> : null}
            </div>
          ) : null}
        </div>
        <div className={styles.heroMedia}>
          <CaseGallery images={images} labels={extra.gallery} title={title} transitionName={projectMediaName(project.id)} />
        </div>
      </header>

      <PatternLinks ids={project.patterns} lang={lang} />

      {highlights.length > 0 ? (
        <section id="section-highlights" className={styles.highlights} aria-labelledby="case-highlights" data-cw-case-highlights="">
          <h2 id="case-highlights" className={styles.heading}>
            {extra.highlights}
          </h2>
          <ol className={styles.highlightList}>
            {highlights.map((text, index) => (
              <Reveal
                as="li"
                key={text}
                delay={index * 70}
                className={styles.highlight}
                data-cw-glass="subtle"
                data-cw-light=""
                style={{ '--cw-i': index } as CSSProperties}
              >
                <span className={styles.highlightIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.highlightText}>{text}</span>
              </Reveal>
            ))}
          </ol>
        </section>
      ) : null}

      {project.links.live ? (
        <ProjectEmbed
          id={EMBED_ANCHOR}
          url={project.links.live}
          title={title}
          poster={{ src: imageSrc(project.image, lang), alt: project.image.alt[lang], width: project.image.width, height: project.image.height }}
          labels={extra.embed}
        />
      ) : null}

      {story}

      {evidence && diagram.length > 0 ? <LiveDiagram layers={diagram} labels={evidence.diagram} /> : null}

      {groups.length > 0 ? (
        <section id="section-stack" className={styles.stack} aria-labelledby="case-technologies" data-cw-case-stack="">
          <div className={styles.stackHead}>
            <h2 id="case-technologies" className={styles.heading}>
              {labels.technologies}
            </h2>
            <p className={styles.stackIntro}>{extra.stackIntro}</p>
          </div>
          <ol className={styles.layers}>
            {groups.map((group, index) => (
              <Reveal as="li" key={group.layer} delay={index * 70} className={styles.layer} data-layer={group.layer}>
                <p className={styles.layerName}>
                  <PortfolioIcon name={LAYER_ICONS[group.layer]} className={styles.layerIcon} />
                  {extra.layers[group.layer]}
                </p>
                <ul className={styles.pieces}>
                  {group.technologies.map((tech) => {
                    const count = extras.usage[tech] ?? 1
                    return (
                      <li key={tech} className={styles.piece} data-cw-stack-piece={tech}>
                        <span className={styles.pieceName}>{tech}</span>
                        <span className={styles.pieceUsage}>
                          {count === 1 ? extra.usageOne : fillTemplate(extra.usage, { count })}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </Reveal>
            ))}
          </ol>
        </section>
      ) : null}

      {neighbors ? <Hairline glint className={styles.pagerLine} /> : null}
      {neighbors ? (
        <nav className={styles.pager} aria-label={extra.pager} data-cw-case-pager="">
          <Link href={neighbors.prev.href} className={styles.pagerLink} data-cw-light="" rel="prev" data-cw-case-prev={neighbors.prev.id}>
            <PortfolioIcon name="arrow-left" className={styles.pagerIcon} />
            <span className={styles.pagerText}>
              <span className={styles.pagerLabel}>{extra.prev}</span>
              <span className={styles.pagerTitle}>{neighbors.prev.title}</span>
            </span>
          </Link>
          <Link href={extras.portfolioHref} className={styles.pagerAll} data-cw-case-all="">
            <PortfolioIcon name="grid" />
            <span>{extra.all}</span>
          </Link>
          <Link href={neighbors.next.href} className={styles.pagerLink} data-cw-light="" data-align="end" rel="next" data-cw-case-next={neighbors.next.id}>
            <span className={styles.pagerText}>
              <span className={styles.pagerLabel}>{extra.next}</span>
              <span className={styles.pagerTitle}>{neighbors.next.title}</span>
            </span>
            <PortfolioIcon name="arrow-right" className={styles.pagerIcon} />
          </Link>
        </nav>
      ) : null}
    </article>
  )
}
