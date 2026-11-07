import type { Locale } from '@/content/types'
import { ArchitectureDiagram } from './ArchitectureDiagram'

export function RecorridoDiagram({ lang }: { lang: Locale }) {
  return <ArchitectureDiagram kind="recorrido" lang={lang} />
}
