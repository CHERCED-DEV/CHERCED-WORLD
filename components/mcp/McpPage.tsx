import Link from 'next/link'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CODE_TOUR_REF, CODE_TOUR_REPO } from '@/content/ailab/code-tour'
import { mcpClients } from '@/content/mcp/clients'
import { TESTER_DEFAULT_TOOL, testerExample } from '@/content/mcp/tester'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { getDictionary } from '@/lib/i18n/server'
import { SUPPORTED_PROTOCOL_VERSIONS } from '@/lib/mcp/core/constants'
import type { McpPromptDescriptor, McpToolDescriptor } from '@/lib/mcp/core/handler'
import { PORTFOLIO_MCP_PATH, portfolioMcp } from '@/lib/mcp/servers/portafolio'
import { RATE_LIMITS } from '@/lib/security/rate-limit'
import { absoluteUrl, getSiteUrl } from '@/lib/site-url'
import { fillLabel, mcpPageLabels } from './labels'
import { McpCatalog } from './McpCatalog'
import { McpConnect, type McpClientView } from './McpConnect'
import { McpTester } from './McpTester'
import styles from './Mcp.module.scss'

export const MCP_CODE_URL = `https://github.com/${CODE_TOUR_REPO}/tree/${CODE_TOUR_REF}/lib/mcp`

function testedDate(day: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long', timeZone: 'America/Bogota' }).format(new Date(`${day}T12:00:00-05:00`))
}

async function catalog(): Promise<{ tools: McpToolDescriptor[]; prompts: McpPromptDescriptor[] }> {
  const origin = getSiteUrl().origin
  const [tools, prompts] = await Promise.all([
    portfolioMcp.rpc({ jsonrpc: '2.0', id: 'catalog-tools', method: 'tools/list' }, { origin }),
    portfolioMcp.rpc({ jsonrpc: '2.0', id: 'catalog-prompts', method: 'prompts/list' }, { origin }),
  ])
  return {
    tools: tools && 'result' in tools ? (tools.result.tools as McpToolDescriptor[]) : [],
    prompts: prompts && 'result' in prompts ? (prompts.result.prompts as McpPromptDescriptor[]) : [],
  }
}

export async function McpPage({ lang }: { lang: Locale }) {
  const number = new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US')
  const [dict, { tools, prompts }] = await Promise.all([getDictionary(lang, 'mcp'), catalog()])
  const labels = mcpPageLabels(dict, {
    versions: SUPPORTED_PROTOCOL_VERSIONS.join(', '),
    visitor: number.format(RATE_LIMITS.mcp.limit),
    match: number.format(RATE_LIMITS.mcpMatch.limit),
    daily: number.format(RATE_LIMITS.mcpDaily.limit),
  })
  const clients: McpClientView[] = mcpClients.map((client) => ({
    id: client.id,
    name: client.name[lang],
    steps: client.steps.map((step) => step[lang]),
    snippet: client.snippet ?? null,
    status: client.testedOn ? fillLabel(labels.tested, { date: testedDate(client.testedOn, lang) }) : labels.pending,
    tested: client.testedOn !== null,
  }))
  const testerTools = tools.map((tool) => ({
    name: tool.name,
    title: tool.title,
    example: testerExample(tool.name, lang),
    fictional: tool.name === 'match_job_description',
  }))

  return (
    <div className={styles.page} data-cw-mcp="">
      <header className={styles.header}>
        <Link href={localizedPath(lang, '/ai-lab')} className={styles.back}>
          ← {labels.back}
        </Link>
        <h1 className={styles.h1}>{labels.title}</h1>
        <p className={styles.lead}>{labels.lead}</p>
        <p>{labels.what}</p>
        <ul className={styles.facts}>
          <li data-cw-mcp-versions="">{labels.versions}</li>
          <li data-cw-mcp-limits="">{labels.limits}</li>
        </ul>
      </header>

      <McpConnect serverUrl={absoluteUrl(PORTFOLIO_MCP_PATH)} path={PORTFOLIO_MCP_PATH} labels={labels.connect} clients={clients} />

      <McpCatalog tools={tools} prompts={prompts} labels={labels.catalog} />

      <McpTester endpoint={PORTFOLIO_MCP_PATH} tools={testerTools} defaultTool={TESTER_DEFAULT_TOOL} labels={labels.tester} />

      <GlassSurface as="section" className={styles.panel} aria-labelledby="mcp-limits-title" data-cw-mcp-limits-panel="">
        <h2 id="mcp-limits-title" className={styles.h2}>
          {labels.limitsTitle}
        </h2>
        <p>{labels.limitsBody}</p>
        <a href={MCP_CODE_URL} className={styles.codeLink} target="_blank" rel="noopener noreferrer">
          {labels.code}
        </a>
      </GlassSurface>
    </div>
  )
}