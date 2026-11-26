import { LAB_REPO_URL } from '@/content/ailab/catalog'
import type { Locale } from '@/lib/i18n/config'

export const ENGINEERING_PATH = '/ingenieria'

export const ENGINEERING_REPO_URL = LAB_REPO_URL

export function repoFileUrl(file: string, ref: string | null): string {
  return `${ENGINEERING_REPO_URL}/blob/${ref ?? 'main'}/${file.split('/').map(encodeURIComponent).join('/')}`
}

export function commitUrl(sha: string): string {
  return `${ENGINEERING_REPO_URL}/commit/${sha}`
}

export function specPath(number: string): string {
  return `${ENGINEERING_PATH}/${number}`
}

export function localized(lang: Locale, path: string): string {
  return `/${lang}${path}`
}
