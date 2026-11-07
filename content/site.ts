import { formatFact, formatFloor, synergosFacts } from './synergos'
import type { Localized, SiteContent, SkillLobe } from './types'

export const authorPending = {
  'P-02': 'socials.facebook',
  'P-05': ['/assets/imgs/funnyPost.jpg', '/assets/imgs/pc-telefono-lado-izquierdo-fondo-negro_187299-25559.jpg'],
  'P-06': 'privacy',
} as const

export const site: SiteContent = {
  socials: [
    {
      id: 'linkedin',
      href: 'https://www.linkedin.com/in/cherced/',
      label: { es: 'LinkedIn de Camilo Hernández', en: "Camilo Hernández's LinkedIn" },
    },
    {
      id: 'instagram',
      href: 'https://www.instagram.com/cherced/',
      label: { es: 'Instagram de Camilo Hernández', en: "Camilo Hernández's Instagram" },
    },
    {
      id: 'github',
      href: 'https://github.com/CHERCED-DEV',
      label: { es: 'GitHub de Camilo Hernández', en: "Camilo Hernández's GitHub" },
    },
    {
      id: 'email',
      href: 'mailto:chernandezcediel@gmail.com',
      label: { es: 'Escríbeme un correo', en: 'Send me an email' },
    },
    {
      id: 'facebook',
      href: null,
      label: { es: 'Facebook de Camilo Hernández', en: "Camilo Hernández's Facebook" },
    },
  ],
  home: {
    greeting: { es: 'Mi nombre es', en: 'My name is' },
    name: 'Camilo',
    previousTitle: { es: 'SOY DESARROLLADOR', en: "I'M A DEVELOPER" },
    title: { es: 'DISEÑO SISTEMAS DE SOFTWARE QUE ESCALAN', en: 'I DESIGN SOFTWARE SYSTEMS THAT SCALE' },
    subtitle: {
      es: 'Software Solutions Engineer · AI-First. Micro-frontends, microservicios .NET y plataformas composables.',
      en: 'Software Solutions Engineer · AI-First. Micro-frontends, .NET microservices and composable platforms.',
    },
  },
  profile: {
    availability: {
      location: { es: 'Armenia, Colombia', en: 'Armenia, Colombia' },
      timezone: 'UTC−5',
      relocation: { es: 'Abierto a reubicación', en: 'Open to relocation' },
    },
    cv: {
      href: 'https://www.linkedin.com/in/cherced/',
      pdfs: [
        { lang: 'es', href: '/cv/camilo-hernandez-cv-es.pdf', filename: 'Camilo_Hernandez_CV_ES.pdf', bytes: 174_507 },
        { lang: 'en', href: '/cv/camilo-hernandez-cv-en.pdf', filename: 'Camilo_Hernandez_CV_EN.pdf', bytes: 172_753 },
      ],
    },
  },
  recruiters: {
    title: { es: 'Para reclutadores', en: 'For recruiters' },
    intro: {
      es: 'Lo que busco, en corto. Si tu equipo encaja, el CV y LinkedIn están aquí mismo.',
      en: 'What I am looking for, in short. If your team fits, my CV and LinkedIn are right here.',
    },
    rolesTitle: { es: 'Roles que busco', en: 'Roles I am looking for' },
    roles: [
      {
        es: 'Frontend de alta calidad, con Angular como mi framework favorito y las manos también en el backend.',
        en: 'High-quality frontend, with Angular as my favorite framework and my hands on the backend too.',
      },
      {
        es: 'Full stack con énfasis en el front.',
        en: 'Full stack with an emphasis on the frontend.',
      },
      {
        es: 'AI Engineer: arneses, skills y automatizaciones con agentes de IA.',
        en: 'AI Engineer: harnesses, skills and automations with AI agents.',
      },
      {
        es: 'Equipos con fábricas de software por mejorar, o departamentos de ingeniería donde proponer lineamientos, experimentos y templates.',
        en: 'Teams with software factories to improve, or engineering departments where I can propose guidelines, experiments and templates.',
      },
    ],
    modalityTitle: { es: 'Modalidad', en: 'How I work' },
    modality: { es: 'Remoto · UTC−5 · Abierto a reubicación', en: 'Remote · UTC−5 · Open to relocation' },
    englishTitle: { es: 'Inglés', en: 'English' },
    english: { es: 'B1, B2 en uso profesional frecuente', en: 'B1, B2 in regular professional use' },
    write: { es: 'Escríbeme', en: 'Write to me' },
  },
  about: {
    description: {
      es: 'Soy Camilo, Software Solutions Engineer. Diseño plataformas donde agregar el siguiente negocio no cuesta lo mismo que el primero: micro-frontends, microservicios .NET, sagas y un CMS que compone. En fintech trabajo de punta a punta y lidero migraciones de legado. En Synergos dirijo un equipo de agentes de IA que construye en paralelo bajo reglas de arquitectura que rompen el build si alguien las viola.',
      en: "I'm Camilo, a Software Solutions Engineer. I design platforms where adding the next business doesn't cost as much as the first: micro-frontends, .NET microservices, sagas and a CMS that composes. In fintech I work end to end and lead legacy migrations. In Synergos I direct a team of AI agents that builds in parallel under architecture rules that break the build if anyone violates them.",
    },
    image: {
      src: '/assets/imgs/about/retrato-oscuro.webp',
      alt: {
        es: 'Retrato de Camilo Hernández con los brazos cruzados y gafas de visor, frente a formas de cristal luminosas',
        en: 'Portrait of Camilo Hernández with his arms crossed and visor sunglasses, in front of glowing glass shapes',
      },
      width: 1199,
      height: 1312,
    },
    career: [
      {
        id: 'sistecredito-ai-first',
        company: 'Sistecrédito',
        role: { es: 'Software Solutions Engineer · AI-First', en: 'Software Solutions Engineer · AI-First' },
        start: '2026-02',
        end: null,
        description: {
          en: 'I work end to end: micro-frontends on Native Federation, .NET microservices with gRPC, event pipelines between AWS and Azure Service Bus, and legacy migrations that keep the business running. I work AI-first and spec-driven, and I built AI agent skills for the engineering teams.',
          es: 'Trabajo de punta a punta: micro-frontends con Native Federation, microservicios .NET con gRPC, pipelines de eventos entre AWS y Azure Service Bus, y migraciones de legado sin detener la operación. Trabajo AI-first y spec-driven, y creé skills de agentes de IA para los equipos de ingeniería.',
        },
        highlights: [
          {
            es: 'Construyo y mantengo más de 10 micro-frontends en Native Federation y más de 4 microservicios .NET, usados por más de 4 equipos de la compañía.',
            en: 'Build and maintain 10+ micro-frontends on Native Federation and 4+ .NET microservices, used by 4+ teams across the company.',
          },
          {
            es: 'Mejoré ~90% el rendimiento de la app de contactabilidad embebida en Genesys Cloud frente a su primera versión: optimicé el prefetching de Native Federation y propuse cambios al middleware del Gold Partner de Genesys que implementaron ambos equipos.',
            en: "Improved the performance of the contactability app embedded in Genesys Cloud by ~90% versus its first release: optimized Native Federation's heavy first-load prefetching and analyzed how the Genesys Gold Partner's middleware used Genesys webhooks and APIs, proposing changes that both teams implemented.",
          },
          {
            es: 'Construí un pipeline de eventos para un contact center de ~700 agentes con miles de interacciones al día: eventos de Genesys desde AWS EventBridge (llamadas, SMS y WhatsApp, entrantes y salientes) mapeados con Redpanda Connect hacia Azure Service Bus y consumidos por un microservicio .NET que escala horizontalmente.',
            en: 'Built an event pipeline for a contact center of ~700 agents handling thousands of interactions a day: Genesys events from AWS EventBridge (calls, SMS, WhatsApp, inbound and outbound) mapped through a Redpanda Connect pipeline into Azure Service Bus, consumed by a horizontally scalable .NET microservice.',
          },
          {
            es: 'Automaticé con Microsoft Intune el despliegue de aplicaciones de escritorio legadas a ~1.000 equipos de cobranza y servicio al cliente, en una ventana de 40 minutos: 80% de éxito en la primera corrida y cero downtime, frente a cerca de una semana de instalación manual.',
            en: 'Automated the rollout of legacy desktop applications for collections and customer-service teams to ~1,000 computers through Microsoft Intune, using Windows UI automation scripts in a 40-minute window: 80% success on the first run and zero downtime, replacing about a week of manual installs by a full team.',
          },
          {
            es: 'Creé skills de agentes de IA para los equipos: una convierte la captura de una interfaz en propuestas de componentes del sistema de diseño; otra guía la integración de micro-frontends en el shell de Native Federation.',
            en: "Built AI agent skills for the engineering teams: one turns a UI screenshot into component proposals that follow the company's design system; another guides teams in embedding micro-frontends into the Native Federation shell.",
          },
        ],
      },
      {
        id: 'sistecredito-dev-solutions',
        company: 'Sistecrédito',
        role: { es: 'Development Solutions Engineer', en: 'Development Solutions Engineer' },
        start: '2025-03',
        end: '2026-02',
        description: {
          en: 'I brought what I learned on airline platforms into fintech: micro-frontends that combine .NET server-side rendering with Angular. I designed a cross-origin postMessage protocol that keeps sensitive data out of message payloads, and implemented GA4/GTM analytics and accessibility improvements.',
          es: 'Llevé al sector fintech lo que aprendí en plataformas de aerolíneas: micro-frontends que combinan server-side rendering de .NET con Angular. Diseñé un protocolo de comunicación cross-origin con postMessage que mantiene los datos sensibles fuera de los mensajes, e implementé analítica con GA4/GTM y mejoras de accesibilidad.',
        },
        highlights: [
          {
            es: 'Llevé al sector fintech la experiencia de plataformas de aerolíneas, con micro-frontends que combinan server-side rendering de .NET con Angular.',
            en: 'Brought airline-platform experience into fintech, delivering micro-frontends that combine .NET server-side rendering with Angular.',
          },
          {
            es: 'Diseñé el protocolo de comunicación cross-origin (window.postMessage) que embebe la app de contactabilidad de la compañía dentro de Genesys Cloud, manteniendo los datos sensibles fuera de los mensajes.',
            en: "Designed the cross-origin communication protocol (window.postMessage) that embeds the company's contactability app inside Genesys Cloud, keeping sensitive data out of message payloads.",
          },
          {
            es: 'Implementé eventos de analítica granulares con GA4/GTM y mejoré la accesibilidad (manejo de foco, WCAG).',
            en: 'Implemented granular GA4/GTM analytics events and improved accessibility (focus management, WCAG).',
          },
        ],
      },
      {
        id: 'synergos-labs',
        company: 'Synergos Labs',
        role: { es: 'Founder & Software Architect', en: 'Founder & Software Architect' },
        start: '2024-02',
        end: null,
        description: {
          es: `Proyecto propio. Diseño y construyo Synergos, una plataforma de composición donde el octavo vertical de negocio cuesta menos que el primero: ${synergosFacts.pieces} piezas desplegables (un CMS, ${synergosFacts.capabilities} capacidades, ${synergosFacts.orchestrators} orquestadores y un proxy), más de ${formatFact(synergosFacts.testsAtLeast, 'es')} tests automatizados y más de ${formatFact(synergosFacts.adrsAtLeast, 'es')} decisiones de arquitectura documentadas. Dirijo un equipo de agentes de IA que construye en paralelo bajo mis reglas.`,
          en: `Personal project. I design and build Synergos, a composition platform where the eighth business vertical costs less than the first: ${synergosFacts.pieces} deployable pieces (a CMS, ${synergosFacts.capabilities} capabilities, ${synergosFacts.orchestrators} orchestrators and a proxy), ${formatFloor(synergosFacts.testsAtLeast, 'en')} automated tests and ${formatFloor(synergosFacts.adrsAtLeast, 'en')} documented architecture decisions. I direct a team of AI agents that builds in parallel under my rules.`,
        },
        highlights: [
          {
            es: 'Creé Synergos, una plataforma digital componible con la que cualquier negocio arma sus productos digitales a partir de una librería de más de 30 componentes reutilizables.',
            en: 'Created Synergos, a composable digital platform that lets any business assemble its digital products from a library of 30+ reusable components.',
          },
          {
            es: 'Umbraco (.NET) como capa de composición y un proyecto en CDN que sirve los recursos.',
            en: 'Umbraco (.NET) acts as the composition layer; a separate project deployed on a CDN serves the resources that feed it.',
          },
          {
            es: 'Composición backend-for-frontend limpia, agnóstica al framework incluso en sus rutas de importación, probada con más de 3 frameworks web.',
            en: 'Clean backend-for-frontend composition, framework-agnostic by design down to its import paths, proven with 3+ web frameworks.',
          },
          {
            es: 'Diseñé y construí cada componente a conciencia, y luego empecé a pilotear la plataforma con desarrollo guiado por especificaciones y agentes de IA.',
            en: 'Designed and built each component deliberately, then piloted the platform through spec-driven development with AI agents.',
          },
        ],
      },
      {
        id: 'flyr',
        company: 'FLYR',
        role: { es: 'Frontend Web Developer', en: 'Frontend Web Developer' },
        start: '2023-03',
        end: '2025-03',
        description: {
          es: 'Pasé de las cuentas de clientes al producto core: la plataforma de retail aéreo de la que se extiende cada aerolínea. Lideré la arquitectura de los módulos de Check-in y Manage My Booking, desplegados en más de 3 aerolíneas internacionales, construí componentes seguros de checkout en Angular para el módulo PCI y trabajé en un proyecto de redención de vouchers para una aerolínea.',
          en: 'I moved from client accounts to the core product: the airline retailing platform every airline account extends from. I led the architecture of the Check-in and Manage My Booking modules, deployed across 3+ international airlines, built secure Angular checkout components for the PCI module and worked on a voucher redemption project for an airline.',
        },
        highlights: [
          {
            es: 'Pasé de las cuentas de clientes al producto core de FLYR: la plataforma de retail aéreo de la que se extiende cada aerolínea.',
            en: "Moved from client accounts to FLYR's core product, the airline retailing platform that every airline account extends from.",
          },
          {
            es: 'Lideré la arquitectura y el desarrollo de los módulos de Check-in y Manage My Booking, desplegados en más de 3 aerolíneas internacionales.',
            en: 'Led the architecture and development of the Check-in and Manage My Booking modules, deployed across 3+ major international airlines.',
          },
          {
            es: 'Contribuí al módulo PCI y a la integración de pagos por franquicia con una pasarela externa, construyendo componentes seguros de checkout en Angular.',
            en: 'Contributed to the PCI module and franchise payment integration with an external payment gateway, building secure Angular checkout components.',
          },
          {
            es: 'Trabajé en un proyecto de redención de vouchers para una aerolínea importante con TypeScript, Angular y .NET.',
            en: 'Worked on a voucher redemption project for a major airline with TypeScript, Angular and .NET.',
          },
          {
            es: 'Coordiné lanzamientos por aerolínea, trabajé con los clientes y mentoreé desarrolladores en Angular, TypeScript y .NET.',
            en: 'Coordinated releases tailored to each airline account, worked directly with clients and mentored developers on Angular, TypeScript and .NET architecture decisions.',
          },
        ],
      },
      {
        id: 'newshore',
        company: 'Newshore (a FLYR Labs company)',
        role: { es: 'Frontend Web Developer', en: 'Frontend Web Developer' },
        start: '2022-07',
        end: '2023-03',
        description: {
          en: 'I started on the airline accounts side: I led frontend work on web platforms, including the Avianca PWA, and helped launch 3+ platforms as part of the setups team. I worked with UX on pixel-perfect, accessible interfaces (WCAG, ARIA) using .NET, Angular and Umbraco on Azure.',
          es: 'Empecé del lado de las cuentas de aerolíneas: lideré el frontend de plataformas web, incluida la PWA de Avianca, y ayudé a lanzar más de 3 plataformas como parte del equipo de setups. Trabajé con UX en interfaces pixel-perfect y accesibles (WCAG, ARIA) con .NET, Angular y Umbraco sobre Azure.',
        },
        highlights: [
          {
            es: 'Lideré el frontend de plataformas web de aerolíneas, incluida la PWA de Avianca, desde la entrega del diseño hasta producción.',
            en: 'Led frontend development on airline web platforms, including the Avianca PWA, from design handoff to production.',
          },
          {
            es: 'Ayudé a lanzar más de 3 plataformas web de aerolíneas como parte del equipo de setups.',
            en: 'Helped launch 3+ airline web platforms as part of the setups team.',
          },
          {
            es: 'Entregué con el equipo de UX interfaces pixel-perfect y accesibles, alineadas con WCAG y ARIA, con soluciones modulares en .NET y Angular sobre Umbraco CMS, desplegadas en Azure.',
            en: 'Delivered pixel-perfect, accessible interfaces with the UX team, aligned with WCAG and ARIA, using module-based .NET and Angular solutions on Umbraco CMS, deployed on Azure.',
          },
        ],
      },
      {
        id: 'platzi-master',
        company: 'Platzi',
        role: { es: 'Frontend Web Developer – Platzi Master [CX]', en: 'Frontend Web Developer – Platzi Master [CX]' },
        start: '2022-03',
        end: '2022-06',
        description: {
          en: 'I completed Platzi Master, an online frontend bootcamp: courses in HTML, CSS, JavaScript and React, hands-on projects and personalized mentoring from industry professionals, all aimed at landing a job in the field.',
          es: 'Completé Platzi Master, un bootcamp online de frontend: cursos de HTML, CSS, JavaScript y React, proyectos prácticos y mentoría personalizada con profesionales de la industria, todo orientado a conseguir empleo en el área.',
        },
      },
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
        highlights: [
          {
            es: 'Refactoricé el portal de pago de impuestos de una entidad pública (PHP, HTML, JavaScript): optimicé recursos y la composición de las páginas, y subí su puntaje de rendimiento en Lighthouse en unos 40 puntos.',
            en: 'Refactored a government tax-payment portal (PHP, HTML, JavaScript), optimizing assets and page composition to raise its Lighthouse performance score by ~40 points.',
          },
          {
            es: 'Me encargué de la arquitectura y el empaquetado del proyecto, e introduje desarrollo por componentes; diseñé las interfaces en Figma.',
            en: 'Owned project architecture and packaging, introducing component-based development; designed interfaces in Figma.',
          },
        ],
      },
      {
        id: 'squadra-arquitectura',
        company: 'Squadra Arquitectura',
        role: { es: 'Founder & Business Manager', en: 'Founder & Business Manager' },
        start: '2016-10',
        end: '2020-05',
        description: {
          es: 'Fundé y dirigí una empresa de habilitación hospitalaria y obra civil: gestioné y supervisé proyectos de construcción, negocié con clientes y proveedores, y representé a la empresa en licitaciones públicas.',
          en: 'I founded and ran a company focused on hospital facility compliance and civil works: I managed and supervised construction projects, negotiated with clients and suppliers, and represented the company in public tenders.',
        },
      },
    ],
    skills: {
      description: {
        en: "I'm a front-end and full-stack developer with experience in a variety of technologies and skills, such as:",
        es: 'Soy desarrollador front-end y full-stack, con experiencia en una variedad de tecnologías y habilidades, como:',
      },
      bullets: [
        {
          en: 'HTML5 semantics to structure web page content in an accessible and standardized way.',
          es: 'Semántica de HTML5 para estructurar el contenido de las páginas de forma accesible y estándar.',
        },
        {
          en: 'CSS, Sass and Less to style web pages and bring them to life.',
          es: 'CSS, Sass y Less para darles estilo y vida a las páginas web.',
        },
        {
          en: 'JavaScript and TypeScript to create interactivity and logic on web pages.',
          es: 'JavaScript y TypeScript para crear interactividad y lógica en las páginas web.',
        },
        {
          en: 'RESTful APIs to communicate with the back-end and retrieve dynamic data.',
          es: 'APIs RESTful para comunicarme con el back-end y obtener datos dinámicos.',
        },
        {
          en: 'React for developing highly interactive components and web applications.',
          es: 'React para desarrollar componentes y aplicaciones web muy interactivas.',
        },
        {
          en: 'Node.js for developing build scripts and automations, and for creating back-end applications.',
          es: 'Node.js para desarrollar scripts de build y automatizaciones, y para crear aplicaciones de back-end.',
        },
        {
          en: 'Angular for developing complex web applications.',
          es: 'Angular para desarrollar aplicaciones web complejas.',
        },
        {
          en: 'Next.js for optimizing web application performance and SEO.',
          es: 'Next.js para optimizar el rendimiento y el SEO de las aplicaciones web.',
        },
        {
          en: 'npm for managing project packages and dependencies.',
          es: 'npm para gestionar los paquetes y las dependencias de los proyectos.',
        },
        {
          en: 'Knowledge of tools such as Umbraco and other CMSs for development and maintenance.',
          es: 'Conocimiento de herramientas como Umbraco y otros CMS para desarrollo y mantenimiento.',
        },
      ],
      tech: [
        {
          id: 'angular',
          name: 'ANGULAR',
          icon: '/assets/icons/skillsIcon/angular.png',
          progress: 92,
          used: { es: '2022–hoy', en: '2022–now' },
        },
        {
          id: 'typescript',
          name: 'TYPESCRIPT',
          icon: '/assets/icons/skillsIcon/typescript.png',
          progress: 92,
          used: { es: '2022–hoy', en: '2022–now' },
        },
        { id: 'css', name: 'CSS', icon: '/assets/icons/skillsIcon/css.png', progress: 92, used: { es: '2019–hoy', en: '2019–now' } },
        {
          id: 'javascript',
          name: 'JAVASCRIPT',
          icon: '/assets/icons/skillsIcon/js.png',
          progress: 90,
          used: { es: '2019–hoy', en: '2019–now' },
        },
        { id: 'sass', name: 'SASS', icon: '/assets/icons/skillsIcon/sass.png', progress: 90, used: { es: '2019–hoy', en: '2019–now' } },
        { id: 'html5', name: 'HTML5', icon: '/assets/icons/skillsIcon/html-5.png', progress: 90, used: { es: '2019–hoy', en: '2019–now' } },
        {
          id: 'react',
          name: 'REACT',
          icon: '/assets/icons/skillsIcon/react.png',
          progress: 72,
          used: { es: '2022–2023 · 2026', en: '2022–2023 · 2026' },
        },
        {
          id: 'nextjs',
          name: 'NEXT.JS',
          icon: '/assets/icons/skillsIcon/nextjs.png',
          progress: 75,
          used: { es: '2022–2023 · 2026', en: '2022–2023 · 2026' },
        },
        {
          id: 'web-components',
          name: 'WEB COMPONENTS',
          icon: '/assets/icons/skillsIcon/web-components.svg',
          progress: 88,
          used: { es: '2024–hoy', en: '2024–now' },
        },
        { id: 'ngrx', name: 'NGRX', progress: 75, used: { es: '2023–hoy', en: '2023–now' } },
        { id: 'nx', name: 'NX MONOREPOS', icon: '/assets/icons/skillsIcon/nx.svg', progress: 85, used: { es: '2024–hoy', en: '2024–now' } },
        { id: 'a11y', name: 'ACCESSIBILITY · WCAG', progress: 82, used: { es: '2022–hoy', en: '2022–now' } },
        { id: 'figma', name: 'FIGMA', icon: '/assets/icons/skillsIcon/figma.png', progress: 70, used: { es: '2019–hoy', en: '2019–now' } },
        { id: 'clean-architecture', name: 'CLEAN ARCHITECTURE', progress: 88 },
        { id: 'solid', name: 'SOLID', progress: 90 },
        { id: 'design-patterns', name: 'DESIGN PATTERNS', progress: 85 },
        { id: 'distributed-systems', name: 'DISTRIBUTED SYSTEMS', progress: 82 },
        { id: 'microservices', name: 'MICROSERVICES', progress: 82 },
        { id: 'micro-frontends', name: 'MICRO-FRONTENDS', icon: '/assets/icons/skillsIcon/micro-frontends.svg', progress: 90 },
        { id: 'native-federation', name: 'NATIVE FEDERATION', icon: '/assets/icons/skillsIcon/native-federation.svg', progress: 88 },
        { id: 'composable-architecture', name: 'COMPOSABLE ARCHITECTURE', progress: 92 },
        { id: 'event-driven', name: 'EVENT-DRIVEN ARCHITECTURE', progress: 78 },
        { id: 'saga', name: 'SAGA · COMPENSATING TRANSACTIONS', progress: 85 },
        { id: 'bff', name: 'BACKEND FOR FRONTEND', progress: 85 },
        { id: 'api-design', name: 'API DESIGN · REST · GRPC', icon: '/assets/icons/skillsIcon/api-design.svg', progress: 80 },
        { id: 'fitness-functions', name: 'ARCHITECTURE TESTS · FITNESS FUNCTIONS', progress: 88 },
        { id: 'adr', name: 'ADR · TECHNICAL GOVERNANCE', progress: 90 },
        { id: 'legacy-modernization', name: 'LEGACY MODERNIZATION', progress: 80 },
        {
          id: 'spec-driven-development',
          name: 'SPEC-DRIVEN DEVELOPMENT',
          icon: '/assets/icons/skillsIcon/spec-driven-development.svg',
          progress: 90,
        },
        { id: 'dotnet', name: '.NET · ASP.NET CORE', icon: '/assets/icons/skillsIcon/dotnet.svg', progress: 88 },
        { id: 'csharp', name: 'C#', icon: '/assets/icons/skillsIcon/csharp.svg', progress: 85 },
        { id: 'umbraco', name: 'UMBRACO', icon: '/assets/icons/skillsIcon/umbraco.svg', progress: 90 },
        { id: 'grpc', name: 'GRPC', progress: 75 },
        { id: 'azure', name: 'AZURE', icon: '/assets/icons/skillsIcon/azure.png', progress: 78 },
        { id: 'azure-service-bus', name: 'AZURE SERVICE BUS', progress: 75 },
        { id: 'sql', name: 'SQL', progress: 72 },
        {
          id: 'nodejs',
          name: 'NODE.JS',
          icon: '/assets/icons/skillsIcon/nodejs.png',
          progress: 62,
          used: { es: '2022–2023', en: '2022–2023' },
        },
        {
          id: 'mongodb',
          name: 'MongoDB',
          icon: '/assets/icons/skillsIcon/mongodb.png',
          progress: 55,
          used: { es: '2022–2023', en: '2022–2023' },
        },
        { id: 'docker', name: 'DOCKER · COMPOSE', icon: '/assets/icons/skillsIcon/docker.svg', progress: 80 },
        { id: 'github-actions', name: 'GITHUB ACTIONS · CI/CD', icon: '/assets/icons/skillsIcon/github-actions.svg', progress: 85 },
        {
          id: 'cloudflare-workers',
          name: 'CLOUDFLARE WORKERS · CDN',
          icon: '/assets/icons/skillsIcon/cloudflare-workers.svg',
          progress: 75,
        },
        { id: 'ai-coding-agents', name: 'AI CODING AGENTS', icon: '/assets/icons/skillsIcon/ai-coding-agents.svg', progress: 90 },
        { id: 'multi-agent-orchestration', name: 'MULTI-AGENT ORCHESTRATION', progress: 88 },
        { id: 'claude-code-skills', name: 'CLAUDE CODE · SKILLS · PLUGINS', icon: '/assets/icons/skillsIcon/claude.svg', progress: 90 },
        { id: 'mcp', name: 'MCP', icon: '/assets/icons/skillsIcon/mcp.svg', progress: 75 },
        { id: 'evals', name: 'LLM EVALS · GUARDRAILS', progress: 75 },
        { id: 'git', name: 'GIT', icon: '/assets/icons/skillsIcon/merge.png', progress: 85 },
        { id: 'testing', name: 'TESTING · XUNIT · VITEST · PLAYWRIGHT', icon: '/assets/icons/skillsIcon/vitest.svg', progress: 80 },
        { id: 'ci-cd', name: 'CI/CD · GITHUB ACTIONS', icon: '/assets/icons/skillsIcon/github-actions.svg', progress: 85 },
        { id: 'code-review', name: 'CODE REVIEW', progress: 85 },
        { id: 'docs-as-code', name: 'DOCUMENTATION AS CODE · ADR', progress: 88 },
        { id: 'agile', name: 'AGILE · SCRUM', progress: 80 },
        {
          id: 'business-to-architecture',
          name: 'BUSINESS → ARCHITECTURE',
          label: { es: 'DEL NEGOCIO A LA ARQUITECTURA', en: 'BUSINESS → ARCHITECTURE' },
          progress: 85,
        },
        {
          id: 'stakeholders',
          name: 'STAKEHOLDER COMMUNICATION',
          label: { es: 'COMUNICACIÓN CON STAKEHOLDERS', en: 'STAKEHOLDER COMMUNICATION' },
          progress: 85,
        },
        {
          id: 'product-thinking',
          name: 'PRODUCT THINKING',
          label: { es: 'PENSAMIENTO DE PRODUCTO', en: 'PRODUCT THINKING' },
          progress: 80,
        },
      ],
      learningNow: {
        es: 'Aprendiendo ahora: Azure AI Foundry, Semantic Kernel y RAG.',
        en: 'Learning now: Azure AI Foundry, Semantic Kernel and RAG.',
      },
      inWords: {
        frontend: {
          es: 'Angular es mi casa desde 2022. Construyo interfaces pixel-perfect y accesibles, y hoy mantengo micro-frontends sobre Native Federation.',
          en: 'Angular has been home since 2022. I build pixel-perfect, accessible interfaces, and today I maintain micro-frontends on Native Federation.',
        },
        'backend-cloud': {
          es: 'Construyo microservicios .NET con gRPC, conecto sistemas con colas en Azure Service Bus y uso Umbraco como capa de composición.',
          en: 'I build .NET microservices with gRPC, connect systems through Azure Service Bus queues and use Umbraco as a composition layer.',
        },
        'applied-ai': {
          es: 'Trabajo AI-first: los agentes investigan, generan, revisan y documentan; yo diseño, decido y valido. La IA amplifica la ingeniería, no la reemplaza.',
          en: 'I work AI-first: agents research, scaffold, review and document; I design, decide and validate. AI amplifies engineering; it does not replace it.',
        },
      },
      lobes: [
        {
          id: 'frontend',
          name: { es: 'Frontend', en: 'Frontend' },
          skills: ['angular', 'typescript', 'css', 'javascript', 'sass', 'html5', 'react', 'nextjs', 'web-components', 'ngrx', 'nx', 'a11y', 'figma'],
          sources: ['flyr', 'newshore', 'sistecredito', 'platziMaster', 'fullStackJs'],
        },
        {
          id: 'architecture',
          name: { es: 'Arquitectura', en: 'Architecture' },
          skills: [
            'clean-architecture',
            'solid',
            'design-patterns',
            'distributed-systems',
            'microservices',
            'micro-frontends',
            'native-federation',
            'composable-architecture',
            'event-driven',
            'saga',
            'bff',
            'api-design',
            'fitness-functions',
            'adr',
            'legacy-modernization',
            'spec-driven-development',
          ],
          sources: ['sistecredito', 'flyr', 'synergos', 'architecture'],
          projects: ['12', '2'],
          words: {
            es: 'Diseño con Clean Architecture, SOLID y patrones de diseño, en piezas con límites claros y una sola responsabilidad. Construyo sistemas distribuidos: microservicios, micro-frontends, eventos y sagas que compensan cuando algo falla. Escribo las decisiones como ADR y las reglas como tests que rompen el build.',
            en: 'I design with Clean Architecture, SOLID and design patterns, in pieces with clear boundaries and a single responsibility. I build distributed systems: microservices, micro-frontends, events and sagas that compensate when something fails. I write decisions down as ADRs and rules as tests that break the build.',
          },
        },
        {
          id: 'backend-cloud',
          name: { es: 'Backend y nube', en: 'Backend & cloud' },
          skills: [
            'dotnet',
            'csharp',
            'umbraco',
            'grpc',
            'azure',
            'azure-service-bus',
            'sql',
            'nodejs',
            'mongodb',
            'docker',
            'github-actions',
            'cloudflare-workers',
          ],
          sources: ['sistecredito', 'flyr', 'newshore', 'synergos', 'fullStackJs'],
          projects: ['12', '5'],
        },
        {
          id: 'applied-ai',
          name: { es: 'IA aplicada', en: 'Applied AI' },
          skills: ['ai-coding-agents', 'multi-agent-orchestration', 'claude-code-skills', 'mcp', 'evals'],
          sources: ['sistecredito', 'synergos', 'legalWorkspace'],
          projects: ['2', '12'],
        },
        {
          id: 'practices',
          name: { es: 'Prácticas de ingeniería', en: 'Engineering practices' },
          skills: ['git', 'testing', 'ci-cd', 'code-review', 'docs-as-code', 'agile'],
          sources: ['sistecredito', 'flyr', 'newshore', 'synergos'],
          projects: ['12', '2'],
        },
        {
          id: 'business',
          name: { es: 'Idiomas y negocio', en: 'Languages & business' },
          skills: ['es', 'en', 'business-to-architecture', 'stakeholders', 'product-thinking'],
          sources: ['eam', 'squadra', 'flyr'],
          projects: ['12'],
          words: {
            es: 'Antes de programar fui administrador de empresas y fundé una compañía. Por eso traduzco necesidades de negocio en arquitectura y hablo el idioma de quien paga y de quien usa el sistema.',
            en: 'Before coding, I was a business administrator and founded a company. That is why I translate business needs into architecture and speak the language of both the people who pay for a system and the people who use it.',
          },
        },
      ],
    },
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
    certifications: [
      {
        name: { es: 'Fundamentos de Arquitectura de Software', en: 'Software Architecture Fundamentals' },
        issuer: 'Platzi',
        date: '2025-11',
      },
      {
        name: { es: 'Más de 140 cursos certificados de desarrollo de software', en: '140+ certified software development courses' },
        issuer: 'Platzi',
        date: null,
      },
    ],
    education: [
      {
        id: 'unad',
        institution: 'Universidad Nacional Abierta y a Distancia (UNAD)',
        degree: {
          es: 'Ingeniería de Sistemas (estudios no finalizados)',
          en: 'Systems Engineering (coursework, not completed)',
        },
        start: '2020-06',
        end: '2023-11',
      },
      {
        id: 'platzi',
        institution: 'Platzi',
        degree: { es: 'Frontend Development, Platzi Master', en: 'Frontend Development, Platzi Master' },
        start: '2018',
        end: '2022',
      },
      {
        id: 'eam',
        institution: 'Institución Universitaria EAM',
        degree: {
          es: 'Administración de Empresas, graduado con honores, énfasis en Creación de Empresas',
          en: 'Business Administration, graduated with honors, emphasis in Business Creation',
        },
        start: '2013',
        end: '2017',
      },
    ],
    courses: {
      schools: [
        {
          name: {
            es: 'Curso de Fundamentos de Arquitectura de Software — Platzi (nov 2025)',
            en: 'Software Architecture Fundamentals — Platzi (Nov 2025)',
          },
          description: {
            en: 'I formalized the architecture foundations I apply every day to distributed systems and composable platforms.',
            es: 'Formalicé las bases de arquitectura que aplico a diario en sistemas distribuidos y plataformas composables.',
          },
        },
        {
          name: { es: 'Desarrollo Full Stack con JavaScript', en: 'Full Stack Developer with JavaScript' },
          description: {
            en: 'Learn to create professional web applications from scratch using JavaScript, including popular frameworks like React and Node.js.',
            es: 'Aprende a crear aplicaciones web profesionales desde cero con JavaScript, incluidos frameworks populares como React y Node.js.',
          },
        },
        {
          name: {
            es: 'Frontend y Backend con JavaScript para Desarrollo Web',
            en: 'Frontend and Backend with JavaScript for Web Development',
          },
          description: {
            en: 'Focus on mastering the art of building dynamic user interfaces and efficient back ends for web applications with JavaScript, and explore libraries like React and frameworks like Express.',
            es: 'Enfócate en dominar el arte de construir interfaces de usuario dinámicas y back-ends eficientes para aplicaciones web con JavaScript, y explora librerías como React y frameworks como Express.',
          },
        },
        {
          name: { es: 'Full Stack con Next.js', en: 'Full Stack with Next.js' },
          description: {
            en: 'Build high-performance web apps with Next.js, learn how to handle server-side rendering and work with other technologies like Node.js and MongoDB.',
            es: 'Construye aplicaciones web de alto rendimiento con Next.js, aprende a manejar el renderizado en servidor y a trabajar con otras tecnologías como Node.js y MongoDB.',
          },
        },
        {
          name: {
            es: 'Y más de 140 cursos certificados de desarrollo de software',
            en: 'And 140+ certified software development courses',
          },
          description: {
            en: 'Learn different skills and technologies relevant to web development and software engineering.',
            es: 'Aprende distintas habilidades y tecnologías relevantes para el desarrollo web y la ingeniería de software.',
          },
        },
      ],
      platzi: {
        href: 'https://platzi.com/p/Cherced/',
        label: { es: 'Mi perfil en Platzi', en: 'My profile on Platzi' },
        icon: '/assets/icons/plazi.png',
      },
    },
    languages: [
      { id: 'es', name: { es: 'Español', en: 'Spanish' }, progress: 100, icon: '/assets/icons/flags/spain.png' },
      {
        id: 'en',
        name: { es: 'Inglés', en: 'English' },
        progress: 65,
        level: { es: 'B1, B2 en uso profesional frecuente', en: 'B1, B2 in regular professional use' },
        icon: '/assets/icons/flags/uniteStates.png',
      },
    ],
  },
  services: {
    intro: {
      es: 'Me meto en tu proceso, entiendo dónde se te va el tiempo y construyo lo que lo mejora: un asistente de IA hecho para tu profesión, una fábrica de software enfocada en el core de tu negocio o una arquitectura que crezca sin romperse. Tú sigues decidiendo; la IA hace el trabajo repetitivo.',
      en: 'I step into your process, find where your time goes and build what improves it: an AI assistant made for your profession, a software factory focused on your core business or an architecture that grows without breaking. You keep making the decisions; the AI does the repetitive work.',
    },
    hero: {
      title: {
        es: 'TU OFICIO, CON UN EQUIPO DE AGENTES A LA MEDIDA',
        en: 'YOUR CRAFT, WITH A TAILOR-MADE TEAM OF AGENTS',
      },
      intro: {
        es: 'Me meto en tu proceso, entiendo dónde se te va el tiempo y construyo lo que lo mejora: un asistente de IA hecho para tu profesión, una fábrica de software enfocada en el core de tu negocio o una arquitectura que crezca sin romperse. Tú sigues decidiendo; la IA hace el trabajo repetitivo.',
        en: 'I step into your process, find where your time goes and build what improves it: an AI assistant made for your profession, a software factory focused on your core business or an architecture that grows without breaking. You keep making the decisions; the AI does the repetitive work.',
      },
      cta: { es: 'CUÉNTAME TU PROCESO', en: 'TELL ME ABOUT YOUR PROCESS' },
    },
    audiences: [
      {
        id: 'professionals',
        title: { es: 'Profesionales independientes', en: 'Independent professionals' },
        text: {
          es: 'Abogados, ingenieros, consultores: personas cuyo trabajo tiene un método propio que hoy hacen a mano.',
          en: 'Lawyers, engineers, consultants: people whose work follows their own method, done by hand today.',
        },
      },
      {
        id: 'companies',
        title: { es: 'Empresas', en: 'Companies' },
        text: {
          es: 'Negocios que necesitan software propio para su core, o modernizar el que ya tienen sin detener la operación.',
          en: 'Businesses that need their own software for their core, or to modernize what they already have without stopping operations.',
        },
      },
      {
        id: 'engineering-teams',
        title: { es: 'Equipos de ingeniería', en: 'Engineering teams' },
        text: {
          es: 'Equipos que quieren trabajar AI-first sin perder calidad: con especificaciones, reglas que se cumplen solas y agentes bajo control.',
          en: 'Teams that want to work AI-first without losing quality: with specs, rules that enforce themselves and agents under control.',
        },
      },
    ],
    items: [
      {
        id: 'ai-harness',
        title: { es: 'ASISTENTES DE IA PARA TU PROFESIÓN', en: 'AI ASSISTANTS FOR YOUR PROFESSION' },
        description: {
          es: 'Construyo un harness de IA alrededor de tu método de trabajo: skills y plugins que conocen tu oficio, usan tus plantillas y siguen tus pasos. La IA propone; tú revisas y decides.',
          en: 'I build an AI harness around your way of working: skills and plugins that know your craft, use your templates and follow your steps. The AI proposes; you review and decide.',
        },
        forWho: { es: 'Profesionales independientes y equipos pequeños', en: 'Independent professionals and small teams' },
        deliverables: [
          { es: 'Skills y plugins a la medida de tu profesión', en: 'Skills and plugins tailored to your profession' },
          {
            es: 'Scripts de Python para el trabajo pesado, que bajan el costo de uso',
            en: 'Python scripts for heavy lifting, which lower usage costs',
          },
          { es: 'Reglas que impiden que la IA invente datos', en: 'Rules that keep the AI from making things up' },
          { es: 'Una guía de uso y una sesión de entrenamiento', en: 'A usage guide and a training session' },
        ],
        example: {
          es: 'Ejemplo: para una abogada, skills que organizan el material del caso, contrastan hipótesis y generan documentos. Para un ingeniero estructural, un asistente que lee sus bitácoras, ayuda con los cálculos y arma el estimado.',
          en: 'Example: for a lawyer, skills that organize case material, test hypotheses and draft documents. For a structural engineer, an assistant that reads his logs, helps with calculations and builds the estimate.',
        },
      },
      {
        id: 'software-factory',
        title: { es: 'FÁBRICAS DE SOFTWARE A LA MEDIDA', en: 'TAILOR-MADE SOFTWARE FACTORIES' },
        description: {
          es: 'Monto una fábrica de software enfocada en el core de tu negocio: varios agentes trabajando en paralelo, cada uno con su parte, bajo especificaciones claras, las skills que prefieras y reglas de arquitectura que rompen el build si alguien las viola.',
          en: 'I set up a software factory focused on your core business: several agents working in parallel, each on its own part, under clear specs, the skills you prefer and architecture rules that break the build if anyone violates them.',
        },
        forWho: { es: 'Empresas y equipos de ingeniería', en: 'Companies and engineering teams' },
        deliverables: [
          { es: 'Una constitución del proyecto y especificaciones con Spec Kit', en: 'A project constitution and specs with Spec Kit' },
          { es: 'Skills de dominio con el vocabulario de tu negocio', en: "Domain skills with your business's vocabulary" },
          { es: 'Un modelo de trabajo en paralelo con trazabilidad de cada tarea', en: 'A parallel workflow with every task traced' },
          { es: 'Gates de calidad y de arquitectura en CI', en: 'Quality and architecture gates in CI' },
        ],
        example: {
          es: 'Ejemplo: así construyo Synergos, con un director que integra y líneas de agentes por vertical de negocio, cada una con su espacio de trabajo.',
          en: 'Example: this is how I build Synergos, with a director that integrates and agent lines per business vertical, each in its own workspace.',
        },
      },
      {
        id: 'process-optimization',
        title: { es: 'OPTIMIZACIÓN DE PROCESOS CON IA', en: 'AI PROCESS OPTIMIZATION' },
        description: {
          es: 'Mapeamos juntos lo que haces cada semana, encontramos lo repetitivo y lo automatizamos: documentos, clasificación, transcripción, reportes. Medimos el antes y el después.',
          en: "We map together what you do every week, find what's repetitive and automate it: documents, sorting, transcription, reports. We measure before and after.",
        },
        forWho: { es: 'Profesionales y empresas', en: 'Professionals and companies' },
        deliverables: [
          { es: 'Un mapa de tu proceso con los cuellos de botella', en: 'A map of your process and its bottlenecks' },
          { es: 'Automatizaciones priorizadas por impacto', en: 'Automations prioritized by impact' },
          { es: 'Medición del tiempo ahorrado', en: 'Measurement of the time saved' },
        ],
      },
      {
        id: 'architecture',
        title: { es: 'ARQUITECTURA Y MODERNIZACIÓN', en: 'ARCHITECTURE & MODERNIZATION' },
        description: {
          es: 'Diseño la arquitectura de tu producto (micro-frontends, microservicios .NET o una plataforma composable) y migro sistemas legados por partes, sin detener la operación.',
          en: 'I design your product architecture (micro-frontends, .NET microservices or a composable platform) and migrate legacy systems step by step, without stopping operations.',
        },
        forWho: { es: 'Empresas con producto en crecimiento o sistemas legados', en: 'Companies with a growing product or legacy systems' },
        deliverables: [
          { es: 'Diagnóstico y arquitectura objetivo', en: 'Assessment and target architecture' },
          { es: 'Decisiones documentadas como ADR', en: 'Decisions documented as ADRs' },
          { es: 'Plan de migración por fases', en: 'Phased migration plan' },
          { es: 'Implementación o acompañamiento al equipo', en: 'Implementation or team support' },
        ],
      },
      {
        id: 'product',
        title: { es: 'DESARROLLO DE PRODUCTO', en: 'PRODUCT DEVELOPMENT' },
        description: {
          es: 'Construyo de punta a punta, del frontend al backend: interfaces accesibles en Angular o React, servicios en .NET y despliegue con CI/CD.',
          en: 'I build end to end, from frontend to backend: accessible interfaces in Angular or React, .NET services and CI/CD deployment.',
        },
        forWho: { es: 'Empresas y emprendimientos', en: 'Companies and startups' },
        deliverables: [
          { es: 'Especificación aprobada antes de construir', en: 'Spec approved before building' },
          { es: 'Producto funcionando, con pruebas', en: 'Working product, with tests' },
          { es: 'Despliegue y documentación', en: 'Deployment and documentation' },
        ],
      },
      {
        id: 'workshops',
        title: { es: 'TALLERES PARA EQUIPOS', en: 'TEAM WORKSHOPS' },
        description: {
          es: 'Entreno a tu equipo para trabajar AI-first y con Spec-Driven Development: escribir la especificación antes del código, dirigir agentes de IA en paralelo sin que se pisen y revisar lo que entregan.',
          en: 'I train your team to work AI-first and with Spec-Driven Development: writing the spec before the code, running AI agents in parallel without collisions and reviewing what they deliver.',
        },
        forWho: { es: 'Equipos de ingeniería', en: 'Engineering teams' },
        deliverables: [
          { es: 'Tu equipo escribe specs que un agente puede ejecutar.', en: 'Your team writes specs an agent can execute.' },
          {
            es: 'Un flujo de trabajo con agentes, revisión humana y decisiones escritas.',
            en: 'A workflow with agents, human review and written decisions.',
          },
          { es: 'Práctica sobre un caso de tu propio negocio.', en: 'Hands-on practice on a case from your own business.' },
        ],
      },
    ],
    process: {
      title: { es: 'CÓMO TRABAJO', en: 'HOW I WORK' },
      steps: [
        {
          es: '1. Entender — Me siento contigo a ver tu proceso real, no el ideal.',
          en: '1. Understand — I sit with you to see your real process, not the ideal one.',
        },
        {
          es: '2. Especificar — Escribimos qué se va a construir y cómo sabremos que funciona, antes de la primera línea de código.',
          en: "2. Specify — We write down what will be built and how we'll know it works, before the first line of code.",
        },
        {
          es: '3. Construir — Agentes de IA trabajando en paralelo, bajo reglas que no pueden saltarse.',
          en: "3. Build — AI agents working in parallel, under rules they can't skip.",
        },
        {
          es: '4. Verificar — Pruebas, revisión humana y demo. Nada se entrega sin que lo veas funcionar.',
          en: '4. Verify — Tests, human review and a demo. Nothing ships until you see it work.',
        },
        {
          es: '5. Entregar y medir — Te entrego la herramienta, la guía de uso y la medición del antes y el después.',
          en: '5. Deliver and measure — You get the tool, the usage guide and the before-and-after measurement.',
        },
      ],
      principles: [
        { es: 'La IA propone; la persona decide.', en: 'AI proposes; people decide.' },
        { es: 'Nada se inventa: cada dato tiene su fuente.', en: 'Nothing is made up: every fact has a source.' },
        { es: 'Tus datos se quedan contigo.', en: 'Your data stays with you.' },
        { es: 'Una regla que no rompe el build no existe.', en: "A rule that doesn't break the build doesn't exist." },
      ],
    },
    faq: [
      {
        q: { es: '¿Qué pasa con mis datos y los de mis clientes?', en: "What happens to my data and my clients' data?" },
        a: {
          es: 'Diseño cada solución para que tus datos se queden en tus equipos o en tus cuentas. Defino con anticipación qué información puede ver la IA, y el material sensible no sale de donde tú decidas.',
          en: "I design every solution so your data stays on your machines or in your accounts. I define upfront what information the AI can see, and sensitive material doesn't leave where you decide it stays.",
        },
      },
      {
        q: { es: '¿La IA va a reemplazar mi criterio?', en: 'Will the AI replace my judgment?' },
        a: {
          es: 'No. La IA hace el trabajo repetitivo y te propone; tú revisas y decides. Así está construido, no es una promesa.',
          en: "No. The AI does the repetitive work and makes proposals; you review and decide. That's how it's built, not a promise.",
        },
      },
      {
        q: { es: '¿Cuánto cuesta usar la IA después?', en: 'How much does using the AI cost afterwards?' },
        a: {
          es: 'Depende del modelo y del volumen. Diseño las soluciones para gastar poco: el trabajo pesado lo hacen scripts, no el modelo. Te entrego una estimación antes de empezar.',
          en: 'It depends on the model and the volume. I design solutions to keep costs low: scripts do the heavy lifting, not the model. You get an estimate before we start.',
        },
      },
      {
        q: { es: '¿Con qué herramientas de IA trabajas?', en: 'Which AI tools do you work with?' },
        a: {
          es: 'Principalmente Claude Code, con skills, plugins y servidores MCP. Me adapto a las herramientas que ya use tu equipo.',
          en: 'Mainly Claude Code, with skills, plugins and MCP servers. I adapt to the tools your team already uses.',
        },
      },
    ],
    cta: {
      title: { es: '¿Dónde se te va el tiempo?', en: 'Where does your time go?' },
      text: {
        es: 'Cuéntame tu proceso en cinco líneas y te digo qué se puede mejorar.',
        en: "Tell me about your process in five lines and I'll tell you what can be improved.",
      },
      button: { es: 'ESCRÍBEME', en: 'WRITE TO ME' },
    },
  },
  portfolio: {
    intro: [
      {
        es: 'Aquí está mi camino completo. Los proyectos de 2022 y 2023 son de cuando aprendía frontend en bootcamps: los dejo porque muestran de dónde vengo. Los más recientes, como Synergos y este mismo sitio, muestran cómo trabajo hoy: arquitectura primero, especificación antes del código y agentes de IA bajo mi revisión.',
        en: 'This is my full path. The 2022 and 2023 projects come from when I was learning frontend in bootcamps: I keep them because they show where I started. The newest ones, like Synergos and this site, show how I work today: architecture first, spec before code and AI agents under my review.',
      },
    ],
    footer: { es: '¡Y muchos más por venir!', en: 'And many more to come!' },
  },
  contact: {
    title: { es: 'Contacto', en: 'Contact' },
    description: {
      en: "I've been building for the web since 2019, and today I design everything from micro-frontends to .NET microservices. If you have a product that needs to scale, a legacy migration or an architecture to sort out, write to me and let's talk.",
      es: 'Construyo para la web desde 2019, y hoy diseño desde micro-frontends hasta microservicios .NET. Si tienes un producto que necesita escalar, una migración de legado o una arquitectura por ordenar, escríbeme y hablamos.',
    },
  },
  blog: {
    title: { es: 'Bienvenido a', en: 'Welcome to' },
    titleStrong: 'CHERCED-WORLD',
    welcome: {
      en: "Notes from an architect who works with agents: decisions, mistakes and what the tests didn't catch.",
      es: 'Notas de un arquitecto que trabaja con agentes: decisiones, errores y lo que los tests no vieron.',
    },
  },
  privacy: {
    updatedAt: '2026-11-05',
    sections: [
      {
        heading: { es: 'Quién es el responsable', en: 'Who is responsible' },
        body: {
          es: 'El responsable del tratamiento de los datos personales que recoge este sitio soy yo, Camilo Hernández.',
          en: 'I, Camilo Hernández, am responsible for the processing of the personal data collected on this site.',
        },
      },
      {
        heading: { es: 'Qué datos recojo', en: 'What data I collect' },
        body: {
          es: 'Cuando me escribes desde el formulario de contacto guardo tu nombre, tu correo, tu teléfono si lo das, el servicio que te interesa si lo eliges y tu mensaje. Cuando comentas un post guardo tu nombre, tu correo y tu comentario. En ambos casos guardo también la fecha en que autorizaste el tratamiento de tus datos.',
          en: "When you write to me through the contact form, I store your name, your email, your phone number if you give it, the service you're interested in if you choose one, and your message. When you comment on a post, I store your name, your email and your comment. In both cases I also store the date on which you authorized the processing of your data.",
        },
      },
      {
        heading: { es: 'Para qué los uso', en: 'What I use it for' },
        body: {
          es: 'Uso tus datos solo para responder tus mensajes de contacto y para moderar los comentarios del blog. Tu correo nunca se publica.',
          en: 'I use your data only to reply to your contact messages and to moderate blog comments. Your email is never published.',
        },
      },
      {
        heading: { es: 'Cuánto tiempo los conservo', en: 'How long I keep it' },
        body: {
          es: 'Conservo los mensajes y los comentarios hasta que yo, como administrador del sitio, los elimine, ya sea por decisión propia o porque tú me lo pidas.',
          en: 'I keep messages and comments until I, as the site administrator, delete them, either on my own or because you ask me to.',
        },
      },
      {
        heading: { es: 'Cómo consultar o eliminar tus datos', en: 'How to review or delete your data' },
        body: {
          es: 'Escríbeme a chernandezcediel@gmail.com, el correo de contacto de este sitio, para consultar, corregir o eliminar tus datos.',
          en: "Write to me at chernandezcediel@gmail.com, this site's contact email, to review, correct or delete your data.",
        },
      },
      {
        heading: { es: 'El laboratorio de IA', en: 'The AI Lab' },
        body: {
          es: 'Los experimentos del AI Lab corren en tu navegador. Antes de descargar un modelo o un runtime te digo qué es, cuánto pesa y de qué servidor viene (Hugging Face, jsDelivr o este mismo sitio, que sirve el motor ONNX Runtime Web), y no descargo nada sin tu permiso, que vale solo para esa sesión. Lo descargado queda en la caché de tu navegador, y lo que aprenden los juegos, en su almacenamiento local: nunca llega a mi servidor. Tu audio, tu texto, tus archivos y tus movimientos no se envían a ningún lado; si una voz del navegador se genera en línea, el experimento te avisa antes de usarla. Para borrarlo todo, usa «Borrar lo que el laboratorio guardó» en la página del laboratorio.',
          en: "The AI Lab experiments run in your browser. Before downloading a model or a runtime I tell you what it is, how much it weighs and which server it comes from (Hugging Face, jsDelivr or this very site, which serves the ONNX Runtime Web engine), and I download nothing without your permission, which lasts only for that session. What is downloaded stays in your browser's cache, and what the games learn stays in its local storage: it never reaches my server. Your audio, your text, your files and your moves are not sent anywhere; if a browser voice is generated online, the experiment warns you before using it. To delete it all, use “Clear what the lab saved” on the lab page.",
        },
      },
    ],
  },
}

export function lobeWords(lobe: Pick<SkillLobe, 'id' | 'words'>, content: SiteContent = site): Localized | null {
  return content.about.skills.inWords?.[lobe.id] ?? lobe.words ?? null
}

export function publicEmail(content: SiteContent = site): string | null {
  const href = content.socials.find((social) => social.id === 'email')?.href ?? null
  return href?.startsWith('mailto:') ? href.slice('mailto:'.length) : null
}
