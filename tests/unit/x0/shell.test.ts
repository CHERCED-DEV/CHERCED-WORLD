import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { consentBody } from '@/components/ailab/shell/ConsentDialog'
import { labDemos } from '@/components/ailab/shell/demos'
import { LabCardView } from '@/components/ailab/shell/LabCard'
import { LabPageView } from '@/components/ailab/shell/LabPage'
import {
  labCardLabels,
  labClearLabels,
  labConsentLabels,
  labDemoCopy,
  labPageLabels,
  labTryLabels,
} from '@/components/ailab/shell/labels'
import { aiLabOg } from '@/components/ailab/shell/og'
import { ToastProvider } from '@/components/ui/Toast'
import { labCatalog, labExperiment } from '@/content/ailab/catalog'
import type { LabExperiment, LabExperimentId } from '@/content/types'
import { toDownloadRequest } from '@/lib/ailab/core/consent'
import { formatBytes } from '@/lib/ailab/core/format'
import { getDictionary } from '@/lib/i18n/server'

async function dictionaries(lang: 'es' | 'en') {
  const [ailab, site, blog] = await Promise.all([getDictionary(lang, 'ailab'), getDictionary(lang, 'site'), getDictionary(lang, 'blog')])
  return { ailab, site, blog }
}

const Toasts = ToastProvider as unknown as (props: { closeLabel: string; children?: ReactNode }) => ReactNode

function render(element: ReactElement): string {
  return renderToStaticMarkup(createElement(Toasts, { closeLabel: 'Cerrar' }, element))
}

async function card(lang: 'es' | 'en', id: LabExperimentId | LabExperiment): Promise<string> {
  const { ailab, site, blog } = await dictionaries(lang)
  const experiment = typeof id === 'string' ? labExperiment(id) : id
  return render(
    createElement(LabCardView, {
      lang,
      experiment,
      labels: labCardLabels(ailab, site, blog),
      tryLabels: labTryLabels(ailab, experiment.title[lang]),
      copy: labDemoCopy(ailab, experiment.id),
    }),
  )
}

async function page(lang: 'es' | 'en'): Promise<string> {
  const { ailab, site, blog } = await dictionaries(lang)
  return render(
    createElement(LabPageView, {
      lang,
      labels: labPageLabels(ailab),
      cardLabels: labCardLabels(ailab, site, blog),
      consentLabels: labConsentLabels(ailab),
      clearLabels: labClearLabels(ailab),
      cards: labCatalog.map((experiment) => ({
        experiment,
        tryLabels: labTryLabels(ailab, experiment.title[lang]),
        copy: labDemoCopy(ailab, experiment.id),
      })),
    }),
  )
}

function count(html: string, pattern: RegExp): number {
  return html.match(new RegExp(pattern, 'g'))?.length ?? 0
}

describe('formato de la tarjeta (FR-303)', () => {
  it('V1: título, estado, dónde corre, privacidad, qué descarga, Pruébalo, Cómo funciona y El código', async () => {
    const html = await card('es', 'V1')
    expect(html).toMatch(/<article[^>]*id="lab-v1"[^>]*aria-labelledby="lab-v1-title"/)
    expect(html).toContain('<h3 id="lab-v1-title"')
    expect(html).toContain('Transcriptor</h3>')
    expect(html).toMatch(/data-cw-lab-status="beta"[^>]*>.*<span class="cw-visually-hidden">Estado: <\/span>Beta/)
    expect(html).toMatch(/data-cw-lab-runs="browser"[^>]*>.*Corre en tu navegador/)
    expect(html).toMatch(/data-cw-lab-privacy="">.*Privacidad: <\/span>Tu audio se transcribe en tu navegador/)
    expect(html).toContain('Whisper base (int8) · 77 MB · desde huggingface.co')
    expect(html).toMatch(
      /Whisper small \(int8\) · 249 MB · desde huggingface\.co<span data-cw-lab-engine=""> \+ motor ONNX Runtime Web · 27 MB · desde este sitio<\/span><span[^>]*> · solo si lo pides<\/span>/,
    )
    expect(html).toMatch(/data-cw-lab-open=""[^>]*>Probar<\/button>/)
    expect(html).toMatch(/aria-label="Probar Transcriptor"[^>]*aria-describedby="lab-v1-downloads"|aria-describedby="lab-v1-downloads"[^>]*aria-label="Probar Transcriptor"/)
    expect(html).toContain('Esta demo necesita JavaScript. Aquí tienes cómo funciona y su código.')
    expect(html).toMatch(/<details[^>]*data-cw-lab-part="how"><summary[^>]*><h4[^>]*>Cómo funciona<\/h4><\/summary>/)
    expect(count(html, /data-cw-adr=""/)).toBe(2)
    expect(count(html, /<li class="[^"]*step/)).toBe(3)
    expect(html).toContain('Decisión')
    expect(html).toMatch(/data-cw-lab-part="code"><summary[^>]*><h4[^>]*>El código<\/h4>/)
    expect(html).toContain('data-cw-code="typescript"')
    const repoPath = labExperiment('V1').code!.repoPath
    expect(html).toContain(`href="https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main/${repoPath}"`)
    expect(html).toContain(`Archivo: ${repoPath}`)
  })

  it('un experimento sin descargas lo dice, y sin código no pinta "El código"', async () => {
    const html = await card('en', { ...labExperiment('R1'), code: null })
    expect(html).toContain('Saga simulator</h3>')
    expect(html).toMatch(/data-cw-lab-downloads="none"[^>]*>It doesn&#x27;t download anything\./)
    expect(html).toMatch(/data-cw-lab-status="stable"[^>]*>.*Status: <\/span>Stable/)
    expect(html).toContain('Runs in your browser')
    expect(html).not.toContain('data-cw-lab-part="code"')
    expect(html).toContain('How it works')
  })

  it('las ranuras demo, how y code reemplazan lo que trae el catálogo', async () => {
    const { ailab, site, blog } = await dictionaries('es')
    const experiment = labExperiment('J1')
    const html = render(
      createElement(LabCardView, {
        lang: 'es',
        experiment,
        labels: labCardLabels(ailab, site, blog),
        tryLabels: labTryLabels(ailab, experiment.title.es),
        copy: {},
        demo: createElement('div', { 'data-demo': 'propia' }),
        how: createElement('p', { 'data-how': 'propio' }),
        code: createElement('pre', { 'data-code': 'propio' }),
      }),
    )
    expect(html).toContain('data-demo="propia"')
    expect(html).toContain('data-how="propio"')
    expect(html).toContain('data-code="propio"')
    expect(html).not.toContain('data-cw-lab-open')
    expect(html).not.toContain('data-cw-adr=""')
  })

  it('la demo de cada experimento recibe solo su copy y el compartido', async () => {
    const { ailab } = await dictionaries('es')
    const copy = labDemoCopy(ailab, 'V1')
    expect(Object.keys(copy).every((key) => key.startsWith('ailab.v1.') || /^ailab\.(worker|storage)\./.test(key))).toBe(true)
    expect(copy['ailab.v1.title']).toBe('Transcriptor')
    expect(copy['ailab.worker.evicted']).toMatch(/dos a la vez/)
    expect(copy).not.toHaveProperty('ailab.v4.title')
  })

  it('cada demo registrada es de un experimento del catálogo', () => {
    const ids = new Set(labCatalog.map((experiment) => experiment.id))
    expect(Object.keys(labDemos).filter((id) => !ids.has(id as LabExperimentId))).toEqual([])
    for (const demo of Object.values(labDemos)) expect(demo).toBeTypeOf('function')
  })
})

describe('página del laboratorio (FR-301)', () => {
  it.each(['es', 'en'] as const)('%s: título, intro, privacidad, cuatro temas y once tarjetas', async (lang) => {
    const html = await page(lang)
    const { ailab } = await dictionaries(lang)
    expect(count(html, /<h1/)).toBe(1)
    expect(html).toMatch(/<h1[^>]*id="ailab-title"[^>]*>AI LAB<\/h1>/)
    expect(html).toContain(ailab['ailab.intro']!.replace(/'/g, '&#x27;'))
    expect(html).toContain(ailab['ailab.privacy']!.replace(/'/g, '&#x27;'))
    expect(html).toContain(`href="/${lang}/privacy"`)
    expect([...html.matchAll(/data-cw-ailab-theme="(\w+)"/g)].map((match) => match[1])).toEqual(['voice', 'architecture', 'agents', 'games'])
    expect(count(html, /<h2[^>]*id="ailab-\w+-title"/)).toBe(4)
    expect([...html.matchAll(/data-cw-lab-card="(\w+)"/g)].map((match) => match[1])).toEqual(['V5', 'V1', 'V2', 'V3', 'V4', 'R1', 'A2', 'A3', 'A5', 'A4', 'J1', 'J2'])
    expect(count(html, /data-cw-lab-runs="browser"/)).toBe(11)
    expect(count(html, /data-cw-lab-runs="google"/)).toBe(1)
    expect(count(html, /data-cw-lab-status="/)).toBe(12)
    expect(count(html, /data-cw-lab-noscript=""/)).toBe(12)
    expect(count(html, /data-cw-ailab-theme-link=/)).toBe(4)
    expect(html).toContain('data-cw-lab-clear=""')
    expect(html).toContain('<dialog')
    expect(html.indexOf(ailab['ailab.plugins']!.slice(0, 40))).toBeGreaterThan(html.indexOf('data-cw-ailab-theme="agents"'))
  })
})

describe('diálogo de consentimiento y pesos (FR-310)', () => {
  it('dice qué se descarga, cuánto pesa, de dónde viene y que queda en el navegador', async () => {
    const request = { experiment: 'V1' as const, resource: 'Whisper base (int8)', bytes: 77_000_000, host: 'huggingface.co' as const }
    expect(consentBody(labConsentLabels((await dictionaries('es')).ailab), request, 'es')).toBe(
      'Este experimento descarga Whisper base (int8) (77 MB) desde huggingface.co. Queda guardado en tu navegador para la próxima vez.',
    )
    expect(consentBody(labConsentLabels((await dictionaries('en')).ailab), request, 'en')).toBe(
      'This experiment downloads Whisper base (int8) (77 MB) from huggingface.co. It stays in your browser for next time.',
    )
  })

  it('si el modelo necesita un motor que sirve este sitio, también lo dice con su peso', async () => {
    const request = toDownloadRequest('V1', labExperiment('V1').downloads[0]!)
    expect(request.engine).toEqual({ resource: 'ONNX Runtime Web', bytes: 26_861_777 })
    expect(consentBody(labConsentLabels((await dictionaries('es')).ailab), request, 'es')).toBe(
      'Este experimento descarga Whisper base (int8) (77 MB) desde huggingface.co. Queda guardado en tu navegador para la próxima vez. Para correrlo, tu navegador también baja el motor ONNX Runtime Web (27 MB) desde este sitio, si no lo tiene ya.',
    )
    expect(consentBody(labConsentLabels((await dictionaries('en')).ailab), request, 'en')).toBe(
      'This experiment downloads Whisper base (int8) (77 MB) from huggingface.co. It stays in your browser for next time. To run it, your browser also fetches the ONNX Runtime Web engine (27 MB) from this site, if it does not have it yet.',
    )
    expect(labCatalog.filter((item) => item.downloads.some((download) => download.host === 'cdn.jsdelivr.net' && download.engine))).toEqual([])
  })

  it('formatea el peso en cada idioma', () => {
    expect(formatBytes(77_000_000, 'es')).toBe('77 MB')
    expect(formatBytes(3_100_000, 'es')).toBe('3,1 MB')
    expect(formatBytes(3_100_000, 'en')).toBe('3.1 MB')
    expect(formatBytes(249_000_000, 'en')).toBe('249 MB')
    expect(formatBytes(512_000, 'es')).toBe('512 kB')
    expect(() => formatBytes(-1, 'es')).toThrow(RangeError)
  })

  it('la imagen OG usa el título y la descripción del laboratorio', () => {
    expect(aiLabOg('es')).toEqual({
      lang: 'es',
      title: 'AI LAB',
      line: 'Experimentos de IA que corren en tu navegador: pruébalos, mira cómo funcionan y lee su código.',
    })
    expect(aiLabOg('en').line).toBe('AI experiments that run in your browser: try them, see how they work and read their code.')
  })
})
