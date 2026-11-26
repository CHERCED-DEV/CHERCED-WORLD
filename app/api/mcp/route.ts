import { portfolioMcp } from '@/lib/mcp/servers/portafolio'

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

export const maxDuration = 30

export function POST(request: Request): Promise<Response> {
  return portfolioMcp.POST(request)
}

export function GET(): Response {
  return portfolioMcp.GET()
}

export function DELETE(): Response {
  return portfolioMcp.DELETE()
}

export function OPTIONS(): Response {
  return portfolioMcp.OPTIONS()
}