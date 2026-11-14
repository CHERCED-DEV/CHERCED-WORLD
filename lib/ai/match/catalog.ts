import { isIndexedDoc } from '@/lib/ailab/search/glassbox'
import type { SearchDoc, SearchDocKind, SearchIndex } from '@/lib/search/types'
import type { MatchEvidence } from './config'

export type EvidenceKind = SearchDocKind | 'decision'

export type EvidenceEntry = { id: string; kind: EvidenceKind; title: string; url: string; text: string }

export type EvidenceCatalog = { entries: EvidenceEntry[]; byId: ReadonlyMap<string, EvidenceEntry> }

const TEXT_MAX: Record<EvidenceKind, number> = { project: 700, post: 420, section: 420, decision: 420, page: 260, skill: 160 }

function squash(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

function docEntry(doc: SearchDoc): EvidenceEntry {
  return { id: doc.id, kind: doc.kind, title: doc.title, url: doc.url, text: squash(doc.text, TEXT_MAX[doc.kind]) }
}

export function evidenceCatalog(index: SearchIndex): EvidenceCatalog {
  const entries: EvidenceEntry[] = index.docs.filter(isIndexedDoc).map(docEntry)
  for (const project of index.facts.projects) {
    project.adrs.forEach((adr, position) => {
      entries.push({
        id: `decision:${project.id}-${position + 1}`,
        kind: 'decision',
        title: `${project.title}: ${adr.decision}`,
        url: project.url,
        text: squash(`${adr.why} ${adr.tradeoff}`, TEXT_MAX.decision),
      })
    })
  }
  const byId = new Map<string, EvidenceEntry>()
  for (const entry of entries) if (!byId.has(entry.id)) byId.set(entry.id, entry)
  return { entries: [...byId.values()], byId }
}

export function catalogText(catalog: EvidenceCatalog): string {
  return catalog.entries.map((entry) => `[${entry.id}] (${entry.kind}) ${entry.title} — ${entry.text}`).join('\n')
}

export function evidenceOf(catalog: EvidenceCatalog, id: string): MatchEvidence | null {
  const entry = catalog.byId.get(id.trim())
  return entry ? { id: entry.id, title: entry.title, url: entry.url, kind: entry.kind } : null
}
