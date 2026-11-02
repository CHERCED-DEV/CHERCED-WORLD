import type { SiteContent } from './types'

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
      label: { es: 'LinkedIn de Camilo Hernandez', en: "Camilo Hernandez's LinkedIn" },
    },
    {
      id: 'instagram',
      href: 'https://www.instagram.com/cherced/',
      label: { es: 'Instagram de Camilo Hernandez', en: "Camilo Hernandez's Instagram" },
    },
    {
      id: 'github',
      href: 'https://github.com/CHERCED-DEV',
      label: { es: 'GitHub de Camilo Hernandez', en: "Camilo Hernandez's GitHub" },
    },
    {
      id: 'email',
      href: 'mailto:chernandezcediel@gmail.com',
      label: { es: 'Escríbeme un correo', en: 'Send me an email' },
    },
    {
      id: 'facebook',
      href: null,
      label: { es: 'Facebook de Camilo Hernandez', en: "Camilo Hernandez's Facebook" },
    },
  ],
  home: {
    greeting: { es: 'Mi nombre es', en: 'My name is' },
    name: 'Camilo',
    title: { es: 'SOY DESARROLLADOR', en: "I'M A DEVELOPER" },
  },
  about: {
    description: {
      en: "I'm Camilo, a Software Solutions Engineer. I design composable, distributed systems: micro-frontends, .NET microservices, message queues and a CMS working as one product. I learned on airline platforms at FLYR and now work in fintech, where I also lead legacy migrations. I work AI-first and spec-driven: I write the spec before the code and use agents to research, scaffold, review and document.",
      es: 'Soy Camilo, Software Solutions Engineer. Diseño sistemas composables y distribuidos: micro-frontends, microservicios .NET, colas de mensajes y un CMS funcionando como un solo producto. Me formé en plataformas de aerolíneas en FLYR y hoy trabajo en fintech, donde también lidero migraciones de legado. Trabajo AI-first y spec-driven: escribo la especificación antes del código y uso agentes para investigar, generar, revisar y documentar.',
    },
    image: {
      src: '/assets/imgs/meParallax.webp',
      alt: { es: 'Camilo Hernandez con los brazos cruzados', en: 'Camilo Hernandez with his arms crossed' },
      width: 500,
      height: 627,
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
      },
      {
        id: 'synergos-labs',
        company: 'Synergos Labs',
        role: { es: 'Founder & Software Architect', en: 'Founder & Software Architect' },
        start: '2024-02',
        end: null,
        description: {
          en: 'Personal project. I design and build Synergos, a composable digital platform with 30+ reusable components: Umbraco (.NET) as the composition layer, a CDN project that serves the resources, and a framework-agnostic backend-for-frontend, proven with 3+ frameworks.',
          es: 'Proyecto propio. Diseño y construyo Synergos, una plataforma digital composable con más de 30 componentes reutilizables: Umbraco (.NET) como capa de composición, un proyecto en CDN que sirve los recursos y un backend-for-frontend agnóstico al framework, probado con más de 3 frameworks.',
        },
      },
      {
        id: 'flyr',
        company: 'FLYR',
        role: { es: 'Frontend Web Developer', en: 'Frontend Web Developer' },
        start: '2023-03',
        end: '2025-03',
        description: {
          en: 'I moved from client accounts to the core product: the airline retailing platform every airline account extends from. I led the architecture of the Check-in and Manage My Booking modules, deployed across 3+ international airlines, and built secure Angular checkout components.',
          es: 'Pasé de las cuentas de clientes al producto core: la plataforma de retail aéreo de la que se extiende cada aerolínea. Lideré la arquitectura de los módulos de Check-in y Manage My Booking, desplegados en más de 3 aerolíneas internacionales, y construí componentes seguros de checkout en Angular.',
        },
      },
      {
        id: 'newshore',
        company: 'Newshore (a FLYR Labs company)',
        role: { es: 'Desarrollador Frontend', en: 'Frontend Developer' },
        start: '2022-07',
        end: '2023-03',
        description: {
          en: 'I started on the airline accounts side: I led frontend work on web platforms, including the Avianca PWA, and helped launch 3+ platforms as part of the setups team. I worked with UX on pixel-perfect, accessible interfaces (WCAG, ARIA) using .NET, Angular and Umbraco on Azure.',
          es: 'Empecé del lado de las cuentas de aerolíneas: lideré el frontend de plataformas web, incluida la PWA de Avianca, y ayudé a lanzar más de 3 plataformas como parte del equipo de setups. Trabajé con UX en interfaces pixel-perfect y accesibles (WCAG, ARIA) con .NET, Angular y Umbraco sobre Azure.',
        },
      },
      {
        id: 'platzi-master',
        company: 'Platzi Master [CX]',
        role: { es: 'Desarrollador Frontend', en: 'Frontend Developer' },
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
        role: { es: 'Desarrollador Frontend', en: 'Frontend Developer' },
        start: '2019-01',
        end: '2019-11',
        description: {
          en: "I improved and optimized the existing code of a commercial services company's website: I found and fixed performance issues, rewrote and updated code to current standards, and built and maintained CSS styles so the site looked and worked well on every device and browser.",
          es: 'Mejoré y optimicé el código existente del sitio web de una empresa de servicios comerciales: encontré y resolví problemas de rendimiento, reescribí y actualicé código a los estándares vigentes, y construí y mantuve los estilos CSS para que el sitio se viera y funcionara bien en cualquier dispositivo y navegador.',
        },
      },
      {
        id: 'squadra-arquitectura',
        company: 'Squadra Arquitectura',
        role: { es: 'Fundador y gerente', en: 'Founder & Business Manager' },
        start: '2016-10',
        end: '2020-05',
        description: {
          en: 'I founded and ran a company focused on developing and remodeling hospital architecture: I managed and supervised construction projects, negotiated with clients and suppliers, and represented the company in public tenders.',
          es: 'Fundé y dirigí una empresa dedicada al desarrollo y la remodelación de arquitectura hospitalaria: gestioné y supervisé proyectos de construcción, negocié con clientes y proveedores, y representé a la empresa en licitaciones públicas.',
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
        { id: 'angular', name: 'ANGULAR', icon: '/assets/icons/skillsIcon/angular.png', progress: 92 },
        { id: 'typescript', name: 'TYPESCRIPT', icon: '/assets/icons/skillsIcon/typescript.png', progress: 92 },
        { id: 'dotnet', name: '.NET', progress: 85 },
        { id: 'csharp', name: 'C#', progress: 82 },
        { id: 'micro-frontends', name: 'MICRO-FRONTENDS', progress: 90 },
        { id: 'native-federation', name: 'NATIVE FEDERATION', progress: 88 },
        { id: 'azure', name: 'AZURE', icon: '/assets/icons/skillsIcon/azure.png', progress: 78 },
        { id: 'umbraco', name: 'UMBRACO', progress: 85 },
        { id: 'spec-driven-development', name: 'SPEC-DRIVEN DEVELOPMENT', progress: 90 },
        { id: 'ai-coding-agents', name: 'AI CODING AGENTS', progress: 90 },
        { id: 'azure-ai-foundry', name: 'AZURE AI FOUNDRY', progress: 75 },
        { id: 'semantic-kernel', name: 'SEMANTIC KERNEL', progress: 60 },
        { id: 'rag-embeddings', name: 'RAG / EMBEDDINGS', progress: 60 },
        { id: 'javascript', name: 'JAVASCRIPT', icon: '/assets/icons/skillsIcon/js.png', progress: 90 },
        { id: 'html5', name: 'HTML5', icon: '/assets/icons/skillsIcon/html-5.png', progress: 90 },
        { id: 'css', name: 'CSS', icon: '/assets/icons/skillsIcon/css.png', progress: 92 },
        { id: 'sass', name: 'SASS', icon: '/assets/icons/skillsIcon/sass.png', progress: 90 },
        { id: 'git', name: 'GIT', icon: '/assets/icons/skillsIcon/merge.png', progress: 85 },
      ],
    },
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
          name: { es: 'Y otras escuelas', en: 'And other schools' },
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
      { id: 'en', name: { es: 'Inglés', en: 'English' }, progress: 65, icon: '/assets/icons/flags/uniteStates.png' },
    ],
  },
  services: {
    intro: {
      en: 'I help you turn a digital product into a system that grows without breaking. I design the architecture, build the frontend and backend, and maintain what I deliver with testing, accessibility and solid performance. I work from clear specs from day one, so you know what will be built before the first line of code.',
      es: 'Te ayudo a convertir un producto digital en un sistema que crece sin romperse. Diseño la arquitectura, construyo el frontend y el backend, y mantengo lo que entrego con pruebas, accesibilidad y buen rendimiento. Trabajo con especificaciones claras desde el inicio, para que sepas qué se va a construir antes de escribir la primera línea.',
    },
    items: [
      {
        id: 'design',
        title: { es: 'Diseño', en: 'Design' },
        description: {
          en: 'I can design your website based on your needs and ideas, or create it from scratch while consulting with you along the way.',
          es: 'Puedo diseñar tu sitio a partir de tus necesidades e ideas, o crearlo desde cero consultándote durante el proceso.',
        },
        icon: '/assets/icons/services/design.png',
      },
      {
        id: 'development',
        title: { es: 'Desarrollo', en: 'Development' },
        description: {
          en: 'Starting from a design of mine or one you send me, I can build a fully functional, responsive website.',
          es: 'A partir de un diseño mío o de uno que me envíes, puedo construir un sitio completamente funcional y responsive.',
        },
        icon: '/assets/icons/services/development.png',
      },
      {
        id: 'maintenance',
        title: { es: 'Mantenimiento', en: 'Maintenance' },
        description: {
          en: 'If something breaks or needs to change, I can add new features and solutions.',
          es: 'Si algo falla o necesita cambios, puedo agregar nuevas funcionalidades y soluciones.',
        },
        icon: '/assets/icons/services/maintenance.png',
      },
    ],
  },
  portfolio: {
    intro: [
      {
        en: "In this section of my web app, you will find some projects that showcase my notable growth in best practices, complexity, scalability and user experience. It's a vast universe for me, and as of now, I am a frontend developer seeking to improve my logic and backend knowledge to become a skilled developer with a deep understanding of this exciting world of software.",
        es: 'En esta sección de mi aplicación web vas a encontrar algunos proyectos que muestran mi notable crecimiento en buenas prácticas, complejidad, escalabilidad y experiencia de usuario. Es un universo enorme para mí y, por ahora, soy desarrollador frontend y busco mejorar mi lógica y mis conocimientos de backend para convertirme en un desarrollador hábil, con una comprensión profunda de este emocionante mundo del software.',
      },
      {
        en: 'Eventually, I want to develop native apps. Today, we have many ecosystems, but I am particularly drawn to the frontend trident, along with emerging frameworks. Thank you for visiting, and now I invite you to learn more by clicking on the image in the portfolio carousel.',
        es: 'Con el tiempo quiero desarrollar apps nativas. Hoy tenemos muchos ecosistemas, pero me atrae especialmente el tridente del frontend, junto con los frameworks emergentes. Gracias por tu visita; ahora te invito a conocer más haciendo clic en la imagen del carrusel del portafolio.',
      },
      {
        en: 'And who knows, someday I may become a great software architect or technical leader, just like the ones I have worked with, who have had great patience and love in teaching me, and, in the same way, help new people fall in love with this world and build a better one!',
        es: '¡Y quién sabe! Algún día puedo llegar a ser un gran arquitecto de software o líder técnico, como aquellos con los que he trabajado, que han tenido mucha paciencia y cariño para enseñarme, y, de la misma forma, ayudar a que nuevas personas se enamoren de este mundo y construyan uno mejor.',
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
      en: 'Welcome to CHERCED-WORLD. I made this space to share more about myself. I hope you enjoy your time here, and leave me feedback in the comments on each post. Thanks!',
      es: 'Bienvenido a CHERCED-WORLD. Hice este espacio para compartir más sobre mí. Espero que disfrutes tu visita; déjame tus comentarios en cada post. ¡Gracias!',
    },
  },
  privacy: {
    updatedAt: '2026-11-01',
    sections: [
      {
        heading: { es: 'Quién es el responsable', en: 'Who is responsible' },
        body: {
          es: 'El responsable del tratamiento de los datos personales que recoge este sitio soy yo, Camilo Hernandez.',
          en: 'I, Camilo Hernandez, am responsible for the processing of the personal data collected on this site.',
        },
      },
      {
        heading: { es: 'Qué datos recojo', en: 'What data I collect' },
        body: {
          es: 'Cuando me escribes desde el formulario de contacto guardo tu nombre, tu correo, tu teléfono si lo das y tu mensaje. Cuando comentas un post guardo tu nombre, tu correo y tu comentario. En ambos casos guardo también la fecha en que autorizaste el tratamiento de tus datos.',
          en: 'When you write to me through the contact form, I store your name, your email, your phone number if you give it and your message. When you comment on a post, I store your name, your email and your comment. In both cases I also store the date on which you authorized the processing of your data.',
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
    ],
  },
}
