import type { Project } from './types'

export const projects: Project[] = [
  {
    id: '1',
    title: 'Quantic Theatrum',
    summary: {
      en: 'A movie and TV show browser I built during a bootcamp with React, Next.js and the TheMovieDB API.',
      es: 'Un explorador de películas y series que construí durante un bootcamp con React, Next.js y la API de TheMovieDB.',
    },
    context: {
      en: 'Quantic Theatrum is a web application project that I developed during my time at a bootcamp. This project provided me with valuable hands-on experience, allowing me to apply various tasks assigned in each project sprint. Through Quantic Theatrum, I was able to demonstrate my skills in front-end development.',
      es: 'Quantic Theatrum es una aplicación web que desarrollé durante un bootcamp. Este proyecto me dio una valiosa experiencia práctica, porque me permitió aplicar las distintas tareas asignadas en cada sprint. Con Quantic Theatrum pude demostrar mis habilidades en desarrollo front-end.',
    },
    role: null,
    decisions: {
      en: 'The web application boasts a sleek and modern design that I meticulously crafted using a range of powerful tools including Figma, HTML, CSS and SASS. To enhance user experience, I employed JavaScript and React to introduce interactive elements and dynamic functionality.',
      es: 'La aplicación tiene un diseño moderno y elegante que construí con cuidado usando herramientas como Figma, HTML, CSS y SASS. Para mejorar la experiencia de usuario, usé JavaScript y React para agregar elementos interactivos y funcionalidad dinámica.',
    },
    result: {
      en: "To ensure seamless user authentication, I integrated Next Auth into the application, while effectively managing the application state with Next Redux. For user-friendly navigation between pages, I leveraged Next-Router. Notably, the application's standout feature is its integration with the TheMovieDB REST API, enabling users to effortlessly browse and search for their favorite movies and TV shows. Additionally, I implemented SweetAlert2 for a robust and intuitive notification system.",
      es: 'Para una autenticación de usuarios sin fricción integré Next Auth, y manejé el estado de la aplicación con Next Redux. Para navegar entre páginas usé Next-Router. Lo más destacado de la aplicación es su integración con la API REST de TheMovieDB, que permite buscar y explorar películas y series favoritas con facilidad. Además, implementé SweetAlert2 para un sistema de notificaciones robusto e intuitivo.',
    },
    technologies: [
      'HTML',
      'CSS',
      'SASS',
      'JAVASCRIPT',
      'REACT',
      'NEXTJS',
      'FIGMA',
      'NEXT AUTH',
      'NEXT REDUX',
      'SWEETALERT2',
      'NEXT-ROUTER',
      'APIREST THEMOVIEDB',
    ],
    image: {
      src: '/assets/imgs/projects/quanticTheatrum.png',
      alt: { en: 'Quantic Theatrum on mobile', es: 'Quantic Theatrum en móvil' },
      width: 420,
      height: 820,
    },
    links: {
      live: 'https://quantic-theatrum.vercel.app/',
      github: 'https://github.com/Cherced/QuanticFilms',
    },
    order: 1,
  },
  {
    id: '2',
    title: 'CHERCED-WORLD',
    summary: {
      en: 'My portfolio, born in 2023 and evolved in 2026 without losing its identity.',
      es: 'Mi portafolio, nacido en 2023 y evolucionado en 2026 sin perder su identidad.',
    },
    context: {
      en: 'My portfolio, born in 2023 as my playground for learning Next.js, and evolved in 2026 without losing its identity. This version adds glassmorphism over the animated GlitteringSea background, server-rendered content in English and Spanish, a real admin area with near-real-time notifications, a blog with moderated comments, a portfolio assistant that answers from my own content, a command palette and a time capsule of the 2023 version.',
      es: 'Mi portafolio, nacido en 2023 como el lugar donde aprendí Next.js, y evolucionado en 2026 sin perder su identidad. Esta versión suma glassmorfismo sobre el fondo animado GlitteringSea, contenido renderizado en servidor en español e inglés, un área de administración real con avisos casi en tiempo real, un blog con comentarios moderados, un asistente que responde a partir de mi propio contenido, una command palette y una cápsula del tiempo de la versión 2023.',
    },
    role: null,
    decisions: null,
    result: null,
    technologies: ['HTML', 'CSS', 'SASS', 'TYPESCRIPT', 'REACT', 'NEXTJS', 'FIGMA'],
    image: {
      src: '/assets/imgs/projects/chercedWorld.webp',
      alt: { en: 'CHERCED-WORLD portfolio on mobile', es: 'Portafolio CHERCED-WORLD en móvil' },
      width: 420,
      height: 870,
    },
    links: {
      live: 'https://cherced-world.vercel.app/',
      github: 'https://github.com/CHERCED-DEV/CHERCED-WORLD',
    },
    order: 2,
  },
]
