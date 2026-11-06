import type { Locale } from '@/lib/i18n/config'

export const SPEECH_STATES = ['playing', 'paused', 'stopped'] as const

export type SpeechState = (typeof SPEECH_STATES)[number]

export type SpeechEnd = 'finished' | 'cancelled' | 'error'

export type SpeechChunkKind = 'heading' | 'text' | 'image'

export type SpeechChunk<N = unknown> = {
  text: string
  kind: SpeechChunkKind
  heading: string | null
  lang: string | null
  node: N | null
}

export type VoiceLike = {
  name: string
  lang: string
  voiceURI: string
  localService: boolean
  default: boolean
}

export type UtteranceLike = {
  text: string
  lang: string
  voice: VoiceLike | null
  rate: number
  pitch: number
  volume: number
  onstart: ((event: unknown) => void) | null
  onend: ((event: unknown) => void) | null
  onerror: ((event: { error?: string }) => void) | null
}

export type SynthLike = {
  speak(utterance: UtteranceLike): void
  cancel(): void
  getVoices(): ArrayLike<VoiceLike>
  addEventListener?: (type: 'voiceschanged', listener: () => void) => void
  removeEventListener?: (type: 'voiceschanged', listener: () => void) => void
}

export type SpeechEnv = {
  synth: SynthLike
  createUtterance: (text: string) => UtteranceLike
  schedule?: (run: () => void) => void
}

export type SpeechSnapshot = {
  state: SpeechState
  index: number
  total: number
  heading: string | null
  chunk: SpeechChunk | null
  voice: string | null
  ended: SpeechEnd | null
  error: string | null
}

export type SpeechOptions = {
  lang: Locale
  voice?: VoiceLike | null
  rate?: number
  env?: SpeechEnv | null
  signal?: AbortSignal
}

export type SpeechSession = {
  readonly snapshot: SpeechSnapshot
  readonly chunks: readonly SpeechChunk[]
  pause(): void
  resume(): void
  toggle(): void
  stop(): void
  subscribe(listener: (snapshot: SpeechSnapshot) => void): () => void
  readonly done: Promise<SpeechSnapshot>
}

export const MAX_CHUNK_CHARS = 220

export const SPEECH_RATES = [0.75, 1, 1.25, 1.5] as const

export const LANG_TAGS: Readonly<Record<Locale, string>> = { es: 'es-ES', en: 'en-US' }

const REGION_PREFERENCE: Readonly<Record<string, readonly string[]>> = {
  es: ['es-co', 'es-419', 'es-mx', 'es-us', 'es-es'],
  en: ['en-us', 'en-gb'],
}

const QUIET_ERRORS = new Set(['interrupted', 'canceled'])

export function speechEnv(scope: unknown = globalThis): SpeechEnv | null {
  const target = scope as { speechSynthesis?: SynthLike; SpeechSynthesisUtterance?: new (text: string) => UtteranceLike } | null
  try {
    const synth = target?.speechSynthesis
    const Utterance = target?.SpeechSynthesisUtterance
    if (!synth || typeof synth.speak !== 'function' || typeof synth.cancel !== 'function' || typeof Utterance !== 'function') return null
    return { synth, createUtterance: (text) => new Utterance(text), schedule: (run) => void setTimeout(run, 0) }
  } catch {
    return null
  }
}

export function speechSupported(scope?: unknown): boolean {
  return speechEnv(scope) !== null
}

export function langOf(tag: string | null | undefined): string {
  return (tag ?? '').trim().toLowerCase().split(/[-_]/)[0] ?? ''
}

export function isOnlineVoice(voice: Pick<VoiceLike, 'localService'> | null | undefined): boolean {
  return voice?.localService === false
}

export function readVoices(env: SpeechEnv | null): VoiceLike[] {
  if (!env) return []
  try {
    return Array.from(env.synth.getVoices() ?? [])
  } catch {
    return []
  }
}

export function onVoicesChange(env: SpeechEnv | null, listener: () => void): () => void {
  const synth = env?.synth
  if (!synth || typeof synth.addEventListener !== 'function') return () => {}
  synth.addEventListener('voiceschanged', listener)
  return () => synth.removeEventListener?.('voiceschanged', listener)
}

export function waitForVoices(env: SpeechEnv | null, timeoutMs = 1500): Promise<VoiceLike[]> {
  const now = readVoices(env)
  if (!env || now.length > 0) return Promise.resolve(now)
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      off()
      clearTimeout(timer)
      resolve(readVoices(env))
    }
    const off = onVoicesChange(env, () => {
      if (readVoices(env).length > 0) finish()
    })
    const timer = setTimeout(finish, timeoutMs)
  })
}

function regionRank(voice: VoiceLike, lang: string): number {
  const order = REGION_PREFERENCE[lang] ?? []
  const index = order.indexOf(voice.lang.toLowerCase().replace('_', '-'))
  return index === -1 ? order.length : index
}

export function voicesFor<V extends VoiceLike>(voices: readonly V[], lang: string): V[] {
  const wanted = langOf(lang)
  return voices
    .filter((voice) => langOf(voice.lang) === wanted)
    .sort(
      (a, b) =>
        Number(isOnlineVoice(a)) - Number(isOnlineVoice(b)) ||
        regionRank(a, wanted) - regionRank(b, wanted) ||
        Number(b.default) - Number(a.default) ||
        a.name.localeCompare(b.name),
    )
}

export function pickVoice<V extends VoiceLike>(voices: readonly V[], lang: string, preferred?: string | null): V | null {
  const options = voicesFor(voices, lang)
  if (preferred) {
    const chosen = options.find((voice) => voice.voiceURI === preferred)
    if (chosen) return chosen
  }
  return options[0] ?? null
}

export function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function greedy(pieces: readonly string[], max: number, joiner = ' '): string[] {
  const out: string[] = []
  let current = ''
  for (const piece of pieces) {
    if (!piece) continue
    const next = current ? current + joiner + piece : piece
    if (next.length <= max) {
      current = next
      continue
    }
    if (current) out.push(current)
    current = piece
  }
  if (current) out.push(current)
  return out
}

function splitLong(text: string, max: number): string[] {
  if (text.length <= max) return [text]
  const clauses = text.split(/(?<=[,;:])\s+/)
  if (clauses.length > 1) return greedy(clauses, max).flatMap((part) => splitLong(part, max))
  const words = text.split(' ')
  if (words.length > 1) return greedy(words, max).flatMap((part) => (part.length > max ? splitLong(part, max) : [part]))
  const parts: string[] = []
  for (let start = 0; start < text.length; start += max) parts.push(text.slice(start, start + max))
  return parts
}

export function splitSentences(text: string, max = MAX_CHUNK_CHARS): string[] {
  const clean = normalizeSpace(text)
  if (!clean) return []
  if (clean.length <= max) return [clean]
  const sentences = clean.split(/(?<=[.!?…])\s+/).flatMap((sentence) => splitLong(sentence, max))
  return greedy(sentences, max)
}

export function textChunks(text: string, lang: string | null = null, max = MAX_CHUNK_CHARS): SpeechChunk[] {
  return text
    .split(/\n\s*\n/)
    .flatMap((paragraph) => splitSentences(paragraph, max))
    .map((piece) => ({ text: piece, kind: 'text' as const, heading: null, lang, node: null }))
}

export type ReadableNode = {
  nodeType: number
  nodeName: string
  nodeValue?: string | null
  childNodes: ArrayLike<ReadableNode>
  getAttribute?: (name: string) => string | null
  checkVisibility?: () => boolean
}

export type PostSkipped = { code: number; decorative: number; hidden: number }

export type PostReading<N = ReadableNode> = { chunks: SpeechChunk<N>[]; skipped: PostSkipped; sections: number }

export type PostReadingOptions = { title?: string | null; lang?: string | null; max?: number }

const ELEMENT_NODE = 1

const TEXT_NODE = 3

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'TEMPLATE',
  'NOSCRIPT',
  'BUTTON',
  'NAV',
  'FORM',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'OPTION',
  'LABEL',
  'CANVAS',
  'VIDEO',
  'AUDIO',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'SVG',
  'MATH',
  'DIALOG',
])

const BLOCK_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'CAPTION',
  'DD',
  'DETAILS',
  'DIV',
  'DL',
  'DT',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'HEADER',
  'HR',
  'LI',
  'MAIN',
  'OL',
  'P',
  'SECTION',
  'SUMMARY',
  'TABLE',
  'TBODY',
  'TD',
  'TFOOT',
  'TH',
  'THEAD',
  'TR',
  'UL',
])

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'])

function attr(node: ReadableNode, name: string): string | null {
  return typeof node.getAttribute === 'function' ? node.getAttribute(name) : null
}

function tagOf(node: ReadableNode): string {
  return node.nodeName.toUpperCase()
}

function isCode(node: ReadableNode): boolean {
  return tagOf(node) === 'PRE' || attr(node, 'data-cw-code') !== null
}

function isHiddenNode(node: ReadableNode): boolean {
  if (attr(node, 'hidden') !== null || attr(node, 'inert') !== null || attr(node, 'data-cw-listen-skip') !== null) return true
  if (attr(node, 'aria-hidden') === 'true') return true
  if (typeof node.checkVisibility === 'function') {
    try {
      return node.checkVisibility() === false
    } catch {
      return false
    }
  }
  return false
}

function imageText(node: ReadableNode): string | null | undefined {
  const tag = tagOf(node)
  const role = attr(node, 'role')
  if (tag === 'IMG') {
    if (role === 'presentation' || role === 'none') return null
    const alt = normalizeSpace(attr(node, 'alt') ?? '')
    return alt || null
  }
  if (role === 'img') return normalizeSpace(attr(node, 'aria-label') ?? '') || null
  return undefined
}

function isHeading(node: ReadableNode): boolean {
  return HEADING_TAGS.has(tagOf(node)) || attr(node, 'role') === 'heading'
}

export function extractPost<N extends ReadableNode>(target: N, options: PostReadingOptions = {}): PostReading<N> {
  const max = options.max ?? MAX_CHUNK_CHARS
  const chunks: SpeechChunk<N>[] = []
  const skipped: PostSkipped = { code: 0, decorative: 0, hidden: 0 }
  const blocks: N[] = [target]
  const langs: Array<string | null> = [attr(target, 'lang') || options.lang || null]
  let heading = options.title ? normalizeSpace(options.title) || null : null
  let sections = heading ? 1 : 0
  let buffer = ''

  if (heading) chunks.push({ text: heading, kind: 'heading', heading, lang: langs[0] ?? null, node: null })

  const flush = (kind: 'text' | 'heading' = 'text') => {
    const text = normalizeSpace(buffer)
    buffer = ''
    if (!text) return
    const node = blocks[blocks.length - 1] ?? null
    const lang = langs[langs.length - 1] ?? null
    if (kind === 'heading') {
      heading = text
      sections += 1
      chunks.push({ text, kind, heading, lang, node })
      return
    }
    for (const piece of splitSentences(text, max)) chunks.push({ text: piece, kind, heading, lang, node })
  }

  const visit = (node: N) => {
    if (node.nodeType === TEXT_NODE) {
      buffer += node.nodeValue ?? ''
      return
    }
    if (node.nodeType !== ELEMENT_NODE) return
    if (isCode(node)) {
      flush()
      skipped.code += 1
      return
    }
    const image = imageText(node)
    if (image !== undefined) {
      if (image === null || isHiddenNode(node)) {
        skipped.decorative += 1
        return
      }
      flush()
      chunks.push({ text: image, kind: 'image', heading, lang: langs[langs.length - 1] ?? null, node })
      return
    }
    if (isHiddenNode(node)) {
      skipped.hidden += 1
      return
    }
    const tag = tagOf(node)
    if (SKIP_TAGS.has(tag)) return
    if (tag === 'BR') {
      buffer += ' '
      return
    }
    const titled = isHeading(node)
    const block = titled || BLOCK_TAGS.has(tag)
    if (!block) {
      for (const child of Array.from(node.childNodes) as N[]) visit(child)
      return
    }
    const ownLang = attr(node, 'lang')
    flush()
    blocks.push(node)
    if (ownLang !== null) langs.push(ownLang || null)
    for (const child of Array.from(node.childNodes) as N[]) visit(child)
    flush(titled ? 'heading' : 'text')
    if (ownLang !== null) langs.pop()
    blocks.pop()
  }

  for (const child of Array.from(target.childNodes) as N[]) visit(child)
  flush()
  return { chunks, skipped, sections }
}

type Session = SpeechSession & { cancelQuietly(): void }

let active: Session | null = null

export function activeSpeech(): SpeechSession | null {
  return active
}

export function stopSpeech(): void {
  active?.stop()
}

export function tagFor(lang: string | null | undefined, fallback: Locale): string {
  const clean = (lang ?? '').trim()
  if (!clean) return LANG_TAGS[fallback]
  if (/[-_]/.test(clean)) return clean
  return (LANG_TAGS as Record<string, string>)[clean.toLowerCase()] ?? clean
}

function voiceFor(chunk: SpeechChunk, options: SpeechOptions, env: SpeechEnv): VoiceLike | null {
  const chosen = options.voice ?? null
  const wanted = langOf(chunk.lang) || options.lang
  if (chosen && langOf(chosen.lang) === wanted) return chosen
  if (!chunk.lang || langOf(chunk.lang) === options.lang) return chosen ?? pickVoice(readVoices(env), options.lang)
  return pickVoice(readVoices(env), wanted)
}

export function speak<N = unknown>(input: string | readonly SpeechChunk<N>[], options: SpeechOptions): SpeechSession {
  const env = options.env === undefined ? speechEnv() : options.env
  const chunks: readonly SpeechChunk[] = typeof input === 'string' ? textChunks(input, options.lang) : [...input]
  const listeners = new Set<(snapshot: SpeechSnapshot) => void>()
  const rate = Math.min(2, Math.max(0.5, options.rate ?? 1))
  let resolveDone: (snapshot: SpeechSnapshot) => void = () => {}
  const done = new Promise<SpeechSnapshot>((resolve) => {
    resolveDone = resolve
  })
  let generation = 0
  let current: UtteranceLike | null = null
  let snapshot: SpeechSnapshot = {
    state: 'playing',
    index: chunks.length > 0 ? 0 : -1,
    total: chunks.length,
    heading: chunks[0]?.heading ?? null,
    chunk: chunks[0] ?? null,
    voice: options.voice?.name ?? null,
    ended: null,
    error: null,
  }

  const emit = (next: Partial<SpeechSnapshot>) => {
    snapshot = { ...snapshot, ...next }
    for (const listener of [...listeners]) listener(snapshot)
  }

  const detach = () => {
    if (current) {
      current.onend = null
      current.onerror = null
    }
    current = null
  }

  const finish = (ended: SpeechEnd, error: string | null = null) => {
    if (snapshot.state === 'stopped') return
    generation += 1
    detach()
    if (active === session) active = null
    emit({ state: 'stopped', ended, error })
    options.signal?.removeEventListener('abort', onAbort)
    resolveDone(snapshot)
  }

  const schedule = env?.schedule ?? ((run: () => void) => run())

  const speakCurrent = () => {
    if (!env) return
    const token = ++generation
    const chunk = chunks[snapshot.index]
    if (!chunk) {
      finish('finished')
      return
    }
    const voice = voiceFor(chunk, options, env)
    emit({ heading: chunk.heading, chunk, voice: voice?.name ?? snapshot.voice })
    schedule(() => {
      if (token !== generation || snapshot.state !== 'playing') return
      const utterance = env.createUtterance(chunk.text)
      utterance.lang = voice?.lang ?? tagFor(chunk.lang, options.lang)
      if (voice) utterance.voice = voice
      utterance.rate = rate
      utterance.onend = () => {
        if (token !== generation) return
        const index = snapshot.index + 1
        if (index >= chunks.length) {
          finish('finished')
          return
        }
        emit({ index, chunk: chunks[index] ?? null, heading: chunks[index]?.heading ?? null })
        speakCurrent()
      }
      utterance.onerror = (event) => {
        if (token !== generation) return
        const code = event?.error ?? 'synthesis-failed'
        if (QUIET_ERRORS.has(code)) finish('cancelled')
        else finish('error', code)
      }
      current = utterance
      try {
        env.synth.speak(utterance)
      } catch (error) {
        finish('error', error instanceof Error ? error.message : String(error))
      }
    })
  }

  const cancelSynth = () => {
    try {
      env?.synth.cancel()
    } catch {}
  }

  const session: Session = {
    get snapshot() {
      return snapshot
    },
    chunks,
    done,
    pause() {
      if (snapshot.state !== 'playing') return
      generation += 1
      detach()
      emit({ state: 'paused' })
      cancelSynth()
    },
    resume() {
      if (snapshot.state !== 'paused') return
      if (active && active !== session) active.cancelQuietly()
      active = session
      cancelSynth()
      emit({ state: 'playing' })
      speakCurrent()
    },
    toggle() {
      if (snapshot.state === 'playing') session.pause()
      else session.resume()
    },
    stop() {
      if (snapshot.state === 'stopped') return
      finish('cancelled')
      cancelSynth()
    },
    cancelQuietly() {
      finish('cancelled')
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }

  const onAbort = () => session.stop()

  if (!env) {
    snapshot = { ...snapshot, state: 'stopped', ended: 'error', error: 'unsupported' }
    resolveDone(snapshot)
    return session
  }
  if (chunks.length === 0) {
    snapshot = { ...snapshot, state: 'stopped', ended: 'finished' }
    resolveDone(snapshot)
    return session
  }
  if (options.signal?.aborted) {
    snapshot = { ...snapshot, state: 'stopped', ended: 'cancelled' }
    resolveDone(snapshot)
    return session
  }
  options.signal?.addEventListener('abort', onAbort, { once: true })
  if (active) active.cancelQuietly()
  active = session
  cancelSynth()
  speakCurrent()
  return session
}

export type ReadPostOptions = Omit<SpeechOptions, 'lang'> & Omit<PostReadingOptions, 'lang'>

export function readPost<N extends ReadableNode>(target: N, lang: Locale, options: ReadPostOptions = {}): SpeechSession {
  const { title, max, ...speech } = options
  const reading = extractPost(target, { title, max, lang })
  return speak(reading.chunks, { ...speech, lang })
}
