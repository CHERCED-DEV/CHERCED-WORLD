import type { Locale } from '@/lib/i18n/config'

export type { Locale }

export type Localized<T = string> = Record<Locale, T>

export type ImageRef = { src: string; alt: Localized; width: number; height: number }

export type SocialId = 'linkedin' | 'instagram' | 'github' | 'email' | 'facebook'

export type SocialLink = { id: SocialId; href: string | null; label: Localized }

export type CareerEntry = {
  id: string
  company: string
  role: Localized
  start: string
  end: string | null
  description: Localized
  pending?: true
}

export type EducationEntry = {
  id: string
  institution: string
  degree: Localized
  start: string
  end: string | null
  pending?: true
}

export type TechSkill = { id: string; name: string; icon?: string; progress: number }

export type ServiceId = 'design' | 'development' | 'maintenance'

export type ServiceItem = { id: ServiceId; title: Localized; description: Localized; icon: string }

export type CourseSchool = { name: Localized; description: Localized }

export type LanguageSkill = { id: Locale; name: Localized; progress: number; icon?: string }

export type PrivacySection = { heading: Localized; body: Localized }

export type SiteContent = {
  socials: SocialLink[]
  home: { greeting: Localized; name: string; title: Localized }
  about: {
    description: Localized
    image: ImageRef
    career: CareerEntry[]
    skills: { description: Localized; bullets: Localized[]; tech: TechSkill[] }
    education: EducationEntry[]
    courses: { schools: CourseSchool[]; platzi: { href: string; label: Localized; icon?: string } }
    languages: LanguageSkill[]
  }
  services: { intro: Localized; items: ServiceItem[] }
  portfolio: { intro: Localized[]; footer: Localized }
  contact: { title: Localized; description: Localized }
  blog: { title: Localized; titleStrong: string; welcome: Localized }
  privacy: { updatedAt: string; sections: PrivacySection[] }
}

export type ProjectLinks = { live: string | null; github: string | null }

export type Project = {
  id: string
  title: string
  summary: Localized
  context: Localized
  role: Localized | null
  decisions: Localized | null
  result: Localized | null
  technologies: string[]
  image: ImageRef
  links: ProjectLinks
  order: number
  gallery?: ImageRef[]
  highlights?: Localized[]
}

export type PostMeta = {
  id: string
  lang: Locale
  originalLang: Locale
  title: string
  description: string
  date: string
  tags: string[]
  image: { src: string; alt: string; width: number; height: number }
  author: 'Camilo Hernandez'
}

export type CapsuleEntry = { date: string; message: string; note?: Localized }
