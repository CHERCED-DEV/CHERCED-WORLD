export type MarkdownShape = { fences: number; headings: number; links: string[]; images: string[]; inlineCode: number }

const FENCE = /^\s*(```|~~~)/gm

export function markdownShape(body: string): MarkdownShape {
  const fences = (body.match(FENCE) ?? []).length
  const outside = body.replace(/^\s*(```|~~~)[\s\S]*?^\s*\1/gm, '')
  const images = [...outside.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)].map((match) => match[1]!)
  const links = [...outside.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)].map((match) => match[1]!)
  return {
    fences,
    headings: (outside.match(/^#{1,6}\s/gm) ?? []).length,
    links: links.sort(),
    images: images.sort(),
    inlineCode: (outside.match(/`[^`\n]+`/g) ?? []).length,
  }
}

export type ShapeIssue = 'fences' | 'headings' | 'links' | 'images' | 'inlineCode'

export function compareShape(source: string, translated: string): ShapeIssue[] {
  const a = markdownShape(source)
  const b = markdownShape(translated)
  const issues: ShapeIssue[] = []
  if (a.fences !== b.fences) issues.push('fences')
  if (a.headings !== b.headings) issues.push('headings')
  if (a.links.join('\n') !== b.links.join('\n')) issues.push('links')
  if (a.images.join('\n') !== b.images.join('\n')) issues.push('images')
  if (a.inlineCode !== b.inlineCode) issues.push('inlineCode')
  return issues
}

export type ImageRef = { src: string; alt: string; line: number }

export function bodyImages(body: string): ImageRef[] {
  return body.split('\n').flatMap((text, index) => [...text.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)].map((match) => ({ src: match[2]!, alt: match[1]!, line: index + 1 })))
}

export function replaceAlt(body: string, src: string, alt: string): string {
  const safe = alt.replace(/[\][]/g, '').trim()
  return body.replace(new RegExp(`!\\[[^\\]]*\\]\\(${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `![${safe}](${src}`)
}

export function lineCount(body: string): number {
  return body.split('\n').length
}
