import type { PaletteCommandId } from '@/components/experience/palette-model'
import type { Localized } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'

export type VoiceTarget = { theme: 'light' | 'dark' } | { lang: Locale }

export type VoiceCommand = {
  id: string
  command: PaletteCommandId
  target?: VoiceTarget
  label: Localized
  phrases: Localized<string[]>
}

export const voiceCommands: readonly VoiceCommand[] = [
  {
    id: 'home',
    command: 'page:home',
    label: { es: 'Ir al inicio', en: 'Go home' },
    phrases: {
      es: ['llévame al inicio', 've al inicio', 'abre el inicio', 'página principal', 'inicio'],
      en: ['take me home', 'go home', 'go to the home page', 'home page', 'home'],
    },
  },
  {
    id: 'about',
    command: 'page:about',
    label: { es: 'Ir a Sobre mí', en: 'Go to About me' },
    phrases: {
      es: ['llévame a sobre mí', 'quién eres', 'acerca de ti', 'sobre mí'],
      en: ['take me to about me', 'who are you', 'about you', 'about me'],
    },
  },
  {
    id: 'services',
    command: 'page:services',
    label: { es: 'Ir a Servicios', en: 'Go to Services' },
    phrases: {
      es: ['llévame a servicios', 'muéstrame tus servicios', 'servicios'],
      en: ['take me to services', 'show me your services', 'services'],
    },
  },
  {
    id: 'portfolio',
    command: 'page:portfolio',
    label: { es: 'Ir al portafolio', en: 'Go to the portfolio' },
    phrases: {
      es: ['llévame al portafolio', 'muéstrame tus proyectos', 'abre el portafolio', 'portafolio', 'proyectos'],
      en: ['take me to the portfolio', 'show me your projects', 'open the portfolio', 'portfolio', 'projects'],
    },
  },
  {
    id: 'blog',
    command: 'page:blog',
    label: { es: 'Ir al blog', en: 'Go to the blog' },
    phrases: {
      es: ['llévame al blog', 'abre el blog', 've al blog', 'blog'],
      en: ['take me to the blog', 'open the blog', 'go to the blog', 'blog'],
    },
  },
  {
    id: 'contact',
    command: 'page:contact',
    label: { es: 'Ir a Contacto', en: 'Go to Contact' },
    phrases: {
      es: ['llévame a contacto', 'quiero contactarte', 'contacto'],
      en: ['take me to contact', 'i want to contact you', 'contact'],
    },
  },
  {
    id: 'now',
    command: 'page:now',
    label: { es: 'Ir a Ahora', en: 'Go to Now' },
    phrases: {
      es: ['qué estás haciendo ahora', 'llévame a ahora', 'en qué andas'],
      en: ['what are you doing now', 'take me to now', 'what are you up to'],
    },
  },
  {
    id: 'privacy',
    command: 'page:privacy',
    label: { es: 'Ir a Privacidad', en: 'Go to Privacy' },
    phrases: {
      es: ['llévame a privacidad', 'política de privacidad', 'privacidad'],
      en: ['take me to privacy', 'privacy policy', 'privacy'],
    },
  },
  {
    id: 'ai-lab',
    command: 'action:ai-lab',
    label: { es: 'Abrir el AI Lab', en: 'Open the AI Lab' },
    phrases: {
      es: ['abre el laboratorio', 'llévame al laboratorio', 'laboratorio de ia', 'ai lab'],
      en: ['open the lab', 'take me to the lab', 'open the ai lab', 'ai lab'],
    },
  },
  {
    id: 'theme-light',
    command: 'action:theme',
    target: { theme: 'light' },
    label: { es: 'Cambiar a tema claro', en: 'Switch to light theme' },
    phrases: {
      es: ['cambia a tema claro', 'pon el tema claro', 'tema claro', 'modo claro'],
      en: ['switch to light theme', 'switch to light mode', 'light theme', 'light mode'],
    },
  },
  {
    id: 'theme-dark',
    command: 'action:theme',
    target: { theme: 'dark' },
    label: { es: 'Cambiar a tema oscuro', en: 'Switch to dark theme' },
    phrases: {
      es: ['cambia a tema oscuro', 'pon el tema oscuro', 'tema oscuro', 'modo oscuro'],
      en: ['switch to dark theme', 'switch to dark mode', 'dark theme', 'dark mode'],
    },
  },
  {
    id: 'lang-en',
    command: 'action:lang',
    target: { lang: 'en' },
    label: { es: 'Ver el sitio en inglés', en: 'See the site in English' },
    phrases: {
      es: ['cambia a inglés', 'pon el sitio en inglés', 'en inglés'],
      en: ['switch to english', 'in english', 'english'],
    },
  },
  {
    id: 'lang-es',
    command: 'action:lang',
    target: { lang: 'es' },
    label: { es: 'Ver el sitio en español', en: 'See the site in Spanish' },
    phrases: {
      es: ['cambia a español', 'pon el sitio en español', 'en español'],
      en: ['switch to spanish', 'in spanish', 'spanish'],
    },
  },
  {
    id: 'cv',
    command: 'action:cv',
    label: { es: 'Abrir el CV', en: 'Open the résumé' },
    phrases: {
      es: ['abre mi cv', 'abre tu cv', 'muéstrame tu hoja de vida', 'hoja de vida'],
      en: ['open my resume', 'open your resume', 'open my cv', 'show me your resume'],
    },
  },
  {
    id: 'shortcuts',
    command: 'action:shortcuts',
    label: { es: 'Ver los atajos de teclado', en: 'See the keyboard shortcuts' },
    phrases: {
      es: ['muéstrame los atajos', 'atajos de teclado', 'atajos'],
      en: ['show me the shortcuts', 'keyboard shortcuts', 'shortcuts'],
    },
  },
]
