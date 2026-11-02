import { type Theme } from '@/lib/events'
import { DEFAULT_PALETTE, type Palette } from './engine'

export const MAX_PIXEL_RATIO = 1.5

export function pixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
}

export function currentTheme(): Theme {
  const attribute = document.documentElement.getAttribute('data-theme')
  if (attribute === 'light' || attribute === 'dark') return attribute
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function token(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim()
  return value === '' ? fallback : value
}

export function readPalette(theme: Theme = currentTheme()): Palette {
  const styles = getComputedStyle(document.documentElement)
  const fallback = theme === 'light' ? '#000000' : '#ffffff'
  const synced = styles.colorScheme.trim() === theme
  return {
    mode: theme,
    particle: synced ? token(styles, '--cw-fg', fallback) : fallback,
    accent: token(styles, '--cw-intro-accent', DEFAULT_PALETTE.accent),
  }
}

export function createSprite(color: string, radius: number): HTMLCanvasElement {
  const size = Math.max(2, Math.ceil(radius * 2))
  const sprite = document.createElement('canvas')
  sprite.width = size
  sprite.height = size
  const context = sprite.getContext('2d')
  if (!context) return sprite
  const center = size / 2
  context.fillStyle = color
  context.fillRect(0, 0, size, size)
  context.globalCompositeOperation = 'destination-in'
  const gradient = context.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, 'rgb(0 0 0 / 1)')
  gradient.addColorStop(0.62, 'rgb(0 0 0 / 0.92)')
  gradient.addColorStop(0.84, 'rgb(0 0 0 / 0.35)')
  gradient.addColorStop(1, 'rgb(0 0 0 / 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  return sprite
}
