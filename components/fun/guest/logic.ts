export const STARS_KEY = 'cw-guest-stars'

export const WELCOME_KEY = 'cw-guest-welcome'

export function normalizeHeard(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

type EggLike = { id: string; words: readonly string[]; touch?: boolean }

export function eggFor<E extends EggLike>(eggs: readonly E[], text: string): E | null {
  const heard = ` ${normalizeHeard(text)} `
  for (const egg of eggs) {
    if (egg.touch) continue
    for (const word of egg.words) {
      const wanted = normalizeHeard(word)
      if (wanted ? heard.includes(` ${wanted} `) : text.includes(word)) return egg
    }
  }
  return null
}

export function foundStars(raw: string | null): string[] {
  try {
    const value = JSON.parse(raw ?? '[]') as unknown
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 10) : []
  } catch {
    return []
  }
}

export function pageOf(pathname: string | null): string {
  const path = (pathname ?? '/').replace(/^\/(es|en)(?=\/|$)/, '')
  return path === '' ? '/' : path.replace(/\/$/, '') || '/'
}
