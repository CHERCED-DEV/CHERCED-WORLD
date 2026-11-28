import type { RouteStation } from '@/content/ailab/route/stations'
import type { Localized } from '@/content/types'

export const COTEJO_REPO_HREF = 'https://github.com/CHERCED-DEV/cotejo'

export const COTEJO_EVIDENCE_TEXT: Readonly<Record<'cotejo-findings' | 'cotejo-metrics' | 'cotejo-repo-run', Localized>> = {
  'cotejo-findings': {
    es: 'Los hallazgos de Cotejo por familia y el tiempo de la capa determinista en tu navegador (047).',
    en: 'Cotejo’s findings by family and the time of the deterministic layer in your browser (047).',
  },
  'cotejo-metrics': {
    es: 'La precisión y el recall de Cotejo contra la verdad de la muestra, y el SARIF descargado (047).',
    en: 'Cotejo’s precision and recall against the sample’s ground truth, and the downloaded SARIF (047).',
  },
  'cotejo-repo-run': {
    es: 'El enlace al repo abierto de Cotejo y al último run de su GitHub Action (047).',
    en: 'The link to Cotejo’s open repo and to the latest run of its GitHub Action (047).',
  },
}

export const cotejoStation: RouteStation = {
  id: 'cotejo',
  proof: 2,
  alsoProves: [3, 4],
  title: { es: 'Cotejo: la spec contra sí misma', en: 'Cotejo: the spec against itself' },
  minutes: 2,
  steps: [
    {
      es: 'Abre Cotejo en el AI Lab y analiza la muestra: unas 600 líneas con defectos sembrados, revisadas en tu navegador sin modelo y sin red.',
      en: 'Open Cotejo in the AI Lab and analyze the sample: about 600 lines with seeded defects, reviewed in your browser with no model and no network.',
    },
    {
      es: 'Abre una contradicción de valor y mira su caja de cristal: la línea señalada, el puntaje desglosado y cómo refutarla. Luego busca en el repo del sitio y abre un «posiblemente implementado».',
      en: 'Open a value conflict and look at its glass box: the marked line, the score breakdown and how to refute it. Then search the site’s repo and open a “possibly implemented”.',
    },
    {
      es: 'Mira la precisión y el recall en vivo contra la verdad de la muestra, y lo que la capa determinista no ve.',
      en: 'Look at the live precision and recall against the sample’s ground truth, and at what the deterministic layer does not see.',
    },
    {
      es: 'Descarga el SARIF: es el mismo que la GitHub Action de Cotejo sube a un PR.',
      en: 'Download the SARIF: it is the same one Cotejo’s GitHub Action uploads to a PR.',
    },
  ],
  href: '/ai-lab#lab-a11',
  evidence: ['cotejo-findings', 'cotejo-metrics', 'cotejo-repo-run'],
  spec: '047',
}
