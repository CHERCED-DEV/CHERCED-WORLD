export type Technology = {
  id: string
  name: string
  family?: string
  aliases?: readonly string[]
}

export const TECHNOLOGIES: readonly Technology[] = [
  { id: 'html', name: 'HTML' },
  { id: 'html5', name: 'HTML5', family: 'html' },
  { id: 'css', name: 'CSS', aliases: ['CSS3'] },
  { id: 'sass', name: 'Sass', aliases: ['SCSS'] },
  { id: 'javascript', name: 'JavaScript', aliases: ['JS', 'ECMASCRIPT', 'VANILLAJS', 'VANILLA JS'] },
  { id: 'typescript', name: 'TypeScript', aliases: ['TS'] },
  { id: 'react', name: 'React', aliases: ['REACTJS'] },
  { id: 'nextjs', name: 'Next.js', aliases: ['NEXTJS'] },
  { id: 'next-auth', name: 'Next Auth', aliases: ['NEXTAUTH'] },
  { id: 'next-redux', name: 'Next Redux', aliases: ['REDUX'] },
  { id: 'next-router', name: 'Next-Router', aliases: ['NEXTROUTER'] },
  { id: 'sweetalert2', name: 'SweetAlert2', aliases: ['SWEETALERT'] },
  { id: 'themoviedb', name: 'TheMovieDB API', aliases: ['APIREST THEMOVIEDB', 'THEMOVIEDB', 'TMDB'] },
  { id: 'own-rest-api', name: 'REST API (own backend)', aliases: ['APIREST OWNBACKEND'] },
  { id: 'webpack', name: 'Webpack' },
  { id: 'figma', name: 'Figma' },
  { id: 'canvas', name: 'Canvas' },
  { id: 'angular', name: 'Angular', aliases: ['ANGULARJS'] },
  { id: 'web-components', name: 'Web Components' },
  { id: 'ngrx', name: 'NgRx' },
  { id: 'nx', name: 'Nx' },
  { id: 'nx-monorepos', name: 'Nx monorepos', family: 'nx' },
  { id: 'accessibility', name: 'Accessibility', aliases: ['A11Y'] },
  { id: 'wcag', name: 'WCAG', family: 'accessibility' },
  { id: 'clean-architecture', name: 'Clean Architecture' },
  { id: 'solid', name: 'SOLID' },
  { id: 'design-patterns', name: 'Design patterns' },
  { id: 'distributed-systems', name: 'Distributed systems' },
  { id: 'microservices', name: 'Microservices' },
  { id: 'micro-frontends', name: 'Micro-frontends' },
  { id: 'native-federation', name: 'Native Federation' },
  { id: 'composable-architecture', name: 'Composable architecture' },
  { id: 'event-driven-architecture', name: 'Event-driven architecture', aliases: ['EDA'] },
  { id: 'saga', name: 'Saga' },
  { id: 'compensating-transactions', name: 'compensating transactions', family: 'saga' },
  { id: 'backend-for-frontend', name: 'Backend for Frontend', aliases: ['BFF'] },
  { id: 'api-design', name: 'API design' },
  { id: 'rest', name: 'REST' },
  { id: 'grpc', name: 'gRPC' },
  { id: 'architecture-tests', name: 'Architecture tests' },
  { id: 'fitness-functions', name: 'fitness functions', family: 'architecture-tests' },
  { id: 'adr', name: 'ADR', aliases: ['ADRS'] },
  { id: 'technical-governance', name: 'technical governance', family: 'adr' },
  { id: 'legacy-modernization', name: 'Legacy modernization' },
  { id: 'spec-driven-development', name: 'Spec-Driven Development', aliases: ['SDD'] },
  { id: 'spec-kit', name: 'Spec Kit', family: 'spec-driven-development', aliases: ['SPECKIT'] },
  { id: 'dotnet', name: '.NET', aliases: ['DOTNET'] },
  { id: 'dotnet-8', name: '.NET 8', family: 'dotnet' },
  { id: 'aspnet-core', name: 'ASP.NET Core', family: 'dotnet' },
  { id: 'csharp', name: 'C#', aliases: ['CSHARP'] },
  { id: 'umbraco', name: 'Umbraco' },
  { id: 'umbraco-13', name: 'Umbraco 13', family: 'umbraco' },
  { id: 'azure', name: 'Azure' },
  { id: 'azure-service-bus', name: 'Azure Service Bus', family: 'azure', aliases: ['SERVICE BUS'] },
  { id: 'aws', name: 'AWS' },
  { id: 'aws-eventbridge', name: 'AWS EventBridge', family: 'aws', aliases: ['EVENTBRIDGE'] },
  { id: 'redpanda-connect', name: 'Redpanda Connect', aliases: ['REDPANDA'] },
  { id: 'sql', name: 'SQL' },
  { id: 'nodejs', name: 'Node.js', aliases: ['NODEJS', 'NODE'] },
  { id: 'express', name: 'Express', aliases: ['EXPRESS', 'EXPRESSJS'] },
  { id: 'mongodb', name: 'MongoDB', aliases: ['MONGO', 'MONGOOSE'] },
  { id: 'docker', name: 'Docker' },
  { id: 'docker-compose', name: 'Compose', family: 'docker' },
  { id: 'ci-cd', name: 'CI/CD' },
  { id: 'github-actions', name: 'GitHub Actions', family: 'ci-cd' },
  { id: 'cloudflare-workers', name: 'Cloudflare Workers' },
  { id: 'cdn', name: 'CDN' },
  { id: 'ai-agents', name: 'AI agents' },
  { id: 'ai-coding-agents', name: 'AI coding agents' },
  { id: 'claude-code', name: 'Claude Code', family: 'ai-coding-agents', aliases: ['CLAUDECODE'] },
  { id: 'multi-agent-orchestration', name: 'Multi-agent orchestration' },
  { id: 'agent-skills', name: 'skills', family: 'ai-coding-agents' },
  { id: 'agent-plugins', name: 'plugins', family: 'ai-coding-agents' },
  { id: 'mcp', name: 'MCP' },
  { id: 'evals', name: 'Evals' },
  { id: 'llm-evals', name: 'LLM evals', family: 'evals' },
  { id: 'guardrails', name: 'guardrails', family: 'evals' },
  { id: 'python', name: 'Python' },
  { id: 'git', name: 'Git' },
  { id: 'git-worktrees', name: 'Git worktrees', family: 'git' },
  { id: 'testing', name: 'Testing' },
  { id: 'xunit', name: 'xUnit', family: 'testing' },
  { id: 'vitest', name: 'Vitest', family: 'testing' },
  { id: 'playwright', name: 'Playwright', family: 'testing' },
  { id: 'code-review', name: 'Code review' },
  { id: 'docs-as-code', name: 'Documentation as code' },
  { id: 'agile', name: 'Agile' },
  { id: 'scrum', name: 'Scrum', family: 'agile' },
  { id: 'business-to-architecture', name: 'Business → architecture' },
  { id: 'stakeholder-communication', name: 'Stakeholder communication' },
  { id: 'product-thinking', name: 'Product thinking' },
]

const PART_SEPARATOR = /\s*·\s*/

export function technologyKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9#+]/g, '')
}

const BY_ID = new Map(TECHNOLOGIES.map((technology) => [technology.id, technology]))

const BY_KEY = new Map<string, Technology>()
for (const technology of TECHNOLOGIES) {
  for (const name of [technology.name, ...(technology.aliases ?? [])]) {
    const key = technologyKey(name)
    if (key.length > 0 && !BY_KEY.has(key)) BY_KEY.set(key, technology)
  }
}

export function technologyParts(value: string): string[] {
  return value
    .split(PART_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

export function technologyById(id: string): Technology | null {
  return BY_ID.get(id) ?? null
}

export function exactTechnology(value: string): Technology | null {
  return BY_KEY.get(technologyKey(value)) ?? null
}

export function findTechnology(value: string): Technology | null {
  const whole = exactTechnology(value)
  if (whole) return whole
  const [first] = technologyParts(value)
  return first && first !== value ? (BY_KEY.get(technologyKey(first)) ?? null) : null
}

export function technologyId(value: string): string {
  return findTechnology(value)?.id ?? technologyKey(value)
}

export function familyOf(id: string): string {
  return BY_ID.get(id)?.family ?? id
}

export function technologyFamily(value: string): string {
  return familyOf(technologyId(value))
}

export function technologyName(value: string): string {
  const whole = BY_KEY.get(technologyKey(value))
  if (whole) return whole.name
  const parts = technologyParts(value)
  if (parts.length === 0) return value.trim()
  return parts.map((part) => BY_KEY.get(technologyKey(part))?.name ?? part).join(' · ')
}

export function technologyAliases(id: string): string[] {
  const technology = BY_ID.get(id)
  if (!technology) return [id]
  return [...new Set([technology.name, ...(technology.aliases ?? [])].map(technologyKey))]
}

export function sameFamily(a: string, b: string): boolean {
  return technologyFamily(a) === technologyFamily(b)
}
