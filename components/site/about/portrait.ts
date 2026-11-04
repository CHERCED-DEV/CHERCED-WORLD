import type { ImageRef } from '@/content/types'

const DARK_SUFFIX = /-oscuro(\.[a-z0-9]+)$/i

export type ThemedPortrait = { dark: ImageRef; light: ImageRef | null }

export function lightVariantSrc(src: string): string | null {
  return DARK_SUFFIX.test(src) ? src.replace(DARK_SUFFIX, '-claro$1') : null
}

export function themedPortrait(image: ImageRef): ThemedPortrait {
  const light = lightVariantSrc(image.src)
  return { dark: image, light: light ? { ...image, src: light } : null }
}

export const PORTRAIT_SIZES = '(min-width: 992px) 400px, (min-width: 768px) 340px, 78vw'

export const LIGHT_SCHEME_QUERY = '(prefers-color-scheme: light)'
