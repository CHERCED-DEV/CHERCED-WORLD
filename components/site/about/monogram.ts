const MAX_LETTERS = 3
const SHORT_NAME = 4
const ACRONYM = /^[A-Z0-9]{2,3}$/
const SYMBOLIC = /^(?=.*[.#+])[.#+A-Z0-9]{2,4}$/

export function monogram(name: string): string {
  const compact = name.trim().toUpperCase()
  if (compact.length <= SHORT_NAME) return compact
  const words = compact.split(/[\s/\-·]+/).filter((word) => /[A-Z0-9]/.test(word))
  const first = words[0]
  if (!first) return ''
  if (ACRONYM.test(first) || SYMBOLIC.test(first)) return first
  if (words.length === 1) return first.charAt(0)
  return words
    .slice(0, MAX_LETTERS)
    .map((word) => word.charAt(0))
    .join('')
}
