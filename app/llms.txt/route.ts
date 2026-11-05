import { buildLlmsTxt } from '@/lib/agent/llms'

export const dynamic = 'force-static'

export async function GET() {
  return new Response(await buildLlmsTxt(), { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
