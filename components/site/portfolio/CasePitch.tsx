import { ListenPlayer, type ListenLabels } from '@/components/blog/post/ListenPlayer'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { approvedPitch } from '@/content/pitches'
import type { Locale } from '@/lib/i18n/config'
import styles from './CasePitch.module.scss'

const COPY = {
  es: { title: 'Escucha el pitch (60 s)', note: 'El problema, la decisión clave, el resultado y el stack, en un minuto.', play: 'Escuchar el pitch' },
  en: { title: 'Listen to the pitch (60 s)', note: 'The problem, the key decision, the result and the stack, in one minute.', play: 'Listen to the pitch' },
} as const

export function CasePitch({ caseId, lang, title, labels }: { caseId: string; lang: Locale; title: string; labels: ListenLabels }) {
  const pitch = approvedPitch(caseId)
  if (!pitch) return null
  const id = `case-pitch-${caseId}`
  return (
    <GlassSurface as="section" className={styles.pitch} aria-labelledby={`${id}-title`} data-cw-case-pitch={caseId}>
      <h2 id={`${id}-title`} className={styles.title}>
        {COPY[lang].title}
      </h2>
      <p className={styles.note}>{COPY[lang].note}</p>
      <ListenPlayer lang={lang} title={title} target={id} source={`pitch:${caseId}`} labels={{ ...labels, play: COPY[lang].play }} />
      <div id={id} className={styles.script}>
        <p>{pitch.script[lang]}</p>
      </div>
    </GlassSurface>
  )
}
