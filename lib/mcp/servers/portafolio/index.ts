import type { RouteStation } from '@/content/ailab/route/stations'
import { createMcpHandler } from '@/lib/mcp/core/handler'
import type { McpServerOptions, McpTool } from '@/lib/mcp/core/types'
import { portfolioPrompts } from './prompts'
import { getCaseStudyTool, listCaseStudiesTool } from './tools/cases'
import { getContactOptionsTool } from './tools/contact'
import { getDecisionsTool } from './tools/decisions'
import { matchJobDescriptionTool } from './tools/match'
import { fetchTool, searchTool } from './tools/openai'
import { getCareerTool, getSkillsTool, listPostsTool } from './tools/profile'
import { interviewRouteTool } from './tools/route'
import { searchPortfolioTool } from './tools/search'

export const PORTFOLIO_MCP_PATH = '/api/mcp'

export const PORTFOLIO_MCP_NAME = 'cherced-world-portfolio'

export const PORTFOLIO_MCP_TITLE = 'CHERCED-WORLD portfolio'

export const PORTFOLIO_MCP_VERSION = '1.0.0'

export const PORTFOLIO_MCP_INSTRUCTIONS =
  "Read-only server for the public portfolio of Camilo Hernández (CHERCED-WORLD): case studies, architecture decisions, career, skills, blog posts, contact options and a deterministic job-description match. Every result links to its source on the site: cite those links. Pass lang \"es\" or \"en\" to choose the language of the content (default \"en\"). There is no private data here and tool arguments are not stored."

export const ROUTE_STATIONS: readonly RouteStation[] = []

export function portfolioToolList(stations: readonly RouteStation[] = ROUTE_STATIONS): ReadonlyArray<McpTool<unknown, unknown>> {
  return [
    searchPortfolioTool,
    listCaseStudiesTool,
    getCaseStudyTool,
    getDecisionsTool,
    getCareerTool,
    getSkillsTool,
    listPostsTool,
    matchJobDescriptionTool,
    ...(stations.length > 0 ? [interviewRouteTool(stations)] : []),
    getContactOptionsTool,
    searchTool,
    fetchTool,
  ]
}

export const portfolioServer: McpServerOptions = {
  name: PORTFOLIO_MCP_NAME,
  title: PORTFOLIO_MCP_TITLE,
  version: PORTFOLIO_MCP_VERSION,
  instructions: PORTFOLIO_MCP_INSTRUCTIONS,
  tools: portfolioToolList(),
  prompts: portfolioPrompts,
  limits: { visitor: 'mcp', daily: 'mcpDaily' },
}

export const portfolioMcp = createMcpHandler(portfolioServer)