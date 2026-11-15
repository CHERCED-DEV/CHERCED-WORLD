import type { Metadata } from 'next'
import { EvalsBoard } from '@/components/ailab/evals/EvalsBoard'
import { BackgroundIntensity } from '@/components/motion'
import { resolveLang, type LangParams } from '@/components/site/lang'
import { pageMetadata } from '@/components/site/metadata'
import { evalsCopy } from '@/content/ailab/evals/copy'
import results from '@/content/ailab/evals/results.json'
import { agentInstruction } from '@/lib/ai/agent/knowledge'
import { instructionHash } from '@/lib/ai/evals/hash'
import type { EvalResults } from '@/lib/ai/evals/grade'
import { getDictionary } from '@/lib/i18n/server'
import { logServerError } from '@/lib/security/log'

type Props = { params: LangParams }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await resolveLang(params)
  const copy = evalsCopy[lang]
  return pageMetadata({ lang, path: '/ai-lab/evals', title: copy.title, description: copy.description, common: await getDictionary(lang, 'common') })
}

async function currentHash(): Promise<string | null> {
  try {
    return instructionHash(await agentInstruction('es'))
  } catch (error) {
    logServerError('evals.hash', error)
    return null
  }
}

export default async function EvalsPage({ params }: Props) {
  const lang = await resolveLang(params)
  return (
    <>
      <BackgroundIntensity value="subtle" />
      <EvalsBoard lang={lang} copy={evalsCopy[lang]} results={results as EvalResults} currentHash={await currentHash()} />
    </>
  )
}
