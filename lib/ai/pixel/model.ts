export const PIXEL_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const PIXEL_FILE_MAX_BYTES = 5 * 1024 * 1024

export const PIXEL_PHOTO_MAX_SIDE = 768

export const PIXEL_PHOTO_MAX_CHARS = 3_000_000

export const PIXEL_OUTPUT_SIDE = 512

export const PIXEL_SAMPLE_SRC = '/assets/imgs/about/retrato-claro.webp'

export const PIXEL_MARK = 'AI LAB · CHERCED-WORLD'

export const PIXEL_LOCAL_GRID = 48

export function nearestPalette(r: number, g: number, b: number, levels = 5): [number, number, number] {
  const step = 255 / (levels - 1)
  const snap = (value: number) => Math.round(Math.round(value / step) * step)
  return [snap(r), snap(g), snap(b)]
}
