import { isServiceId, type ServiceId } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'

export const SERVICE_QUERY_PARAM = 'servicio'

export const ROLE_QUERY_PARAM = 'vacante'

export const ROLE_MAX = 90

const UNSAFE = /[\p{Cc}<>]/gu

export function preselectedInterest(value: string | string[] | undefined): ServiceId | null {
  return typeof value === 'string' && isServiceId(value) ? value : null
}

const ROLE_MESSAGE: Record<Locale, (role: string) => string> = {
  es: (role) => `Hola, Camilo. Vi el análisis de tu perfil para el rol de ${role} y me gustaría conversar contigo.`,
  en: (role) => `Hi Camilo. I saw how your profile matches the ${role} role and I would like to talk with you.`,
}

export function prefilledMessage(lang: Locale, value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null
  const role = value.replace(UNSAFE, ' ').replace(/\s+/g, ' ').trim().slice(0, ROLE_MAX)
  return role ? ROLE_MESSAGE[lang](role) : null
}
