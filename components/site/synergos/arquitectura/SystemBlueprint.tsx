import type { Locale } from '@/content/types'
import { architecture } from '@/content/synergos-architecture'
import styles from './Architecture.module.scss'
import journey from '../ScrollJourney.module.scss'

export function SystemBlueprint({ lang }: { lang: Locale }) {
  const labels = lang === 'es'
    ? { title: 'Las capas de Synergos', top: 'Elementos desde la CDN', bottom: 'Capacidades de negocio', center: 'Compone y conecta', explore: 'Explorar el sistema' }
    : { title: 'The layers of Synergos', top: 'CDN-delivered elements', bottom: 'Business capabilities', center: 'Composes and connects', explore: 'Explore the system' }
  return <figure className={`${styles.blueprint} ${journey.stage}`} aria-label={labels.title}>
    <svg viewBox="0 0 480 480" aria-hidden="true" className={styles.blueprintLines}>
      <ellipse cx="240" cy="240" rx="206" ry="96" transform="rotate(-32 240 240)" />
      <ellipse cx="240" cy="240" rx="206" ry="96" transform="rotate(32 240 240)" />
      <circle cx="240" cy="240" r="164" />
      <path d="M240 103V175M240 305V377M96 240H166M314 240H384" />
      <path d="M240 103V175M240 305V377M96 240H166M314 240H384" pathLength={1} className={journey.path} />
      <circle cx="240" cy="103" r="4" /><circle cx="384" cy="240" r="4" /><circle cx="240" cy="377" r="4" />
    </svg>
    <a href="#recorrido" className={styles.blueprintTop}><span className={styles.mono}>01 / CDN + UI</span><strong>{labels.top}</strong></a>
    <a href="#recorrido" className={styles.blueprintCore}><span aria-hidden="true">⟨ / ⟩</span><strong>Umbraco</strong><small>{labels.center}</small></a>
    <a href="#islas" className={styles.blueprintBottom}><span className={styles.mono}>{architecture.facts.orchestrators} BFF → {architecture.facts.capabilities} API</span><strong>{labels.bottom}</strong></a>
    <figcaption>{labels.explore} <span aria-hidden="true">↗</span></figcaption>
  </figure>
}
