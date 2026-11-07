import type { ImageRef } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'

export function imageSrc(image: Pick<ImageRef, 'src' | 'localizedSrc'>, lang: Locale): string {
  return image.localizedSrc?.[lang] ?? image.src
}
