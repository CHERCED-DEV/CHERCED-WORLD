export const MISSING_HEADER = 'x-cw-missing'

export const MISSING_SECTIONS = ['blog', 'portfolio'] as const

export type MissingSection = (typeof MISSING_SECTIONS)[number]

export function missingSection(value: string | null | undefined): MissingSection | null {
  return MISSING_SECTIONS.find((section) => section === value) ?? null
}
