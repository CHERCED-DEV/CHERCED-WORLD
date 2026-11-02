const DIACRITICS = /\p{Diacritic}/gu
const SEPARATORS = /[^\p{L}\p{N}@+#]+/u

export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/\.(js|ts)\b/g, '$1')
    .replace(/(\p{L})\1{2,}/gu, '$1')
}

export function tokenize(value: string): string[] {
  return fold(value)
    .split(SEPARATORS)
    .filter((token) => token.length > 0)
}

export function processTerm(term: string): string | null {
  const folded = fold(term).replace(/^[@+#]+|[@+#]+$/g, '')
  return folded.length > 0 ? folded : null
}

export function sentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
}

export function excerpt(value: string, max = 180): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, '')}…`
}
