import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import ailabEn from '@/content/i18n/en/ailab.json'
import ailabEs from '@/content/i18n/es/ailab.json'
import blogEn from '@/content/i18n/en/blog.json'
import blogEs from '@/content/i18n/es/blog.json'
import { approvedPitch } from '@/content/pitches'
import { getProject } from '@/lib/content'
import { projectTitle } from '@/lib/content/project-title'
import { listPublished } from '@/lib/data/published'
import type { Locale } from '@/lib/i18n/config'
import { isListenSource } from './voices'

export const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

const AILAB: Record<Locale, Record<string, string>> = { es: ailabEs, en: ailabEn }

const BLOG: Record<Locale, Record<string, string>> = { es: blogEs, en: blogEn }

function calloutLabels(lang: Locale): string {
  return Object.entries(BLOG[lang])
    .filter(([key]) => key.startsWith('callout.'))
    .map(([, value]) => value)
    .join('\n')
}

export function v3Corpus(lang: Locale): string {
  return Object.entries(AILAB[lang])
    .filter(([key]) => key.startsWith('ailab.v3.sample.'))
    .map(([, value]) => value)
    .join('\n')
}

export function pitchCorpus(caseId: string, lang: Locale): string | null {
  const pitch = approvedPitch(caseId)
  if (!pitch) return null
  const project = getProject(caseId)
  return [project ? projectTitle(project, lang) : '', pitch.script[lang]].join('\n')
}

async function filePost(id: string, lang: Locale, dir: string): Promise<string | null> {
  try {
    return await readFile(path.join(dir, id, `${lang}.mdx`), 'utf8')
  } catch {
    return null
  }
}

async function publishedPost(id: string, lang: Locale): Promise<string | null> {
  try {
    const post = (await listPublished()).find((item) => item.id === id && item.lang === lang)
    return post ? [post.title, post.description, post.body].join('\n') : null
  } catch {
    return null
  }
}

export async function listenCorpus(source: string, lang: Locale, dir: string = POSTS_DIR): Promise<string | null> {
  if (!isListenSource(source)) return null
  if (source === 'v3') return v3Corpus(lang)
  const [kind, id] = source.split(':') as [string, string]
  if (kind === 'pitch') return pitchCorpus(id, lang)
  const text = (await filePost(id, lang, dir)) ?? (await publishedPost(id, lang))
  return text ? `${text}\n${calloutLabels(lang)}` : null
}
