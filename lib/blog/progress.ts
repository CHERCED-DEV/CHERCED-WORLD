export type BodyBox = { top: number; height: number }

export type HeadingTop = { id: string; top: number }

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function readingProgress(body: BodyBox, viewport: number, offset = 0): number {
  const distance = body.height - viewport + offset
  if (distance <= 0) return body.top + body.height <= viewport ? 1 : 0
  return clamp01((offset - body.top) / distance)
}

export function spyLine(viewport: number, offset = 0): number {
  return offset + viewport * 0.25
}

export function activeHeading(headings: readonly HeadingTop[], line: number): string | null {
  let active: string | null = null
  for (const heading of headings) {
    if (heading.top <= line) active = heading.id
    else break
  }
  return active
}
