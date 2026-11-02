export const WORDS_PER_MINUTE = 200

const HAS_WORD_CHARACTER = /[\p{L}\p{N}]/u

export function countWords(text: string): number {
  return text.split(/\s+/).filter((token) => HAS_WORD_CHARACTER.test(token)).length
}

export function readingMinutes(words: number, wordsPerMinute: number = WORDS_PER_MINUTE): number {
  if (!Number.isFinite(words) || words <= 0) return 1
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}
