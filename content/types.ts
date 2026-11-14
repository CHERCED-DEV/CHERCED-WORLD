import type { Locale } from '@/lib/i18n/config'

export type { Locale }

export type Localized<T = string> = Record<Locale, T>

export type ImageRef = { src: string; alt: Localized; width: number; height: number; localizedSrc?: Localized }

export type SocialId = 'linkedin' | 'instagram' | 'github' | 'email' | 'facebook'

export type SocialLink = { id: SocialId; href: string | null; label: Localized }

export type CareerEntry = {
  id: string
  company: string
  role: Localized
  start: string
  end: string | null
  description: Localized
  highlights?: Localized[]
  pending?: true
}

export type HeadingDirection = { id: string; title: Localized; text: Localized }

export type HeadingContent = {
  title: Localized
  intro: Localized
  hub: Localized
  today: Localized[]
  directions: HeadingDirection[]
}

export type EducationEntry = {
  id: string
  institution: string
  degree: Localized
  start: string
  end: string | null
  pending?: true
}

export type TechSkill = { id: string; name: string; label?: Localized; icon?: string; progress: number; used?: Localized }

export type SkillLobe = {
  id: string
  name: Localized
  skills: string[]
  sources: string[]
  projects?: string[]
  words?: Localized
}

export const SERVICE_IDS = ['ai-harness', 'software-factory', 'process-optimization', 'architecture', 'product', 'workshops'] as const

export type ServiceId = (typeof SERVICE_IDS)[number]

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === 'string' && (SERVICE_IDS as readonly string[]).includes(value)
}

export type ServiceItem = {
  id: ServiceId
  title: Localized
  description: Localized
  forWho: Localized
  deliverables: Localized[]
  example?: Localized
  priceRange?: Localized
  icon?: string
}

export type ServiceAudienceId = 'professionals' | 'companies' | 'engineering-teams'

export type ServiceAudience = { id: ServiceAudienceId; title: Localized; text: Localized }

export type ServiceFaq = { q: Localized; a: Localized }

export type ServicesContent = {
  intro: Localized
  hero: { title: Localized; intro: Localized; cta: Localized }
  audiences: ServiceAudience[]
  items: ServiceItem[]
  process: { title: Localized; steps: Localized[]; principles: Localized[] }
  faq: ServiceFaq[]
  cta: { title: Localized; text: Localized; button: Localized }
}

export type CourseSchool = { name: Localized; description: Localized }

export type LanguageSkill = { id: Locale; name: Localized; progress: number; level?: Localized; icon?: string }

export type PrivacySection = { heading: Localized; body: Localized }

export type Principle = { short: Localized; full: Localized }

export type CvPdf = { lang: Locale; href: string; filename: string; bytes: number }

export type Profile = {
  availability: { location: Localized; timezone: 'UTC−5'; relocation: Localized }
  cv: { href: string; pdfs?: CvPdf[] }
}

export type RecruitersContent = {
  title: Localized
  intro: Localized
  rolesTitle: Localized
  roles: Localized[]
  motivation?: Localized
  modalityTitle: Localized
  modality: Localized
  englishTitle: Localized
  english: Localized
  write: Localized
}

export type Certification = { name: Localized; issuer: string; date: string | null }

export type SiteContent = {
  socials: SocialLink[]
  home: { greeting: Localized; name: string; title: Localized; previousTitle?: Localized; subtitle?: Localized }
  profile?: Profile
  recruiters?: RecruitersContent
  about: {
    description: Localized
    image: ImageRef
    experienceYears?: number
    career: CareerEntry[]
    skills: {
      description: Localized
      bullets: Localized[]
      tech: TechSkill[]
      lobes?: SkillLobe[]
      learningNow?: Localized
      inWords?: Partial<Record<string, Localized>>
    }
    principles?: Principle[]
    certifications?: Certification[]
    heading?: HeadingContent
    education: EducationEntry[]
    courses: { schools: CourseSchool[]; platzi: { href: string; label: Localized; icon?: string } }
    languages: LanguageSkill[]
  }
  services: ServicesContent
  portfolio: { intro: Localized[]; footer: Localized }
  contact: { title: Localized; description: Localized }
  blog: { title: Localized; titleStrong: string; welcome: Localized }
  privacy: { updatedAt: string; sections: PrivacySection[] }
}

export const PROJECT_ERAS = ['2026', '2024-2026', '2022-2023'] as const

export type ProjectEra = (typeof PROJECT_ERAS)[number]

export type AdrCard = { decision: Localized; why: Localized; tradeoff: Localized }

export type DiagramLayer = { id: string; label: Localized; role: Localized }

export type RepoLink = { label: string; href: string }

export type ProjectLinks = { live: string | null; github: string | null; repos?: RepoLink[] }

export type Project = {
  id: string
  title: string | Localized
  summary: Localized
  context: Localized
  role: Localized | null
  decisions: Localized | null
  result: Localized | null
  technologies: string[]
  image: ImageRef
  links: ProjectLinks
  order: number
  era: ProjectEra
  gallery?: ImageRef[]
  highlights?: Localized[]
  adrCards?: AdrCard[]
  diagram?: DiagramLayer[]
  patterns?: string[]
}

export type SynergosSource = {
  repo: 'Synergos.CMS' | 'Synergos.UI' | 'Synergos.Fabrica'
  path: string
  label: string
}

export type ArchitectureTopic = {
  id: string
  title: Localized
  body: Localized[]
  sources: SynergosSource[]
  private?: true
}

export type SynergosPattern = {
  id: string
  name: string
  status: 'aplicado' | 'parcial' | 'descartado'
  body: Localized
  limitation?: Localized
  sources: SynergosSource[]
  cases: string[]
}

export type FactoryMilestone = {
  id: string
  status: 'hecho' | 'vision'
  title: Localized
  body: Localized
  sources: SynergosSource[]
}

export type SynergosFacts = {
  countedAt: string
  pieces: number
  capabilities: number
  orchestrators: number
  measuredAt: string
  testsAtLeast: number
  adrsAtLeast: number
  designSystemAtLeast: number
  designSystem?: { primitives: number; compositions: number; modules: number }
}

export type TerminalGenerated = 'projects' | 'synergos' | 'help' | 'clear' | 'principles' | 'mottos'

export type TerminalCommand =
  | { name: string; output: Localized; lang?: 'la' }
  | { name: string; generated: TerminalGenerated }

export type NowEntry = Localized & { lang?: 'la'; href?: string }

export type NowContent = {
  updatedAt: string
  building: NowEntry[]
  learning: NowEntry[]
  preparing: NowEntry[]
  offKeyboard: NowEntry[]
  mottos: NowEntry[]
}

export type PostSeriesRef = { id: string; part: number }

export type PostMeta = {
  id: string
  lang: Locale
  originalLang: Locale
  title: string
  description: string
  date: string
  tags: string[]
  image: { src: string; alt: string; width: number; height: number }
  author: string
  featured?: true
  updated?: string
  series?: PostSeriesRef
  cover?: 'generated'
}

export type CapsuleEntry = { date: string; message: string; note?: Localized }

export const LAB_THEMES = ['voice', 'architecture', 'agents', 'games'] as const

export type LabTheme = (typeof LAB_THEMES)[number]

export const LAB_STATUSES = ['stable', 'beta', 'experiment'] as const

export type LabStatus = (typeof LAB_STATUSES)[number]

export const LAB_EXPERIMENT_IDS = ['V5', 'V1', 'V2', 'V3', 'V4', 'A6', 'A2', 'A3', 'A5', 'R1', 'A4', 'J1', 'J2'] as const

export type LabExperimentId = (typeof LAB_EXPERIMENT_IDS)[number]

export function isLabExperimentId(value: unknown): value is LabExperimentId {
  return typeof value === 'string' && (LAB_EXPERIMENT_IDS as readonly string[]).includes(value)
}

export const LAB_HOSTS = ['huggingface.co', 'cdn.jsdelivr.net'] as const

export type LabHost = (typeof LAB_HOSTS)[number]

export type LabEngine = { resource: string; bytes: number }

export type LabDownload = { resource: string; bytes: number; host: LabHost; default?: true; engine?: LabEngine }

export type LabCode = { snippet: string; lang: string; repoPath: string | null }

export const LAB_RUNS_IN = ['browser', 'google'] as const

export type LabRunsIn = (typeof LAB_RUNS_IN)[number]

export type LabExperiment = {
  id: LabExperimentId
  theme: LabTheme
  title: Localized
  summary: Localized
  status: LabStatus
  runsIn: LabRunsIn
  downloads: LabDownload[]
  privacy: Localized
  flow: Localized[]
  adrCards: AdrCard[]
  code: LabCode | null
}
