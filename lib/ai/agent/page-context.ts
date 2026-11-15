export type PageSection = { id: string; label: string }

export type PageContext = { path: string; title: string; sections: PageSection[] }

export const PAGE_SECTIONS_MAX = 30

export const HIGHLIGHT_MS = 2400

const SAFE_ID = /^[A-Za-z][\w-]{0,80}$/

function textOf(node: Element | null): string {
  if (!node) return ''
  const parts = Array.from(node.childNodes ?? [])
  if (!parts.length) return node.textContent ?? ''
  return parts
    .filter((part) => !('getAttribute' in part && (part as Element).getAttribute('aria-hidden') === 'true'))
    .map((part) => part.textContent ?? '')
    .join(' ')
}

export function readPageContext(doc: Document = document): PageContext {
  const main = doc.querySelector('main') ?? doc.body
  const seen = new Set<string>()
  const sections: PageSection[] = []
  for (const element of main.querySelectorAll<HTMLElement>('section[id], article[id], h2[id], h3[id], [id^="section-"]')) {
    const id = element.id
    if (!SAFE_ID.test(id) || seen.has(id) || element.closest('[data-cw-global-agent]')) continue
    const heading = element.matches('h2, h3') ? element : element.querySelector('h1, h2, h3')
    const label = (element.getAttribute('aria-label') ?? textOf(heading)).replace(/\s+/g, ' ').trim().slice(0, 80)
    if (!label) continue
    seen.add(id)
    sections.push({ id, label })
    if (sections.length >= PAGE_SECTIONS_MAX) break
  }
  return { path: doc.location?.pathname ?? '/', title: doc.title, sections }
}

export function highlightSection(id: unknown, doc: Document = document, reduced = false): boolean {
  if (typeof id !== 'string' || !SAFE_ID.test(id)) return false
  if (!readPageContext(doc).sections.some((section) => section.id === id)) return false
  const element = doc.getElementById(id)
  if (!element) return false
  element.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
  element.setAttribute('data-cw-agent-highlight', '')
  setTimeout(() => element.removeAttribute('data-cw-agent-highlight'), HIGHLIGHT_MS)
  return true
}
