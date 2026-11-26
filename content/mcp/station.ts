import type { RouteStation } from '@/content/ailab/route/stations'

export const mcpStation: RouteStation = {
  id: 'mcp-en-tu-agente',
  proof: 1,
  alsoProves: [3],
  title: { es: 'El MCP del portafolio en tu agente', en: 'The portfolio MCP in your agent' },
  minutes: 2,
  steps: [
    {
      es: 'Copia la URL del servidor y agrégala en tu cliente de IA: Claude, ChatGPT, Cursor o cualquiera que hable Streamable HTTP.',
      en: 'Copy the server URL and add it to your AI client: Claude, ChatGPT, Cursor or any client that speaks Streamable HTTP.',
    },
    {
      es: 'Pregúntale por un caso, por ejemplo: «¿Qué decisiones de arquitectura tomó Camilo en Synergos?». La respuesta trae los enlaces al sitio.',
      en: 'Ask it about a case, for example: "Which architecture decisions did Camilo make in Synergos?". The answer links back to the site.',
    },
    {
      es: 'Si no tienes un cliente a mano, usa el probador de la página: manda tools/call y copia la petición y la respuesta.',
      en: 'If you have no client at hand, use the tester on the page: send tools/call and copy the request and the response.',
    },
  ],
  href: '/mcp',
  evidence: ['mcp-call'],
  spec: '044',
}