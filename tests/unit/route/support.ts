import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { themeSectionId } from '@/components/ailab/shell/LabPage'
import { labCardId } from '@/components/ailab/shell/LabCard'
import { labCatalog, labThemes } from '@/content/ailab/catalog'
import { casePitches } from '@/content/pitches'
import { getProjects } from '@/lib/content'
import type { RouteRegistryEnv } from '@/lib/ailab/route/registry'

const ROOT = process.cwd()

function appPages(): Set<string> {
  const pages = new Set<string>()
  const projects = getProjects().map((project) => project.id)
  const walk = (dir: string, segments: string[]) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const next = /^\(.*\)$/.test(entry.name) ? segments : [...segments, entry.name]
        walk(join(dir, entry.name), next)
        continue
      }
      if (!/^page\.(tsx|ts|mdx)$/.test(entry.name)) continue
      const path = `/${segments.join('/')}`
      if (path === '/portfolio/[id]') for (const id of projects) pages.add(`/portfolio/${id}`)
      else if (path === '/ingenieria/[spec]') for (const id of specIds()) pages.add(`/ingenieria/${id}`)
      else if (!path.includes('[')) pages.add(path)
    }
  }
  walk(join(ROOT, 'app', '[lang]'), [])
  return pages
}

function appAnchors(): Set<string> {
  const anchors = new Set<string>()
  for (const experiment of labCatalog) anchors.add(`/ai-lab#${labCardId(experiment.id)}`)
  for (const group of labThemes()) anchors.add(`/ai-lab#${themeSectionId(group.theme)}`)
  for (const pitch of casePitches) if (pitch.approved) anchors.add(`/portfolio/${pitch.caseId}#case-pitch-${pitch.caseId}`)
  return anchors
}

export function routeDictionary(lang: 'es' | 'en'): Record<string, string> {
  return JSON.parse(readFileSync(join(ROOT, 'content', 'i18n', lang, 'route.json'), 'utf8')) as Record<string, string>
}

function evidenceIds(): Set<string> {
  const es = routeDictionary('es')
  const en = routeDictionary('en')
  const ids = new Set<string>()
  for (const key of Object.keys(es)) {
    const match = /^route\.evidence\.(.+)$/.exec(key)
    if (match && es[key]?.trim() && en[key]?.trim()) ids.add(match[1]!)
  }
  return ids
}

function specIds(): Set<string> {
  return new Set(
    readdirSync(join(ROOT, 'specs'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\d{3}-/.test(entry.name))
      .map((entry) => entry.name.slice(0, 3)),
  )
}

export function registryEnv(): RouteRegistryEnv {
  return { pages: appPages(), anchors: appAnchors(), evidence: evidenceIds(), specs: specIds() }
}
