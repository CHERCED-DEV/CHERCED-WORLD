# Contenido 004: copy ES/EN listo para pegar

Apéndice de [spec.md](./spec.md). Cada bloque está en la forma de los datos del repo (`content/site.ts`,
`content/projects.ts` y `content/i18n/{es,en}/*.json`). Los cambios de tipos que hacen falta están en
spec.md, Key Entities.

**Reglas que aplican a todo este archivo**

- Sin cifras del empleador actual, sin nombres internos (sistemas, repos, proveedores o leyes) y sin material de
  clientes.
- Lo que el autor no ha confirmado está marcado **[P-4xx]** y no se publica hasta que se resuelva.
- Los niveles de skills son propuestas **[P-401]**.

---

## §1 Hero y meta descriptions

```ts
home: {
  greeting: { es: 'Mi nombre es', en: 'My name is' },
  name: 'Camilo',
  previousTitle: { es: 'SOY DESARROLLADOR', en: "I'M A DEVELOPER" },
  title: { es: 'DISEÑO SISTEMAS QUE ESCALAN', en: 'I DESIGN SYSTEMS THAT SCALE' },
  subtitle: {
    es: 'Software Solutions Engineer · AI-First. Micro-frontends, microservicios .NET y plataformas composables.',
    en: 'Software Solutions Engineer · AI-First. Micro-frontends, .NET microservices and composable platforms.',
  },
},
```

`site.json` repite `home.title`, así que se actualiza con el mismo valor. Claves nuevas:

| Clave | ES | EN |
|---|---|---|
| `home.previousTitleLabel` (solo para lectores de pantalla) | Antes decía: | It used to say: |

Meta descriptions. `meta.description` va en `common.json`; las demás, en `site.json` o `contact.json`.

| Clave | ES | EN |
|---|---|---|
| `meta.description` y `meta.home.description` | Camilo Hernandez, Software Solutions Engineer. Diseño sistemas composables y distribuidos con micro-frontends, microservicios .NET y Azure. Trabajo AI-first y spec-driven. | Camilo Hernandez, Software Solutions Engineer. I design composable, distributed systems with micro-frontends, .NET microservices and Azure. I work AI-first and spec-driven. |
| `meta.about.description` | Software Solutions Engineer · AI-First: mi carrera, lo que sé y dónde lo apliqué. | Software Solutions Engineer · AI-First: my career, what I know and where I applied it. |
| `meta.services.description` | Arquitectura, desarrollo y modernización: micro-frontends, microservicios .NET y Azure, con decisiones documentadas. | Architecture, development and modernization: micro-frontends, .NET microservices and Azure, with documented decisions. |
| `meta.portfolio.description` | Casos de estudio: Synergos, agentes de IA en paralelo, un arnés de agentes y un puente de eventos entre nubes, más mis proyectos de 2022–2023. | Case studies: Synergos, parallel AI agents, an agent harness and an event bridge between clouds, plus my 2022–2023 projects. |
| `meta.contact.description` | Escríbeme: te respondo en menos de 48 horas. | Write to me: I'll reply within 48 hours. |

## §2 Chip de disponibilidad

```ts
profile: {
  availability: {
    location: { es: 'Armenia, Colombia', en: 'Armenia, Colombia' },
    timezone: 'UTC−5',
    relocation: { es: 'Abierto a reubicación', en: 'Open to relocation' },
  },
},
```

| Clave | ES | EN |
|---|---|---|
| `profile.availability.label` (nombre accesible) | Disponibilidad: {location} · {timezone} · {relocation} | Availability: {location} · {timezone} · {relocation} |

## §3 Descargar CV **[P-406]**

```ts
profile: {
  cv: { href: '/Camilo_Hernandez_CV.pdf', bytes: 172753, lang: 'en' },
},
```

El peso que se muestra se calcula desde `bytes` (≈ 169 KB).

| Clave | ES | EN |
|---|---|---|
| `cv.download` | Descargar CV (PDF en inglés, {size}) | Download CV (PDF, {size}) |
| `cv.palette` | Descargar mi CV (PDF) | Download my CV (PDF) |
| `cv.keywords` | cv hoja de vida curriculum pdf descargar | cv resume curriculum pdf download |

## §4 Portafolio: intro, orden y épocas

```ts
portfolio: {
  intro: [
    {
      es: 'Aquí está mi camino completo. Los proyectos de 2022 y 2023 son de cuando aprendía frontend en bootcamps: los dejo porque muestran de dónde vengo. Los más recientes, como Synergos y este mismo sitio, muestran cómo trabajo hoy: arquitectura primero, especificación antes del código y agentes de IA bajo mi revisión.',
      en: 'This is my full path. The 2022 and 2023 projects come from when I was learning frontend in bootcamps: I keep them because they show where I started. The newest ones, like Synergos and this site, show how I work today: architecture first, spec before code and AI agents under my review.',
    },
  ],
  footer: { es: '¡Y muchos más por venir!', en: 'And many more to come!' },
},
```

Orden propuesto (`order`) y época (`era`). Los proyectos de 2022–2023 conservan su orden relativo de hoy, porque los
datos no tienen fechas.

| `order` | `id` | Proyecto | `era` |
|---:|---|---|---|
| 1 | `12` | Synergos | `2024-2026` |
| 2 | `13` | Director & lines: parallel AI agents | `2024-2026` |
| 3 | `2` | CHERCED-WORLD 2026 | `2024-2026` |
| 4 | `14` | Legal workspace | `2024-2026` |
| 5 | `15` | Event bridge: AWS → Azure | `2024-2026` |
| 6 | `1` | Quantic Theatrum | `2022-2023` |
| 7 | `3` | AIRLINE | `2022-2023` |
| 8 | `4` | Newman Club | `2022-2023` |
| 9 | `5` | CENTRIBAL | `2022-2023` |
| 10 | `6` | My Website | `2022-2023` |
| 11 | `7` | E-Shop | `2022-2023` |
| 12 | `8` | GET IT DONE | `2022-2023` |
| 13 | `9` | Studio Ghibli Tracking System | `2022-2023` |
| 14 | `10` | Studio Ghibli BackOffice | `2022-2023` |
| 15 | `11` | BookingUI system | `2022-2023` |

| Clave (`site.json`) | ES | EN |
|---|---|---|
| `portfolio.era` | Época | Period |
| `portfolio.era.2024-2026` | 2024–2026 | 2024–2026 |
| `portfolio.era.2022-2023` | 2022–2023 | 2022–2023 |
| `portfolio.filteredEra` | {count} proyectos de {era} | {count} projects from {era} |
| `portfolio.clearFilters` | Quitar filtros | Clear filters |

## §5 Servicios

`services.intro` no cambia.

```ts
items: [
  {
    id: 'architecture',
    title: { es: 'Arquitectura', en: 'Architecture' },
    description: {
      es: 'Diseño la arquitectura de tu producto: micro-frontends, microservicios o una plataforma composable, con decisiones documentadas y una especificación clara antes de construir.',
      en: 'I design your product architecture: micro-frontends, microservices or a composable platform, with documented decisions and a clear spec before building.',
    },
    icon: '/assets/icons/services/architecture.png',
  },
  {
    id: 'development',
    title: { es: 'Desarrollo', en: 'Development' },
    description: {
      es: 'Construyo frontend y backend de punta a punta con Angular, .NET y Azure: interfaces accesibles, servicios que escalan e integraciones por eventos.',
      en: 'I build frontend and backend end to end with Angular, .NET and Azure: accessible interfaces, services that scale and event-driven integrations.',
    },
    icon: '/assets/icons/services/development.png',
  },
  {
    id: 'modernization',
    title: { es: 'Modernización', en: 'Modernization' },
    description: {
      es: 'Migro sistemas legados por partes, sin detener la operación, y dejo una base que el equipo puede mantener.',
      en: 'I migrate legacy systems step by step, without stopping the business, and leave a codebase the team can maintain.',
    },
    icon: '/assets/icons/services/modernization.png',
  },
],
```

Los íconos `architecture` y `modernization` son nuevos, del mismo estilo que los actuales. `development` se queda.

| Clave (`site.json`) | ES | EN |
|---|---|---|
| `meta.services.description` | ver §1 | ver §1 |

## §6 "Quién soy"

```ts
about: {
  description: {
    es: 'Soy Camilo, Software Solutions Engineer. Diseño plataformas donde agregar el siguiente negocio no cuesta lo mismo que el primero: micro-frontends, microservicios .NET, sagas y un CMS que compone. En fintech trabajo de punta a punta y lidero migraciones de legado. En Synergos dirijo un equipo de agentes de IA que construye en paralelo bajo reglas de arquitectura que rompen el build si alguien las viola.',
    en: "I'm Camilo, a Software Solutions Engineer. I design platforms where adding the next business doesn't cost as much as the first: micro-frontends, .NET microservices, sagas and a CMS that composes. In fintech I work end to end and lead legacy migrations. In Synergos I direct a team of AI agents that builds in parallel under architecture rules that break the build if anyone violates them.",
  },
},
```

## §7 Carrera y formación

### §7.1 Growup IT (FR-410)

```ts
{
  id: 'growup-it',
  company: 'Growup IT',
  role: { es: 'Frontend Web Developer', en: 'Frontend Web Developer' },
  start: '2019-01',
  end: '2019-11',
  description: {
    es: 'Refactoricé el portal de pago de impuestos de una entidad pública (PHP, HTML, JavaScript): optimicé recursos y la composición de las páginas y subí su puntaje de rendimiento en Lighthouse en unos 40 puntos. Me encargué de la arquitectura y el empaquetado del proyecto, e introduje desarrollo por componentes.',
    en: "I refactored a public entity's tax-payment portal (PHP, HTML, JavaScript): I optimized assets and page composition and raised its Lighthouse performance score by about 40 points. I owned the project's architecture and packaging, and introduced component-based development.",
  },
},
```

### §7.2 Newshore (FR-411)

```ts
role: { es: 'Frontend Web Developer', en: 'Frontend Web Developer' },
```

### §7.3 Platzi Master (FR-412)

```ts
company: 'Platzi',
role: { es: 'Frontend Web Developer – Platzi Master [CX]', en: 'Frontend Web Developer – Platzi Master [CX]' },
```

### §7.4 FLYR (FR-413)

```ts
description: {
  es: 'Pasé de las cuentas de clientes al producto core: la plataforma de retail aéreo de la que se extiende cada aerolínea. Lideré la arquitectura de los módulos de Check-in y Manage My Booking, desplegados en más de 3 aerolíneas internacionales, construí componentes seguros de checkout en Angular para el módulo PCI y trabajé en un proyecto de redención de vouchers para una aerolínea.',
  en: 'I moved from client accounts to the core product: the airline retailing platform every airline account extends from. I led the architecture of the Check-in and Manage My Booking modules, deployed across 3+ international airlines, built secure Angular checkout components for the PCI module and worked on a voucher redemption project for an airline.',
},
```

### §7.5 Synergos Labs (FR-414)

Las cifras salen de la fuente única de §11.1.

```ts
description: {
  es: 'Proyecto propio. Diseño y construyo Synergos, una plataforma de composición donde el octavo vertical de negocio cuesta menos que el primero: 31 piezas desplegables (un CMS, 20 capacidades, 9 orquestadores y un proxy), más de 2.300 tests automatizados y más de 130 decisiones de arquitectura documentadas. Dirijo un equipo de agentes de IA que construye en paralelo bajo mis reglas.',
  en: 'Personal project. I design and build Synergos, a composition platform where the eighth business vertical costs less than the first: 31 deployable pieces (a CMS, 20 capabilities, 9 orchestrators and a proxy), 2,300+ automated tests and 130+ documented architecture decisions. I direct a team of AI agents that builds in parallel under my rules.',
},
```

### §7.6 Squadra Arquitectura (FR-415)

```ts
role: { es: 'Founder & Business Manager', en: 'Founder & Business Manager' },
description: {
  es: 'Fundé y dirigí una empresa de habilitación hospitalaria y obra civil: gestioné y supervisé proyectos de construcción, negocié con clientes y proveedores, y representé a la empresa en licitaciones públicas.',
  en: 'I founded and ran a company focused on hospital facility compliance and civil works: I managed and supervised construction projects, negotiated with clients and suppliers, and represented the company in public tenders.',
},
```

### §7.7 Educación: 140+ cursos (FR-417)

Reemplaza el nombre de la entrada "Y otras escuelas" de `courses.schools`. Su descripción se queda.

```ts
name: {
  es: 'Y más de 140 cursos certificados de desarrollo de software',
  en: 'And 140+ certified software development courses',
},
```

### §7.8 Tabla de verificación contra la fuente de verdad del perfil

| Entrada | Campo | Hoy en `site.ts` | Fuente de verdad | Requisito |
|---|---|---|---|---|
| `sistecredito-ai-first` | rol y fechas | Software Solutions Engineer · AI-First, 2026-02 – hoy | igual | FR-418 (fijar) |
| `sistecredito-dev-solutions` | rol y fechas | Development Solutions Engineer, 2025-03 – 2026-02 | igual | FR-418 (fijar) |
| `synergos-labs` | rol y fechas | Founder & Software Architect, 2024-02 – hoy | igual | FR-418 (fijar) |
| `synergos-labs` | descripción | "más de 30 componentes… más de 3 frameworks" | escala actual (§7.5) | FR-414 |
| `flyr` | rol y fechas | Frontend Web Developer, 2023-03 – 2025-03 | igual | FR-418 (fijar) |
| `flyr` | descripción | sin el módulo PCI explícito y sin la redención de vouchers | ambos son logros públicos | FR-413 |
| `newshore` | empresa y fechas | Newshore (a FLYR Labs company), 2022-07 – 2023-03 | igual | FR-418 (fijar) |
| `newshore` | rol | Frontend Developer / Desarrollador Frontend | Frontend Web Developer | FR-411 |
| `platzi-master` | fechas | 2022-03 – 2022-06 | igual | FR-418 (fijar) |
| `platzi-master` | empresa y rol | Platzi Master [CX]; Frontend Developer | Platzi; Frontend Web Developer – Platzi Master [CX] | FR-412 |
| `growup-it` | fechas | 2019-01 – 2019-11 | igual | FR-418 (fijar) |
| `growup-it` | rol | Frontend Developer / Desarrollador Frontend | Frontend Web Developer | FR-410 |
| `growup-it` | descripción | sitio de una empresa de servicios comerciales | portal de pago de impuestos de una entidad pública, unos 40 puntos más en Lighthouse | FR-410 |
| `squadra-arquitectura` | fechas | 2016-10 – 2020-05 | igual | FR-418 (fijar) |
| `squadra-arquitectura` | rol en ES | Fundador y gerente | Founder & Business Manager | FR-415 |
| `squadra-arquitectura` | descripción | arquitectura hospitalaria | habilitación hospitalaria y obra civil | FR-415 |
| `eam` | fechas y título | 2013 – 2017, con honores, énfasis en Creación de Empresas | igual | FR-418 (fijar). El handoff decía que el sitio mostraba 2011–2016: ya está corregido |
| `unad` | fechas y título | 2020-06 – 2023-11, estudios no finalizados | 2020 – 2023, coursework not completed | FR-418 (fijar) |
| `platzi` | fechas | 2018 – 2022 | igual | FR-418 (fijar) |
| Fundamentos de Arquitectura | fecha | nov 2025 | igual | FR-418 (fijar) |
| Cursos | 140+ certificados | no aparece | 140+ cursos certificados (Platzi) | FR-417 |
| Idiomas | niveles | ES 100, EN 65 | nativo; B1–B2, 65 en las barras | FR-418 (fijar) |
| Contacto | correo, LinkedIn, GitHub | chernandezcediel@gmail.com, /in/cherced, CHERCED-DEV | igual | FR-418 (fijar) |
| Ubicación pública | — | no aparece | Armenia, Colombia · abierto a relocation | FR-419 / FR-463 |
| Instagram | — | aparece | no figura como contacto público | P-409 |

## §8 Lo que sé: lóbulos **[P-401, P-407]**

### §8.1 Skills nuevas o que cambian

Estado: **nueva**, **cambia** (nombre o nivel), **se mueve** (de lóbulo) o **igual**. Las skills nuevas no se publican
hasta que el autor confirme su nivel.

| Lóbulo | `id` | `name` | Hoy | Propuesto | Estado |
|---|---|---|---:|---:|---|
| Arquitectura | `composable-architecture` | COMPOSABLE ARCHITECTURE | — | 92 | nueva |
| Arquitectura | `micro-frontends` | MICRO-FRONTENDS | 90 | 90 | igual |
| Arquitectura | `service-decomposition` | SERVICE DECOMPOSITION · BOUNDED CONTEXTS | — | 85 | nueva |
| Arquitectura | `saga` | SAGA · COMPENSATING TRANSACTIONS | — | 85 | nueva |
| Arquitectura | `idempotency` | IDEMPOTENCY | — | 85 | nueva |
| Arquitectura | `event-driven` | EVENT-DRIVEN ARCHITECTURE | — | 78 | nueva |
| Arquitectura | `bff` | BACKEND FOR FRONTEND | — | 85 | nueva |
| Arquitectura | `fitness-functions` | FITNESS FUNCTIONS · ARCHITECTURE TESTS | — | 88 | nueva |
| Arquitectura | `contract-testing` | CONTRACT TESTING | — | 82 | nueva |
| Arquitectura | `adr` | ADR · TECHNICAL GOVERNANCE | — | 90 | nueva |
| Arquitectura | `legacy-modernization` | LEGACY MODERNIZATION | — | 80 | nueva |
| Arquitectura | `clean-architecture-solid` | CLEAN ARCHITECTURE · SOLID | — | 88 | nueva |
| Backend y nube | `dotnet` | .NET 8 · ASP.NET CORE | 85 (".NET") | 88 | cambia |
| Backend y nube | `csharp` | C# | 82 | 85 | cambia |
| Backend y nube | `umbraco` | UMBRACO 13 | 85 ("UMBRACO") | 90 | cambia |
| Backend y nube | `grpc` | GRPC | — | 75 | nueva |
| Backend y nube | `azure-service-bus` | AZURE SERVICE BUS | — | 75 | nueva |
| Backend y nube | `azure` | AZURE | 78 | 78 | igual |
| Backend y nube | `docker` | DOCKER · COMPOSE | — | 80 | nueva |
| Backend y nube | `github-actions` | GITHUB ACTIONS · CI/CD | — | 85 | nueva |
| Backend y nube | `cloudflare-workers` | CLOUDFLARE WORKERS · CDN | — | 75 | nueva |
| Backend y nube | `testing-dotnet` | XUNIT · NSUBSTITUTE · BENCHMARKDOTNET | — | 80 | nueva |
| Frontend | `angular` | ANGULAR | 92 | 92 | igual |
| Frontend | `typescript` | TYPESCRIPT | 92 | 92 | igual |
| Frontend | `web-components` | WEB COMPONENTS · CUSTOM ELEMENTS | — | 88 | nueva |
| Frontend | `native-federation` | NATIVE FEDERATION | 88 (en Arquitectura) | 88 | se mueve |
| Frontend | `nx` | NX MONOREPOS | — | 85 | nueva |
| Frontend | `ssr` | SSR · RAZOR · HYDRATION | — | 85 | nueva |
| Frontend | `design-tokens` | DESIGN SYSTEMS · TOKENS · THEMING | — | 85 | nueva |
| Frontend | `nextjs` | NEXT.JS · REACT | — | 72 | nueva |
| Frontend | `css-sass` | CSS · SASS | 92 (CSS) y 90 (SASS) | 92 | junta dos **[P-407]** |
| Frontend | `a11y` | ACCESSIBILITY · WCAG | — | 82 | nueva |
| Frontend | `vitest-playwright` | VITEST · PLAYWRIGHT | — | 78 | nueva |
| IA aplicada | `multi-agent-orchestration` | MULTI-AGENT ORCHESTRATION | — | 90 | nueva |
| IA aplicada | `spec-driven-development` | SPEC-DRIVEN DEVELOPMENT · SPEC KIT | 90 (en Arquitectura) | 92 | se mueve y cambia |
| IA aplicada | `claude-code` | CLAUDE CODE · AGENT SKILLS | — | 92 | nueva |
| IA aplicada | `mcp` | MCP | — | 75 | nueva |
| IA aplicada | `evals` | LLM EVALS · GUARDRAILS | — | 75 | nueva |
| IA aplicada | `context-engineering` | CONTEXT ENGINEERING | — | 85 | nueva |
| Oficio | `es`, `en`, `git` | — | 100, 65, 85 | sin cambio | igual |

Skills de hoy que no están en la propuesta y se quedan mientras P-407 siga abierta: `html5` (90) y `javascript` (90)
en Frontend, y `ai-coding-agents` (90) en IA aplicada. "Aprendiendo ahora" no cambia (002, T225).

### §8.2 Composición de cada lóbulo

```ts
lobes: [
  {
    id: 'frontend',
    name: { es: 'Frontend', en: 'Frontend' },
    skills: ['angular', 'typescript', 'web-components', 'native-federation', 'nx', 'ssr', 'design-tokens', 'nextjs', 'css-sass', 'a11y', 'vitest-playwright'],
    sources: ['platziMaster', 'fullStackJs', 'nextjs'],
    applied: ['career:flyr', 'career:newshore', 'career:sistecredito-ai-first', 'career:platzi-master', 'project:12'],
  },
  {
    id: 'architecture',
    name: { es: 'Arquitectura', en: 'Architecture' },
    skills: ['composable-architecture', 'micro-frontends', 'service-decomposition', 'saga', 'idempotency', 'event-driven', 'bff', 'fitness-functions', 'contract-testing', 'adr', 'legacy-modernization', 'clean-architecture-solid'],
    sources: ['architecture', 'unad'],
    applied: ['career:sistecredito-ai-first', 'career:flyr', 'project:12'],
  },
  {
    id: 'backend-cloud',
    name: { es: 'Backend y nube', en: 'Backend & cloud' },
    skills: ['dotnet', 'csharp', 'umbraco', 'grpc', 'azure-service-bus', 'azure', 'docker', 'github-actions', 'cloudflare-workers', 'testing-dotnet'],
    sources: ['fullStackJs', 'unad'],
    applied: ['career:sistecredito-ai-first', 'career:flyr', 'career:newshore', 'project:12'],
  },
  {
    id: 'applied-ai',
    name: { es: 'IA aplicada', en: 'Applied AI' },
    skills: ['multi-agent-orchestration', 'spec-driven-development', 'claude-code', 'mcp', 'evals', 'context-engineering'],
    sources: ['architecture'],
    applied: ['career:sistecredito-ai-first', 'project:12', 'project:13', 'project:14', 'project:2'],
  },
  {
    id: 'craft',
    name: { es: 'Oficio', en: 'Craft' },
    skills: ['es', 'en', 'git'],
    sources: ['eam', 'unad'],
    applied: ['career:squadra-arquitectura'],
    projects: ['12', '2'],
  },
],
```

Mientras P-407 siga abierta, `html5` y `javascript` se agregan al final de Frontend y `ai-coding-agents`, al final de
IA aplicada. Mientras P-401 siga abierta, las skills nuevas salen de estas listas.

### §8.3 Etiquetas del mapa

| Clave (`site.json`) | ES | EN |
|---|---|---|
| `about.brain.applied` | Dónde lo apliqué | Where I applied it |
| `about.brain.appliedWord` | aplicado en | applied at |
| `about.brain.sources` (se queda) | Dónde lo aprendí | Where I learned it |
| `about.principles` | Principios | Principles |

### §8.4 Cómo se muestra "dónde lo apliqué"

Cada referencia `career:<id>` se muestra con el nombre de su empresa y `project:<id>` con el título del proyecto, que
enlaza a su caso. Si dos entradas son de la misma empresa, se muestra una sola vez.

### §8.5 Proyectos del lóbulo

El cruce por tecnología con `projects.ts` se queda. `projects` suma proyectos explícitos; en Oficio son Synergos y
CHERCED-WORLD 2026.

### §8.6 Principios (FR-433)

```ts
principles: [
  {
    short: { es: 'Atomicidad', en: 'Atomicity' },
    full: { es: 'Atomicidad: una pieza puede rechazar sola y es dueña de su almacén.', en: 'Atomicity: a piece can reject on its own and owns its store.' },
  },
  {
    short: { es: 'Convenciones que rompen el build', en: 'Conventions that break the build' },
    full: { es: 'Una convención que no rompe el build no existe.', en: "A convention that doesn't break the build doesn't exist." },
  },
  {
    short: { es: 'Gates que se prueban fallando', en: 'Gates proven to fail' },
    full: { es: 'Un gate que nunca falló no vigila nada.', en: "A gate that never failed isn't watching anything." },
  },
  {
    short: { es: 'Especificación antes que código', en: 'Spec before code' },
    full: { es: 'La especificación antes que el código.', en: 'Spec before code.' },
  },
  {
    short: { es: 'Código para humanos', en: 'Code for humans' },
    full: { es: 'Código para que lo lean humanos, aunque lo escriba un agente.', en: 'Code for humans to read, even when an agent writes it.' },
  },
],
```

## §9 "Mis habilidades, en palabras" (FR-434)

Al párrafo de Frontend se le quitó la cifra del empleador.

```ts
inWords: {
  frontend: {
    es: 'Angular es mi casa desde 2022. Construyo interfaces pixel-perfect y accesibles, y hoy mantengo micro-frontends sobre Native Federation.',
    en: 'Angular has been home since 2022. I build pixel-perfect, accessible interfaces, and today I maintain micro-frontends on Native Federation.',
  },
  architecture: {
    es: 'Pienso en piezas con límites claros: micro-frontends, microservicios y componentes composables que crecen sin romperse. Escribo la especificación antes del código y documento las decisiones.',
    en: 'I think in pieces with clear boundaries: micro-frontends, microservices and composable components that grow without breaking. I write the spec before the code and document the decisions.',
  },
  'backend-cloud': {
    es: 'Construyo microservicios .NET con gRPC, conecto sistemas con colas en Azure Service Bus y uso Umbraco como capa de composición.',
    en: 'I build .NET microservices with gRPC, connect systems through Azure Service Bus queues and use Umbraco as a composition layer.',
  },
  'applied-ai': {
    es: 'Trabajo AI-first: los agentes investigan, generan, revisan y documentan; yo diseño, decido y valido. La IA amplifica la ingeniería, no la reemplaza.',
    en: 'I work AI-first: agents research, scaffold, review and document; I design, decide and validate. AI amplifies engineering; it does not replace it.',
  },
  craft: {
    es: 'Antes de programar fui administrador de empresas y fundé una compañía. Por eso pienso en el negocio y en las personas detrás de cada sistema.',
    en: 'Before coding, I was a business administrator and founded a company. That is why I think about the business and the people behind every system.',
  },
},
```

## §10 "En cifras" (FR-436)

`years` se calcula como hoy. Las otras tres leen la fuente de §11.1. Los números se formatean según el idioma:
"2.300+" en ES y "2,300+" en EN.

| `id` | Valor | Clave de etiqueta | ES | EN | Clave de nota | ES | EN |
|---|---|---|---|---|---|---|---|
| `years` | calculado (hoy, 7+) **[P-402]** | `about.figure.years` | años construyendo para la web | years building for the web | `about.figure.yearsNote` | desde {year} | since {year} |
| `pieces` | 31 | `about.figure.pieces` | piezas desplegables en Synergos | deployable pieces in Synergos | `about.figure.piecesNote` | CMS · 20 capacidades · 9 orquestadores | CMS · 20 capabilities · 9 orchestrators |
| `adrs` | 130+ | `about.figure.adrs` | decisiones de arquitectura escritas | architecture decisions on record | `about.figure.adrsNote` | ADRs | ADRs |
| `tests` | 2.300+ | `about.figure.tests` | tests automatizados | automated tests | `about.figure.testsNote` | incluidos gates de arquitectura | including architecture gates |

Salen `about.figure.projects`, `about.figure.technologies`, `about.figure.airlines` y `about.figure.airlinesNote`.

## §11 Caso de estudio: Synergos (`id: '12'`)

### §11.1 Fuente única de cifras (FR-441)

```ts
export const synergosFacts = {
  countedAt: '2026-11-01',
  pieces: 31,
  capabilities: 20,
  orchestrators: 9,
  measuredAt: '2026-08-06',
  testsAtLeast: 2300,
  adrsAtLeast: 130,
  designSystemAtLeast: 130,
} as const
```

### §11.2 Caso

```ts
{
  id: '12',
  title: 'Synergos',
  era: '2024-2026',
  summary: {
    es: 'Una plataforma de composición donde el octavo vertical de negocio cuesta menos que el primero.',
    en: 'A composition platform where the eighth business vertical costs less than the first.',
  },
  context: {
    es: 'Cada negocio reconstruye las mismas piezas: agenda, catálogo, carrito, pagos, notificaciones. La salida fácil, un servicio por vertical, multiplica el código y hace que cada vertical nuevo cueste lo mismo que el primero. Quería un solo núcleo que sirviera a salud, tienda, eventos, viajes, inmobiliaria, gobierno, academia y social sin ramificarse.',
    en: 'Every business rebuilds the same pieces: scheduling, catalog, cart, payments, notifications. The easy way out, one service per vertical, multiplies the code and makes every new vertical cost as much as the first. I wanted one core that could serve health, retail, events, travel, real estate, government, education and social without branching.',
  },
  role: {
    es: 'Fundador y arquitecto. Diseño cada pieza, tomo las decisiones de arquitectura y dirijo un equipo de agentes de IA que construye en paralelo bajo mis reglas.',
    en: 'Founder and architect. I design every piece, make the architecture decisions and direct a team of AI agents that builds in parallel under my rules.',
  },
  decisions: {
    es: 'Partir el backend por atomicidad, no por dominio: 20 capacidades que no saben de negocios. Booking sabe de "recurso, ventana y cupo"; no sabe que el recurso es un médico. Orquestadores de saga por vertical, con la compensación tratada como dato. Las reglas de arquitectura son tests que rompen el build. El design system sale por CDN como custom elements, así que lo que cruza la frontera es DOM, no framework.',
    en: 'Split the backend by atomicity, not by domain: 20 capabilities that know nothing about any business. Booking knows "resource, window and slot"; it does not know the resource is a doctor. Saga orchestrators per vertical, with compensation treated as data. Architecture rules are tests that break the build. The design system ships through a CDN as custom elements, so what crosses the boundary is DOM, not a framework.',
  },
  result: {
    es: '31 piezas desplegables: un CMS, 20 capacidades, 9 orquestadores y un proxy. El tercer y el cuarto orquestador entraron sin una sola capacidad nueva. Más de 2.300 tests automatizados, más de 130 decisiones de arquitectura documentadas y un design system de más de 130 elementos en CDN propio.',
    en: '31 deployable pieces: a CMS, 20 capabilities, 9 orchestrators and a proxy. The third and fourth orchestrators shipped without a single new capability. 2,300+ automated tests, 130+ documented architecture decisions and a design system of 130+ elements on its own CDN.',
  },
  technologies: ['.NET 8', 'C#', 'ASP.NET CORE', 'UMBRACO 13', 'ANGULAR', 'WEB COMPONENTS', 'NX', 'CLOUDFLARE WORKERS', 'DOCKER', 'GITHUB ACTIONS', 'SPEC KIT', 'AI CODING AGENTS'],
  links: { live: null, github: null },
  highlights: [
    { es: '31 piezas desplegables: un CMS, 20 capacidades, 9 orquestadores y un proxy', en: '31 deployable pieces: a CMS, 20 capabilities, 9 orchestrators and a proxy' },
    { es: 'El tercer y el cuarto orquestador entraron sin una sola capacidad nueva', en: 'The third and fourth orchestrators shipped without a single new capability' },
    { es: 'Más de 2.300 tests automatizados, incluidos gates de arquitectura', en: '2,300+ automated tests, including architecture gates' },
    { es: 'Más de 130 decisiones de arquitectura documentadas', en: '130+ documented architecture decisions' },
    { es: 'Un design system de más de 130 elementos en CDN propio', en: 'A design system of 130+ elements on its own CDN' },
  ],
}
```

`image` se queda: el diagrama actual por capas (`/assets/imgs/projects/synergos.svg`).

### §11.3 Tarjetas ADR (FR-442)

```ts
adrCards: [
  {
    decision: { es: 'Capacidades agnósticas del dominio', en: 'Domain-agnostic capabilities' },
    why: { es: 'Que el vertical nuevo no cueste lo mismo que el primero.', en: "So a new vertical doesn't cost as much as the first one." },
    tradeoff: { es: 'Las referencias externas viajan como pares opacos (Kind, Id), sin ramificar.', en: 'External references travel as opaque (Kind, Id) pairs, never branched on.' },
  },
  {
    decision: { es: 'La compensación es dato, no función', en: 'Compensation is data, not a function' },
    why: { es: 'Una reserva no se deshace igual que un apartado.', en: "A booking isn't undone the same way as a hold." },
    tradeoff: { es: 'Hay que reescribir la compensación cada vez que cambia el estado.', en: 'Compensation must be rewritten every time the state changes.' },
  },
  {
    decision: { es: 'Reglas de arquitectura como tests', en: 'Architecture rules as tests' },
    why: { es: 'Una convención escrita se olvida; una que rompe el build se cumple.', en: 'A written convention gets forgotten; one that breaks the build gets followed.' },
    tradeoff: { es: 'Cada gate se muta antes de confiar en él: un gate que nunca falló no vigila nada.', en: "Every gate is mutated before it's trusted: a gate that never failed isn't watching anything." },
  },
  {
    decision: { es: 'Correlación propia, sin OpenTelemetry por ahora', en: 'Own correlation ID, no OpenTelemetry for now' },
    why: { es: 'Un identificador viaja por seis servicios y sale en cada línea de log.', en: 'One ID travels through six services and shows up in every log line.' },
    tradeoff: { es: 'Decisión documentada, con el disparador que la haría cambiar.', en: 'Documented decision, with the trigger that would change it.' },
  },
],
```

| Clave (`site.json`) | ES | EN |
|---|---|---|
| `project.adr.decision` | Decisión | Decision |
| `project.adr.why` | Por qué | Why |
| `project.adr.tradeoff` | Trade-off | Trade-off |

### §11.4 Diagrama vivo (FR-445)

```ts
diagram: [
  {
    id: 'cdn',
    label: { es: 'CDN', en: 'CDN' },
    role: {
      es: 'Sirve los recursos que alimentan la composición y el design system como custom elements.',
      en: 'Serves the resources that feed the composition, and the design system as custom elements.',
    },
  },
  {
    id: 'umbraco',
    label: { es: 'Umbraco (.NET)', en: 'Umbraco (.NET)' },
    role: {
      es: 'La capa de composición: arma cada página con renderizado en servidor.',
      en: 'The composition layer: it assembles each page with server-side rendering.',
    },
  },
  {
    id: 'micro-frontends',
    label: { es: 'Micro-frontends · Web Components', en: 'Micro-frontends · Web Components' },
    role: {
      es: 'La interfaz: lo que cruza la frontera es DOM, no framework, así que funciona en cualquier framework web.',
      en: 'The interface: what crosses the boundary is DOM, not a framework, so it works on any web framework.',
    },
  },
],
```

| Clave (`portfolio.json`) | ES | EN |
|---|---|---|
| `case.diagram.title` | Cómo encajan las capas | How the layers fit |
| `case.diagram.hint` | Pasa el puntero o enfoca una capa para ver su rol. | Hover or focus a layer to see its role. |

## §12 Caso nuevo: Director & lines (`id: '13'`)

```ts
{
  id: '13',
  title: 'Director & lines: parallel AI agents',
  era: '2024-2026',
  summary: {
    es: 'El modelo con el que varios agentes de IA construyen Synergos a la vez sin pisarse y sin perder la traza.',
    en: 'The model that lets several AI agents build Synergos at the same time without colliding or losing the trail.',
  },
  context: {
    es: 'Un solo agente no alcanza para 14 líneas de trabajo: núcleo, producción y cada vertical. Varios agentes a la vez se pisan, rompen lo compartido y toman decisiones que no les tocan.',
    en: "One agent isn't enough for 14 workstreams: core, production and every vertical. Several agents at once collide, break shared code and make decisions that aren't theirs to make.",
  },
  role: {
    es: 'Diseñé el modelo y soy el arquitecto: decido lo que solo yo puedo decidir y valido lo que entregan.',
    en: 'I designed the model and I am the architect: I decide what only I can decide and validate what they deliver.',
  },
  decisions: {
    es: 'Una sesión "director" integra y es la única que toca lo compartido. Cada "línea" trabaja solo en su worktree de git, su rama y su carpeta de spec. Todas cargan la misma constitución y siguen Spec Kit: specify, clarify, plan, tasks, analyze y luego implement. Las preguntas de arquitectura llegan en lotes con una recomendación; mi respuesta queda escrita y manda sobre cualquier supuesto.',
    en: 'A "director" session integrates and is the only one that touches shared code. Each "line" works only in its own git worktree, branch and spec folder. All of them load the same constitution and follow Spec Kit: specify, clarify, plan, tasks, analyze, then implement. Architecture questions reach me in batches with a recommendation; my answer is written down and overrides any assumption.',
  },
  result: {
    es: 'Cada tarea queda trazada a su commit y a la bitácora de su línea. Entre octubre y noviembre de 2026 resolví 19 lotes de decisiones, incluida la salida a producción.',
    en: 'Every task is traced to its commit and its line log. Between October and November 2026 I resolved 19 decision batches, including the move to production.',
  },
  technologies: ['CLAUDE CODE', 'SPEC KIT', 'GIT WORKTREES', 'AI CODING AGENTS', 'ADR'],
  image: {
    src: '/assets/imgs/projects/director-lines.svg',
    alt: {
      es: 'Diagrama del modelo director y líneas: el arquitecto arriba, la sesión director al centro y las líneas como carriles paralelos que convergen en la rama principal',
      en: 'Director and lines diagram: the architect on top, the director session in the middle and the lines as parallel lanes that converge on the main branch',
    },
    width: 960,
    height: 640,
  },
  links: { live: null, github: null },
  highlights: [
    { es: 'Una sola sesión toca lo compartido; cada línea, solo su worktree', en: 'Only one session touches shared code; each line, only its own worktree' },
    { es: 'Cada tarea trazada a su commit y a la bitácora de su línea', en: 'Every task traced to its commit and its line log' },
    { es: '19 lotes de decisiones resueltos entre octubre y noviembre de 2026', en: '19 decision batches resolved between October and November 2026' },
  ],
}
```

## §13 Caso nuevo: Legal workspace (`id: '14'`)

Anonimizado: sin nombres, sin ciudad y sin nada del material del caso. Las tarjetas ADR quedan pendientes (P-408).

```ts
{
  id: '14',
  title: 'Legal workspace',
  era: '2024-2026',
  summary: {
    es: 'Un arnés de agentes que asiste a una abogada sin darle a la IA autoridad sobre el expediente.',
    en: 'An agent harness that assists a lawyer without giving the AI authority over the case file.',
  },
  context: {
    es: 'Una profesional del derecho necesitaba apoyo con expedientes y evidencia. El riesgo de la IA en ese mundo es inventar hechos o tratar una suposición como prueba.',
    en: 'A legal professional needed help with case files and evidence. The risk of AI in that world is inventing facts or treating an assumption as proof.',
  },
  role: {
    es: 'Diseñé la arquitectura, el plugin y los bancos de medición.',
    en: 'I designed the architecture, the plugin and the evaluation benches.',
  },
  decisions: {
    es: 'Una frontera de confianza: la persona, el agente y el LLM se tratan como no confiables y hablan por MCP con un núcleo que guarda el estado canónico, los originales y un log de auditoría. Nada se consolida sin revisión humana. Los métodos se miden con evaluaciones, y las reglas se comprueban capaces de fallar con mutantes.',
    en: 'A trust boundary: the person, the agent and the LLM are treated as untrusted and talk over MCP to a core that holds the canonical state, the originals and an audit log. Nothing is consolidated without human review. Methods are measured with evals, and rules are proven able to fail with mutants.',
  },
  result: {
    es: 'Un plugin instalable con su banco de evaluaciones en verde y 13 decisiones de arquitectura documentadas.',
    en: 'An installable plugin with a green evaluation bench and 13 documented architecture decisions.',
  },
  technologies: ['CLAUDE CODE', 'MCP', 'PYTHON', 'EVALS', 'AI AGENTS'],
  image: {
    src: '/assets/imgs/projects/legal-workspace.svg',
    alt: {
      es: 'Diagrama de la frontera de confianza: la persona, el agente y el LLM hablan por MCP con un núcleo que guarda el estado canónico, los originales y un log de auditoría',
      en: 'Trust boundary diagram: the person, the agent and the LLM talk over MCP to a core that holds the canonical state, the originals and an audit log',
    },
    width: 960,
    height: 640,
  },
  links: { live: null, github: null },
  highlights: [
    { es: 'Nada se consolida sin revisión humana', en: 'Nothing is consolidated without human review' },
    { es: 'Banco de evaluaciones en verde y reglas probadas con mutantes', en: 'A green evaluation bench and rules proven with mutants' },
    { es: '13 decisiones de arquitectura documentadas', en: '13 documented architecture decisions' },
  ],
}
```

## §14 Caso nuevo: Event bridge (`id: '15'`)

Anonimizado: sin el nombre del empleador, sin nombres internos y sin cifras de negocio. No lleva cifras de ningún tipo
(FR-444).

```ts
{
  id: '15',
  title: 'Event bridge: AWS → Azure',
  era: '2024-2026',
  summary: {
    es: 'Un pipeline de eventos que conecta una plataforma de contact center en AWS con microservicios .NET en Azure.',
    en: 'An event pipeline that connects a contact center platform on AWS with .NET microservices on Azure.',
  },
  context: {
    es: 'Los eventos de un contact center (llamadas, SMS y WhatsApp, entrantes y salientes) vivían en AWS, pero los sistemas que los necesitaban estaban en Azure. Había que llevarlos de una nube a la otra de forma confiable y sin acoplar los dos mundos.',
    en: 'Contact center events (calls, SMS and WhatsApp, inbound and outbound) lived on AWS, but the systems that needed them ran on Azure. They had to move reliably from one cloud to the other without coupling the two worlds.',
  },
  role: {
    es: 'Diseñé y construí el pipeline de punta a punta.',
    en: 'I designed and built the pipeline end to end.',
  },
  decisions: {
    es: 'AWS EventBridge como origen. Redpanda Connect con un pipeline en YAML para mapear y transformar los eventos. Azure Service Bus como frontera entre nubes, para desacoplar a productores y consumidores. Un microservicio .NET que escala horizontalmente para consumirlos.',
    en: 'AWS EventBridge as the source. Redpanda Connect with a YAML pipeline to map and transform the events. Azure Service Bus as the boundary between clouds, decoupling producers from consumers. A horizontally scalable .NET microservice to consume them.',
  },
  result: {
    es: 'Los eventos llegan a Azure desacoplados de su origen, y el consumidor escala según la carga.',
    en: 'Events reach Azure decoupled from their source, and the consumer scales with the load.',
  },
  technologies: ['AWS EVENTBRIDGE', 'REDPANDA CONNECT', 'AZURE SERVICE BUS', '.NET', 'C#', 'EVENT-DRIVEN ARCHITECTURE'],
  image: {
    src: '/assets/imgs/projects/event-bridge.svg',
    alt: {
      es: 'Diagrama del flujo de eventos: AWS EventBridge → Redpanda Connect → Azure Service Bus → microservicio .NET',
      en: 'Event flow diagram: AWS EventBridge → Redpanda Connect → Azure Service Bus → .NET microservice',
    },
    width: 960,
    height: 640,
  },
  links: { live: null, github: null },
  highlights: [
    { es: 'Azure Service Bus como frontera entre nubes', en: 'Azure Service Bus as the boundary between clouds' },
    { es: 'Productores y consumidores desacoplados', en: 'Producers and consumers decoupled' },
    { es: 'Un consumidor .NET que escala según la carga', en: 'A .NET consumer that scales with the load' },
  ],
}
```

## §15 Terminal `~/camilo/brain` (FR-461)

| Comando | Salida ES | Salida EN |
|---|---|---|
| `help` | Comandos: whoami · cat principles.md · ls projects/ · ls synergos/ · git log --oneline -1 · cat &lt;lóbulo&gt;.lobe · clear | Commands: whoami · cat principles.md · ls projects/ · ls synergos/ · git log --oneline -1 · cat &lt;lobe&gt;.lobe · clear |
| `whoami` | arquitecto · padre adoptivo de 20 capacidades · sobrino de Uncle Bob | architect · foster parent of 20 capabilities · Uncle Bob's nephew |
| `cat principles.md` | Los cinco `principles[].full` de §8.6, numerados del 1 al 5 | Same, in English |
| `ls projects/` | Generado desde `projects.ts` en el orden de §4: un `slug/` por proyecto, enlazado a su caso | Same |
| `ls synergos/` | `cms/  capabilities/ (20)  orchestrators/ (9)  proxy/  design-system/ (130+)  adr/ (130+)`, generado desde `synergosFacts` | Same |
| `git log --oneline -1` | feat(arquitecto): decidió salir a producción desde el celular | feat(architect): decided to ship to production from his phone |
| `clear` | (limpia la salida) | (clears the output) |
| desconocido | comando no encontrado: {cmd}. Prueba con help | command not found: {cmd}. Try help |

| Clave (`site.json`) | ES | EN |
|---|---|---|
| `about.terminal.input` | Escribe un comando | Type a command |
| `about.terminal.hint` | Escribe help y pulsa Enter. Tab completa el comando. | Type help and press Enter. Tab completes the command. |
| `about.terminal.output` | Salida del terminal | Terminal output |

Slugs de `ls projects/`, en el orden de §4: `synergos/`, `director-and-lines/`, `cherced-world-2026/`,
`legal-workspace/`, `event-bridge/`, `quantic-theatrum/`, `airline/`, `newman-club/`, `centribal/`, `my-website/`,
`e-shop/`, `get-it-done/`, `studio-ghibli-tracking-system/`, `studio-ghibli-backoffice/` y `bookingui-system/`.

## §16 Easter egg del footer (FR-462)

| Clave (`common.json`) | ES | EN |
|---|---|---|
| `footer.egg` | Officially Uncle Bob's nephew · SOLID runs in the family. (en inglés, con `lang="en"`) | Officially Uncle Bob's nephew · SOLID runs in the family. |

Traducción, solo si el autor la prefiere: "Sobrino oficial de Uncle Bob · SOLID viene de familia."

## §17 Copiar el correo (FR-464)

Se reusan `palette.copyEmail`, `palette.copied` y `palette.copyFailed` de `experience.json`. Claves nuevas en
`common.json`:

| Clave | ES | EN |
|---|---|---|
| `email.menu` | Opciones de correo | Email options |
| `email.write` | Escribirme un correo | Send me an email |
| `email.copy` | Copiar correo | Copy email |
| `email.copied` | Correo copiado ✓ | Email copied ✓ |

## §18 Paleta y atajos (FR-450 a FR-453)

| Clave (`experience.json`) | ES | EN |
|---|---|---|
| `palette.placeholder` | Busca páginas, proyectos, posts o habilidades. Escribe > para comandos | Search pages, projects, posts or skills. Type > for commands |
| `palette.group.skills` | Habilidades | Skills |
| `palette.group.commands` | Comandos | Commands |
| `palette.skillHint` | {lobe} · {level} % | {lobe} · {level}% |
| `palette.action.cv` | Descargar mi CV (PDF) | Download my CV (PDF) |
| `palette.action.shortcuts` | Ver los atajos de teclado | Show keyboard shortcuts |
| `palette.action.aiLab` (lo registra la 003) | Abrir el AI Lab | Open the AI Lab |
| `palette.action.listen` (lo registra la 005) | Escuchar este post | Listen to this post |
| `shortcuts.title` | Atajos de teclado | Keyboard shortcuts |
| `shortcuts.palette` | Abrir la paleta | Open the palette |
| `shortcuts.help` | Ver estos atajos | Show these shortcuts |
| `shortcuts.theme` | Cambiar el tema | Toggle the theme |
| `shortcuts.close` | Cerrar un diálogo | Close a dialog |
| `shortcuts.singleKey` | Atajos de una sola tecla (/, ? y t) | Single-key shortcuts (/, ? and t) |
| `shortcuts.on` | Activados | On |
| `shortcuts.off` | Desactivados | Off |

| Tecla | Acción |
|---|---|
| Ctrl/⌘ + K (ya existe) y `/` | Abrir la paleta |
| `?` | Ver los atajos |
| `t` | Cambiar el tema |
| Esc (ya existe) | Cerrar un diálogo |

Palabras clave de los comandos nuevos: `cv`, `hoja de vida`, `resume` y `curriculum` para el CV; `atajos`,
`shortcuts`, `teclado` y `keyboard` para los atajos.

## §19 Contacto (FR-480)

| Clave (`contact.json`) | ES | EN |
|---|---|---|
| `contact.success.text` | Gracias por escribirme. Te respondo en menos de 48 horas. | Thanks for reaching out. I'll reply within 48 hours. |
| `meta.contact.description` | ver §1 | ver §1 |

## §20 Checkbox de privacidad (FR-481)

La frase va completa en la etiqueta, y el enlace va aparte. Cambia la forma de `ConsentLabels`, que hoy parte la frase
en `before`, `link` y `after`.

| Clave (`common.json`) | ES | EN |
|---|---|---|
| `privacy.consent` | Autorizo el tratamiento de mis datos personales según la política de privacidad. | I authorize the processing of my personal data as described in the privacy policy. |
| `privacy.readPolicy` | Leer la política de privacidad | Read the privacy policy |

El aviso de pestaña nueva se reusa de `contact.newTab` y `a11y.newTab`.

## §21 Reacciones (FR-482 y FR-483)

| Clave (`blog.json`) | ES | EN |
|---|---|---|
| `reactions.title` | ¿Te sirvió? Reacciona con un clic | Did it help? React with one click |
| `reactions.clap` | Aplausos | Applause |
| `reactions.idea` | Me dio una idea | Gave me an idea |
| `reactions.fire` | Me encantó | Loved it |
| `reactions.count` | {reaction}: {count} | {reaction}: {count} |
| `reactions.rateLimited` | Reaccionaste varias veces seguidas. Intenta de nuevo en unos minutos. | You reacted several times in a row. Try again in a few minutes. |
| `reactions.unavailable` | Las reacciones no están disponibles en este momento. | Reactions aren't available right now. |

Nuevo valor de `privacy.technical.body` (`privacy.json`):

- **ES**: Para proteger los formularios y las reacciones del spam guardo durante unos minutos una huella cifrada de tu
  dirección IP, nunca la IP en sí. Las reacciones solo guardan contadores. En tu navegador solo quedan tus preferencias
  (idioma, tema, atajos de teclado y las reacciones que marcaste). No uso analítica ni cookies de seguimiento.
- **EN**: To protect the forms and reactions from spam, I keep a hashed fingerprint of your IP address for a few minutes,
  never the IP itself. Reactions only store counts. Your browser only keeps your preferences (language, theme, keyboard
  shortcuts and the reactions you marked). I use no analytics or tracking cookies.

`site.privacy.updatedAt` pasa a la fecha de publicación de la 004.

## §22 JSON-LD `Person` (FR-470)

La URL base sale de la configuración del sitio (`lib/site-url.ts`). `description` toma la meta description del idioma
de la página. No lleva correo ni teléfono.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "{base}/#person",
  "name": "Camilo Hernandez",
  "jobTitle": "Software Solutions Engineer",
  "description": "{meta.description}",
  "url": "{base}/",
  "image": "{base}/assets/imgs/about/retrato-oscuro.webp",
  "sameAs": ["https://www.linkedin.com/in/cherced/", "https://github.com/CHERCED-DEV"],
  "address": { "@type": "PostalAddress", "addressLocality": "Armenia", "addressCountry": "CO" },
  "alumniOf": { "@type": "CollegeOrUniversity", "name": "Institución Universitaria EAM" },
  "knowsAbout": ["Software architecture", "Microservices", "Micro-frontends", ".NET Core", "Angular"]
}
```

`knowsAbout` son las aptitudes principales que el autor dejó en LinkedIn.

## §23 Imágenes OG por sección (FR-471)

Plantilla común: 1200 × 630, fondo negro con la retícula y el destello en `#25ED9E` del sistema de diseño, Montserrat
y `cherced-world.vercel.app` abajo. El texto alternativo es "{título}: {línea}".

| Página | Título ES | Línea ES | Título EN | Línea EN |
|---|---|---|---|---|
| Home | Camilo Hernandez | DISEÑO SISTEMAS QUE ESCALAN | Camilo Hernandez | I DESIGN SYSTEMS THAT SCALE |
| Sobre mí | Sobre mí | Software Solutions Engineer · AI-First | About me | Software Solutions Engineer · AI-First |
| Servicios | Servicios | Arquitectura · Desarrollo · Modernización | Services | Architecture · Development · Modernization |
| Portafolio | Portafolio | {count} casos de estudio | Portfolio | {count} case studies |
| Contacto | Contacto | Armenia, Colombia · UTC−5 · Te respondo en menos de 48 h | Contact | Armenia, Colombia · UTC−5 · I reply within 48 h |
| Caso de estudio | {title} | {summary} | {title} | {summary} |

La 005 usa la misma plantilla para los posts.

## §24 `/now` (FR-490) **[P-404]**

Solo la estructura. El contenido lo da el autor.

```ts
export const now = {
  updatedAt: 'AAAA-MM-DD',
  building: [],
  learning: [],
  preparing: [],
}
```

| Clave (`site.json`) | ES | EN |
|---|---|---|
| `nowPage.title` | Ahora | Now |
| `nowPage.building` | Construyendo | Building |
| `nowPage.learning` | Aprendiendo | Learning |
| `nowPage.preparing` | Preparando | Preparing |
| `nowPage.updated` | Actualizado el {date} | Updated {date} |
| `meta.now.description` | Lo que estoy construyendo, aprendiendo y preparando este mes. | What I'm building, learning and preparing this month. |

Las claves van con el prefijo `nowPage.` porque `now.*` ya existe en `home.json` ("Ahora trabajo en").
