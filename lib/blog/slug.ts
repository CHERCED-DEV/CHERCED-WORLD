const FALLBACK_SLUG = 'section'

export function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || FALLBACK_SLUG
}

export type Slugger = {
  slug: (text: string) => string
  reserve: (id: string) => void
}

export function createSlugger(reserved: Iterable<string> = []): Slugger {
  const used = new Set(reserved)
  return {
    slug(text) {
      const base = slugify(text)
      let candidate = base
      let n = 1
      while (used.has(candidate)) {
        n += 1
        candidate = `${base}-${n}`
      }
      used.add(candidate)
      return candidate
    },
    reserve(id) {
      used.add(id)
    },
  }
}
