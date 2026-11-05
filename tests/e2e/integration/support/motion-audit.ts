import type { Page } from '@playwright/test'

export const COMPOSITOR_ONLY = new Set(['transform', 'opacity', 'translate', 'scale', 'rotate'])

const MOVING = new Set(['transform', 'translate', 'scale', 'rotate', 'offset-distance', 'offset-path', 'top', 'left', 'right', 'bottom', 'stroke-dashoffset', 'background-position'])

export const MOBILE_006 = [
  '[data-cw-dock-bar]',
  '[data-cw-brain-compact]',
  '[data-cw-hand]',
  '[data-cw-service-stack]',
  '[data-cw-carousel-dots]',
  '[data-cw-scene-dots]',
  '[data-cw-filters]',
  '[data-cw-sweep]',
  '[data-cw-float]',
  '[data-cw-floating]',
  '[data-cw-home-sweep]',
].join(', ')

export const MOBILE_006_ROOTS = '[data-cw-sheet], [data-cw-float-menu]'

export type Motion = { signature: string; properties: string[]; mobile006: boolean; keyframes: boolean; infinite: boolean }

export async function runningMotions(page: Page, containers = MOBILE_006): Promise<Motion[]> {
  return page.evaluate((containers) => {
    const strip = (value: string) => value.replace(/^_?[A-Za-z0-9-]{6}_/, '')
    return document
      .getAnimations()
      .filter((animation) => animation.playState === 'running' && (animation.effect?.getComputedTiming().activeDuration ?? 0) !== 0)
      .map((animation) => {
        const effect = animation.effect as KeyframeEffect | null
        const properties = new Set<string>()
        for (const frame of effect?.getKeyframes() ?? []) {
          for (const key of Object.keys(frame)) if (!['offset', 'computedOffset', 'easing', 'composite'].includes(key)) properties.add(key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`))
        }
        const target = effect?.target ?? null
        const owner = `${target?.tagName.toLowerCase() ?? '?'}.${strip(String(target?.getAttribute('class') ?? '').split(' ')[0] ?? '')}${effect?.pseudoElement ?? ''}`
        const keyframes = animation instanceof CSSAnimation
        const signature = keyframes ? `animación ${strip(animation.animationName)} en ${owner}` : animation instanceof CSSTransition ? `transición de ${animation.transitionProperty} en ${owner}` : `animación por script en ${owner}`
        return {
          signature,
          properties: [...properties],
          mobile006: Boolean(target?.closest(containers)),
          keyframes,
          infinite: effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
        }
      })
  }, containers)
}

export function movingUnderReducedMotion(motions: readonly Motion[]): string[] {
  const flagged = motions.filter((motion) => motion.properties.some((property) => MOVING.has(property)) || (motion.keyframes && (motion.infinite || motion.properties.some((property) => property !== 'opacity'))))
  return [...new Set(flagged.map((motion) => `${motion.signature} (${motion.properties.join(', ')})`))].sort()
}

export type Declared = { signature: string; properties: string[]; mobile006: boolean }

export async function declaredMotions(page: Page): Promise<Declared[]> {
  return page.evaluate(({ containers, roots }) => {
    const strip = (value: string) => value.replace(/^_?[A-Za-z0-9-]{6}_/, '')
    const keyframes = new Map<string, Set<string>>()
    const visit = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (rule instanceof CSSKeyframesRule) {
          const props = keyframes.get(rule.name) ?? new Set<string>()
          for (const frame of rule.cssRules) for (const property of (frame as CSSKeyframeRule).style) props.add(property)
          keyframes.set(rule.name, props)
        } else if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) visit((rule as CSSGroupingRule).cssRules)
      }
    }
    for (const sheet of document.styleSheets) {
      try {
        visit(sheet.cssRules)
      } catch {}
    }
    const seconds = (value: string) => value.split(',').map((part) => Number.parseFloat(part) || 0)
    const found: Array<{ signature: string; properties: string[]; mobile006: boolean }> = []
    for (const element of document.querySelectorAll('body *')) {
      const inside = Boolean(element.closest(containers) || element.matches(roots))
      for (const pseudo of [null, '::before', '::after'] as const) {
        const style = getComputedStyle(element, pseudo)
        if (pseudo && (style.content === 'none' || style.content === 'normal')) continue
        if (style.display === 'none') continue
        const owner = `${element.tagName.toLowerCase()}.${strip(String(element.getAttribute('class') ?? '').split(' ')[0] ?? '')}${pseudo ?? ''}`
        const durations = seconds(style.animationDuration)
        style.animationName.split(',').forEach((raw, index) => {
          const name = raw.trim()
          if (name === 'none' || (durations[index % durations.length] ?? 0) === 0) return
          found.push({ signature: `animación ${strip(name)}`, properties: [...(keyframes.get(name) ?? ['desconocida'])], mobile006: inside || /^(cw-float|cw-sweep)$/.test(name) })
        })
        const transitions = seconds(style.transitionDuration)
        style.transitionProperty.split(',').forEach((raw, index) => {
          const property = raw.trim()
          if (property === 'none' || (transitions[index % transitions.length] ?? 0) === 0) return
          found.push({ signature: `transición de ${property} en ${owner}`, properties: [property], mobile006: inside })
        })
      }
    }
    return found
  }, { containers: MOBILE_006, roots: MOBILE_006_ROOTS })
}

export async function keyframeRules(page: Page): Promise<Declared[]> {
  return page.evaluate(() => {
    const strip = (value: string) => value.replace(/^_?[A-Za-z0-9-]{6}_/, '')
    const rules = new Map<string, Set<string>>()
    const visit = (list: CSSRuleList) => {
      for (const rule of list) {
        if (rule instanceof CSSKeyframesRule) {
          const props = rules.get(strip(rule.name)) ?? new Set<string>()
          for (const frame of rule.cssRules) for (const property of (frame as CSSKeyframeRule).style) props.add(property)
          rules.set(strip(rule.name), props)
        } else if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) visit((rule as CSSGroupingRule).cssRules)
      }
    }
    for (const sheet of document.styleSheets) {
      try {
        visit(sheet.cssRules)
      } catch {}
    }
    return [...rules].map(([name, props]) => ({ signature: `animación ${name}`, properties: [...props].sort(), mobile006: false }))
  })
}

export function signatureWithProperties(motion: Declared): string {
  return `${motion.signature}|${[...motion.properties].sort().join(',')}`
}

const HEAVY_TRANSITION = /^(all|width|height|(min|max)-(width|height)|top|left|right|bottom|inset.*|margin.*|padding.*|border(-\w+)?-width|font-size|line-height|letter-spacing|filter|backdrop-filter|-webkit-backdrop-filter|clip-path|grid-template.*|flex-basis)$/

export function forbidden(motion: Declared): string[] {
  if (motion.signature.startsWith('animación ')) return motion.properties.filter((property) => !COMPOSITOR_ONLY.has(property))
  return motion.properties.filter((property) => HEAVY_TRANSITION.test(property))
}

export function feedbackTransitions(motions: readonly Declared[]): string[] {
  return [...new Set(motions.filter((motion) => !motion.signature.startsWith('animación ') && forbidden(motion).length === 0 && motion.properties.some((property) => !COMPOSITOR_ONLY.has(property))).map((motion) => motion.signature))].sort()
}

export function notCompositorOnly(motions: readonly Declared[]): string[] {
  const found = new Map<string, Set<string>>()
  for (const motion of motions) {
    const extra = forbidden(motion)
    if (extra.length === 0) continue
    const set = found.get(motion.signature) ?? new Set<string>()
    for (const property of extra) set.add(property)
    found.set(motion.signature, set)
  }
  return [...found].map(([signature, properties]) => `${signature}: ${[...properties].join(', ')}`).sort()
}
