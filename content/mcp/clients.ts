import type { Localized } from '@/content/types'

export const MCP_URL_TOKEN = '{url}'

export type McpClientSnippet = { lang: 'bash' | 'json'; code: string }

export type McpClientGuide = {
  id: string
  name: Localized
  steps: Localized[]
  snippet?: McpClientSnippet
  testedOn: string | null
}

export const mcpClients: readonly McpClientGuide[] = [
  {
    id: 'claude-code',
    name: { es: 'Claude Code', en: 'Claude Code' },
    steps: [
      { es: 'En tu terminal, agrega el servidor con el transporte HTTP:', en: 'In your terminal, add the server with the HTTP transport:' },
      { es: 'Abre Claude Code, escribe /mcp para ver que conectó y pregúntale por un caso.', en: 'Open Claude Code, type /mcp to check that it connected and ask it about a case.' },
    ],
    snippet: { lang: 'bash', code: `claude mcp add --transport http cherced-world ${MCP_URL_TOKEN}` },
    testedOn: null,
  },
  {
    id: 'claude-connector',
    name: { es: 'Claude: conector personalizado', en: 'Claude: custom connector' },
    steps: [
      { es: 'En Claude, abre Configuración → Conectores y elige «Agregar conector personalizado».', en: 'In Claude, open Settings → Connectors and choose "Add custom connector".' },
      { es: 'Pega la URL, déjalo sin autenticación y actívalo en la conversación.', en: 'Paste the URL, leave it without authentication and turn it on in the chat.' },
    ],
    testedOn: null,
  },
  {
    id: 'mcp-inspector',
    name: { es: 'MCP Inspector', en: 'MCP Inspector' },
    steps: [
      { es: 'Ábrelo con este comando y elige el transporte Streamable HTTP:', en: 'Open it with this command and pick the Streamable HTTP transport:' },
      { es: 'Pega la URL, conecta y prueba List Tools y Call Tool.', en: 'Paste the URL, connect and try List Tools and Call Tool.' },
    ],
    snippet: { lang: 'bash', code: 'npx @modelcontextprotocol/inspector' },
    testedOn: null,
  },
  {
    id: 'cursor',
    name: { es: 'Cursor', en: 'Cursor' },
    steps: [
      { es: 'Agrega esto a ~/.cursor/mcp.json, o a .cursor/mcp.json dentro de tu proyecto:', en: 'Add this to ~/.cursor/mcp.json, or to .cursor/mcp.json inside your project:' },
      { es: 'Revisa en la configuración de MCP de Cursor que aparezcan las herramientas.', en: "Check in Cursor's MCP settings that the tools show up." },
    ],
    snippet: { lang: 'json', code: `{\n  "mcpServers": {\n    "cherced-world": { "url": "${MCP_URL_TOKEN}" }\n  }\n}` },
    testedOn: null,
  },
  {
    id: 'chatgpt',
    name: { es: 'ChatGPT: modo desarrollador', en: 'ChatGPT: developer mode' },
    steps: [
      { es: 'En la configuración de ChatGPT, activa el modo desarrollador en Apps y conectores.', en: 'In ChatGPT settings, turn on developer mode under Apps and connectors.' },
      { es: 'Crea un conector con la URL y sin autenticación. Para Deep Research, el servidor trae search y fetch.', en: 'Create a connector with the URL and no authentication. For Deep Research, the server ships search and fetch.' },
    ],
    testedOn: null,
  },
]

export function withMcpUrl(code: string, url: string): string {
  return code.split(MCP_URL_TOKEN).join(url)
}