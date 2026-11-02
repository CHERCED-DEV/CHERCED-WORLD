import type { SiteContent } from './types'

export const authorPending = {
  'P-01': 'about.career.newshore',
  'P-02': 'socials.facebook',
  'P-03': 'about.education.unad',
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
      en: "I'm a front-end developer with experience building highly interactive, high-performance web applications. I specialize in React and Angular, and I have professional knowledge of HTML, CSS, JavaScript, TypeScript, Node.js and Next.js.",
      es: 'Soy desarrollador front-end con experiencia construyendo aplicaciones web muy interactivas y de alto rendimiento. Me especializo en React y Angular, y tengo conocimiento profesional de HTML, CSS, JavaScript, TypeScript, Node.js y Next.js.',
    },
    image: {
      src: '/assets/imgs/meParallax.webp',
      alt: { es: 'Camilo Hernandez con los brazos cruzados', en: 'Camilo Hernandez with his arms crossed' },
      width: 500,
      height: 627,
    },
    career: [
      {
        id: 'newshore',
        company: 'Newshore (a FLYR Labs company)',
        role: { es: 'Desarrollador Frontend', en: 'Frontend Developer' },
        start: '2022-07',
        end: null,
        description: {
          en: 'I build the user interface and experience of an airline booking website: buttons, menus and forms, and navigation that stays easy for customers. I work closely with the back-end team to integrate the system, make sure the site works across devices and browsers, and test and debug technical issues.',
          es: 'Construyo la interfaz y la experiencia de usuario de un sitio de reservas de vuelos: botones, menús, formularios y una navegación fácil para los clientes. Trabajo de cerca con el equipo de back-end para integrar el sistema, me aseguro de que el sitio funcione en distintos dispositivos y navegadores, y hago pruebas y depuración de problemas técnicos.',
        },
        pending: true,
      },
      {
        id: 'platzi-master',
        company: 'Platzi Master [CX]',
        role: { es: 'Desarrollador Frontend', en: 'Frontend Developer' },
        start: '2022-02',
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
        start: '2020-01',
        end: '2021-11',
        description: {
          en: "I improved and optimized the existing code of a commercial services company's website: I found and fixed performance issues, rewrote and updated code to current standards, and built and maintained CSS styles so the site looked and worked well on every device and browser.",
          es: 'Mejoré y optimicé el código existente del sitio web de una empresa de servicios comerciales: encontré y resolví problemas de rendimiento, reescribí y actualicé código a los estándares vigentes, y construí y mantuve los estilos CSS para que el sitio se viera y funcionara bien en cualquier dispositivo y navegador.',
        },
      },
      {
        id: 'squadra-arquitectura',
        company: 'Squadra Arquitectura',
        role: { es: 'Gerente de negocios', en: 'Business Manager' },
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
        { id: 'react', name: 'REACT', icon: '/assets/icons/skillsIcon/react.png', progress: 75 },
        { id: 'nextjs', name: 'NEXTJS', icon: '/assets/icons/skillsIcon/nextjs.png', progress: 80 },
        { id: 'typescript', name: 'TYPESCRIPT', icon: '/assets/icons/skillsIcon/typescript.png', progress: 80 },
        { id: 'nodejs', name: 'NODEJS', icon: '/assets/icons/skillsIcon/nodejs.png', progress: 75 },
        { id: 'mongodb', name: 'MONGO', icon: '/assets/icons/skillsIcon/mongodb.png', progress: 60 },
        { id: 'javascript', name: 'JAVASCRIPT', icon: '/assets/icons/skillsIcon/js.png', progress: 90 },
        { id: 'angular', name: 'ANGULAR', icon: '/assets/icons/skillsIcon/angular.png', progress: 50 },
        { id: 'sass', name: 'SASS', icon: '/assets/icons/skillsIcon/sass.png', progress: 90 },
        { id: 'html5', name: 'HTML5', icon: '/assets/icons/skillsIcon/html-5.png', progress: 85 },
        { id: 'css', name: 'CSS', icon: '/assets/icons/skillsIcon/css.png', progress: 95 },
        { id: 'figma', name: 'FIGMA', icon: '/assets/icons/skillsIcon/figma.png', progress: 75 },
        { id: 'git', name: 'GIT', icon: '/assets/icons/skillsIcon/merge.png', progress: 80 },
        { id: 'azure', name: 'AZURE', icon: '/assets/icons/skillsIcon/azure.png', progress: 70 },
      ],
    },
    education: [
      {
        id: 'platzi',
        institution: 'Platzi',
        degree: { es: 'Desarrollador Frontend', en: 'Frontend Developer' },
        start: '2022-02',
        end: '2022-06',
      },
      {
        id: 'unad',
        institution: 'Universidad Nacional Abierta y a Distancia - UNAD Colombia',
        degree: { es: 'Ingeniería de Sistemas', en: 'Systems Engineering' },
        start: '2020',
        end: null,
        pending: true,
      },
      {
        id: 'eam',
        institution: 'Institución Universitaria EAM',
        degree: {
          es: 'Administración de Empresas, Gestión de Proyectos',
          en: 'Business Administration, Project Management',
        },
        start: '2011',
        end: '2016',
      },
    ],
    courses: {
      schools: [
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
      },
    },
    languages: [
      { id: 'es', name: { es: 'Español', en: 'Spanish' }, progress: 100 },
      { id: 'en', name: { es: 'Inglés', en: 'English' }, progress: 60 },
    ],
  },
  services: {
    intro: {
      en: "How can I help you? I'm a full-stack developer working with the MERN stack (MongoDB, Express, React and Node.js). I build end-to-end web applications that are fast, secure and scalable, and I can help you reach your business goals by designing and developing custom solutions, optimizing performance, and providing ongoing support and maintenance.",
      es: '¿Cómo te puedo ayudar? Soy desarrollador full-stack y trabajo con el stack MERN (MongoDB, Express, React y Node.js). Construyo aplicaciones web de punta a punta rápidas, seguras y escalables, y te puedo ayudar a cumplir tus objetivos de negocio diseñando y desarrollando soluciones a la medida, optimizando el rendimiento y dando soporte y mantenimiento continuos.',
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
      en: "Hi, I'm Camilo Hernandez, a full-stack developer with a strong focus on the MERN stack. I've been building for the web since 2020, and I've honed my skills creating robust, scalable web applications with TypeScript and Next.js.",
      es: 'Hola, soy Camilo Hernandez, desarrollador full-stack con un enfoque fuerte en el stack MERN. Construyo para la web desde 2020 y he afinado mis habilidades creando aplicaciones web robustas y escalables con TypeScript y Next.js.',
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
