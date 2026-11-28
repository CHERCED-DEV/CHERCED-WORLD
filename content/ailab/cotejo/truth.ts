import type { Family } from 'cotejo-core'
import type { Localized } from '@/content/types'

export const COTEJO_SAMPLE_LINES = 584

export const COTEJO_SAMPLE_PATHS = { es: 'content/ailab/cotejo/sample.es.md', en: 'content/ailab/cotejo/sample.en.md' } as const

export type CotejoDefectLayer = 'C1' | 'C3'

export type CotejoSeededDefect = {
  id: string
  family: Family
  layer: CotejoDefectLayer
  lines: readonly number[]
  units: readonly string[]
  quote: Localized
  note: Localized
}

export type CotejoTraceTruth = {
  unitId: string
  exists: boolean
  files: readonly string[]
}

function defect(
  id: string,
  family: Family,
  lines: readonly number[],
  units: readonly string[],
  quote: Localized,
  note: Localized,
  layer: CotejoDefectLayer = 'C1',
): CotejoSeededDefect {
  return { id, family, layer, lines, units, quote, note }
}

export const COTEJO_DEFECTS: readonly CotejoSeededDefect[] = [
  defect('S01', 'ids', [263, 267], ['FR-014'], { es: '**FR-014**: La suscripción', en: '**FR-014**: The newsletter subscription' }, { es: 'El mismo ID para dos requisitos distintos.', en: 'The same ID for two different requirements.' }),
  defect('S02', 'ids', [333], ['FR-56'], { es: '**FR-56**', en: '**FR-56**' }, { es: 'Un ID de dos dígitos entre IDs de tres.', en: 'A two-digit ID among three-digit IDs.' }),
  defect('S03', 'references', [296], ['FR-037'], { es: 'FR-099', en: 'FR-099' }, { es: 'Cita FR-099, que no existe.', en: 'It cites FR-099, which does not exist.' }),
  defect('S04', 'references', [369], ['SC-007'], { es: 'NFR-009', en: 'NFR-009' }, { es: 'Cita NFR-009, que no existe.', en: 'It cites NFR-009, which does not exist.' }),
  defect('S05', 'references', [444], [], { es: '#bordes-de-la-sala', en: '#reading-room-edges' }, { es: 'Un enlace a un ancla que no existe.', en: 'A link to an anchor that does not exist.' }),
  defect('S06', 'duplicates', [282, 288], ['FR-026', 'FR-032'], { es: '**FR-026**: El buscador DEBE encontrar', en: '**FR-026**: The search MUST find' }, { es: 'El mismo requisito copiado con otro ID.', en: 'The same requirement copied under another ID.' }),
  defect('S07', 'duplicates', [272, 336], ['FR-019', 'FR-059'], { es: '**FR-019**: El lector DEBE poder guardar', en: '**FR-019**: The reader MUST be able to save' }, { es: 'Casi la misma frase: solo suma «o clic».', en: 'Nearly the same sentence: it only adds “or click”.' }),
  defect('S08', 'value-conflict', [264, 268], ['FR-015', 'FR-018'], { es: 'vencer a las 24 horas', en: 'expire after 24 hours' }, { es: 'El enlace vence a las 24 horas y a las 48 horas.', en: 'The link expires after 24 hours and after 48 hours.' }),
  defect('S09', 'value-conflict', [255, 340], ['FR-009', 'NFR-001'], { es: 'en 2 s o menos', en: 'in 2 s or less' }, { es: '2 s frente a 2500 milisegundos: se ve al normalizar las unidades.', en: '2 s versus 2500 milliseconds: it shows once the units are normalized.' }),
  defect('S10', 'value-conflict', [273, 278], ['FR-020', 'FR-025'], { es: 'hasta 50 artículos', en: 'up to 50 articles' }, { es: 'La lista guarda hasta 50 y hasta 100 artículos.', en: 'The list holds up to 50 and up to 100 articles.' }),
  defect('S11', 'polarity-conflict', [283, 287], ['FR-027', 'FR-031'], { es: 'DEBE incluir las entradas en borrador', en: 'MUST include the draft posts' }, { es: 'El buscador incluye los borradores y no los incluye.', en: 'The search includes the drafts and does not.' }),
  defect('S12', 'polarity-conflict', [275, 398], ['FR-022'], { es: 'DEBE sincronizarse entre los dispositivos', en: 'MUST sync across the devices' }, { es: 'Un requisito sincroniza la lista y un supuesto lo niega.', en: 'A requirement syncs the list and an assumption denies it.' }),
  defect('S13', 'language', [261], ['FR-012'], { es: 'rápidamente', en: 'quickly' }, { es: 'Vago: no dice en cuánto tiempo.', en: 'Vague: it does not say how soon.' }),
  defect('S14', 'language', [253], ['FR-007'], { es: 'adecuado', en: 'adequate' }, { es: 'Vago: no dice qué contraste.', en: 'Vague: it does not say what contrast.' }),
  defect('S15', 'language', [274], ['FR-021'], { es: 'intuitiva', en: 'intuitive' }, { es: 'Subjetivo: depende de quién lo juzgue.', en: 'Subjective: it depends on who judges it.' }),
  defect('S16', 'language', [294], ['FR-035'], { es: 'fácil de usar', en: 'easy to use' }, { es: 'Subjetivo: no dice cómo se mide.', en: 'Subjective: it does not say how it is measured.' }),
  defect('S17', 'language', [126], [], { es: 'si es posible', en: 'if possible' }, { es: 'Escapatoria: deja la obligación a criterio de quien implementa.', en: 'Loophole: it leaves the obligation to the implementer.' }),
  defect('S18', 'language', [27], [], { es: 'la mejor experiencia', en: 'the best reading experience' }, { es: 'Superlativo que no se puede comprobar.', en: 'A superlative that cannot be checked.' }),
  defect('S19', 'language', [344], ['NFR-005'], { es: 'etc.', en: 'etc.' }, { es: 'Lista abierta: no se sabe qué más incluye.', en: 'Open list: nobody knows what else it includes.' }),
  defect('S20', 'language', [265], ['FR-016'], { es: 'y/o', en: 'and/or' }, { es: '«y/o» admite dos lecturas.', en: '“and/or” allows two readings.' }),
  defect('S21', 'language', [276], ['FR-023'], { es: 'varios formatos', en: 'several formats' }, { es: 'Cantidad sin número: ¿cuáles formatos?', en: 'A quantity without a number: which formats?' }),
  defect('S22', 'language', [478], [], { es: 'Normalmente', en: 'Normally' }, { es: 'Vago: ¿y cuando no?', en: 'Vague: and when not?' }),
  defect('S23', 'numbers', [285], ['FR-029'], { es: '800', en: '800' }, { es: 'Un tiempo de espera de 800 sin unidad.', en: 'A timeout of 800 with no unit.' }),
  defect('S24', 'glossary', [116, 125, 126, 308, 508], ['FR-043'], { es: 'PWA', en: 'PWA' }, { es: 'Acrónimo que se usa y no se define.', en: 'An acronym used and never defined.' }),
  defect('S25', 'glossary', [74], [], { es: 'OPML', en: 'OPML' }, { es: 'Acrónimo que se usa y no se define.', en: 'An acronym used and never defined.' }),
  defect('S26', 'glossary', [430], [], { es: 'Lectura guiada', en: 'Guided reading' }, { es: 'Término del glosario que la spec no usa.', en: 'A glossary term the spec never uses.' }),
  defect('S27', 'glossary', [438], [], { es: 'SMTP', en: 'SMTP' }, { es: 'Acrónimo definido que la spec no usa.', en: 'An acronym defined and never used.' }),
  defect('S28', 'glossary', [109], [], { es: 'backoffice', en: 'backoffice' }, { es: '«backoffice» frente a «back office» del glosario.', en: '“backoffice” versus the glossary’s “back office”.' }),
  defect('S29', 'structure', [110], [], { es: '[NEEDS CLARIFICATION', en: '[NEEDS CLARIFICATION' }, { es: 'Una aclaración pendiente.', en: 'A pending clarification.' }),
  defect('S30', 'structure', [295], ['FR-036'], { es: 'TBD', en: 'TBD' }, { es: 'Un valor que quedó por definir.', en: 'A value left to be defined.' }),
  defect('S31', 'structure', [404], [], { es: '## Dependencias', en: '## Dependencies' }, { es: 'Una sección vacía.', en: 'An empty section.' }),
  defect(
    'S32',
    'polarity-conflict',
    [277, 334],
    ['FR-024', 'FR-057'],
    { es: 'DEBE vivir solo en el navegador', en: 'MUST live only in the reader' },
    { es: 'El historial vive solo en el navegador, y el servidor guarda 90 días de páginas por lector: se contradicen con otras palabras.', en: 'The history lives only in the browser, and the server keeps 90 days of pages per reader: they contradict each other in different words.' },
    'C3',
  ),
  defect(
    'S33',
    'duplicates',
    [252, 333],
    ['FR-006', 'FR-56'],
    { es: 'cambiar entre tema claro y tema oscuro', en: 'switch between light theme and dark theme' },
    { es: 'El mismo requisito del tema dicho con otras palabras.', en: 'The same theme requirement in other words.' },
    'C3',
  ),
  defect(
    'S34',
    'duplicates',
    [250, 335],
    ['FR-004', 'FR-058'],
    { es: 'el tiempo estimado de lectura', en: 'the estimated reading time' },
    { es: 'El mismo requisito del tiempo de lectura dicho con otras palabras.', en: 'The same reading time requirement in other words.' },
    'C3',
  ),
]

export const COTEJO_TRACE_TRUTH: readonly CotejoTraceTruth[] = [
  { unitId: 'FR-001', exists: true, files: ['components/blog/ReadingProgress'] },
  { unitId: 'FR-002', exists: true, files: ['components/blog/Toc', 'components/blog/post/TocSheet'] },
  { unitId: 'FR-003', exists: true, files: ['components/blog/CopyButton'] },
  { unitId: 'FR-004', exists: true, files: ['lib/blog/reading-time'] },
  { unitId: 'FR-005', exists: true, files: ['components/shell/BackToTop'] },
  { unitId: 'FR-006', exists: true, files: ['components/shell/ThemeToggle'] },
  { unitId: 'FR-010', exists: true, files: ['components/shell/LangSwitch', 'components/blog/post/TranslatedNote'] },
  { unitId: 'FR-011', exists: true, files: ['app/[lang]/feed.xml/'] },
  { unitId: 'FR-026', exists: true, files: ['lib/search/'] },
  { unitId: 'FR-028', exists: true, files: ['app/[lang]/blog/tag/'] },
  { unitId: 'FR-033', exists: true, files: ['components/blog/reactions/', 'lib/actions/reactions', 'app/api/reactions/'] },
  { unitId: 'FR-034', exists: true, files: ['components/blog/comments/', 'lib/actions/comments', 'components/admin/CommentList'] },
  { unitId: 'FR-038', exists: true, files: ['components/blog/post/SeriesNav', 'components/blog/post/series'] },
  { unitId: 'FR-039', exists: true, files: ['components/blog/post/ListenPlayer', 'app/api/listen/'] },
  { unitId: 'FR-040', exists: true, files: ['components/blog/post/RelatedPosts'] },
  { unitId: 'FR-041', exists: true, files: ['app/sitemap'] },
  { unitId: 'FR-042', exists: true, files: ['app/[lang]/blog/[id]/opengraph-image', 'lib/og/'] },
  { unitId: 'FR-047', exists: true, files: ['components/blog/post/TranslatedNote'] },
  { unitId: 'FR-008', exists: false, files: [] },
  { unitId: 'FR-013', exists: false, files: [] },
  { unitId: 'FR-019', exists: false, files: [] },
  { unitId: 'FR-023', exists: false, files: [] },
  { unitId: 'FR-043', exists: false, files: [] },
  { unitId: 'FR-044', exists: false, files: [] },
  { unitId: 'FR-045', exists: false, files: [] },
  { unitId: 'FR-050', exists: false, files: [] },
]
