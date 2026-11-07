import { SITE_ORIGIN } from '@/lib/site-url'
import { formatFact, formatFloor, synergosFacts as facts } from './synergos'
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
      'NEXT.JS',
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
    order: 6,
    era: '2022-2023',
    highlights: [
      { es: 'Integración con la API REST de TheMovieDB para buscar y explorar películas y series', en: 'Integrated with the TheMovieDB REST API to browse and search movies and TV shows' },
      { es: 'Autenticación de usuarios con Next Auth y estado de la aplicación con Next Redux', en: 'User authentication with Next Auth and app state managed with Next Redux' },
      { es: 'Diseño propio construido con Figma, HTML, CSS y SASS', en: 'My own design, crafted with Figma, HTML, CSS and SASS' },
    ],
  },
  {
    id: '2',
    title: 'CHERCED-WORLD 2026',
    summary: {
      en: 'My 2023 portfolio rebuilt with Spec-Driven Development and AI agents working in parallel.',
      es: 'Mi portafolio de 2023 reconstruido con desarrollo guiado por especificaciones (Spec-Driven Development) y agentes de IA trabajando en paralelo.',
    },
    context: {
      en: 'The 2023 portfolio described who I was three years ago: 2022 projects, skills from that time and nothing about my current architecture work. I wanted to update it without rewriting it by hand or adding infrastructure, and to use it as real proof of how I work today: spec first, agents second.',
      es: 'El portafolio de 2023 contaba quién era yo hace tres años: proyectos de 2022, skills de esa época y nada de mi trabajo actual en arquitectura. Quería actualizarlo sin reescribirlo a mano ni sumar infraestructura, y usarlo como prueba real de cómo trabajo hoy: especificación primero, agentes después.',
    },
    role: {
      en: 'I wrote the specs with Spec Kit, split the work into 8 lanes, reviewed and validated what the agents produced, and handled a privacy issue in production.',
      es: 'Escribí las especificaciones con Spec Kit, dividí el trabajo en 8 lanes, revisé y validé lo que produjeron los agentes, y respondí a un problema de privacidad en producción.',
    },
    decisions: {
      en: 'Eight lanes run by agents in parallel, each with exclusive file ownership, to avoid conflicts without manual coordination. Next.js 16 and React 19. Glassmorphism over an animated canvas. Bilingual ES/EN content. An admin panel that reuses what already existed, with no new infrastructure.',
      es: 'Ocho lanes ejecutadas por agentes en paralelo, cada una con propiedad exclusiva de sus archivos, para evitar conflictos sin coordinación manual. Next.js 16 y React 19. Glassmorphism sobre un canvas animado. Contenido bilingüe ES/EN. Un panel de administración que reutiliza lo existente, sin infraestructura nueva.',
    },
    result: {
      en: "The site is now updated and bilingual, with an admin panel and no new infrastructure costs. Along the way I found and fixed, with a hotfix in production, a privacy issue: contact details that shouldn't have been public.",
      es: 'El sitio quedó actualizado y bilingüe, con panel de administración y sin costos de infraestructura nuevos. Durante el proceso detecté y corregí con un hotfix en producción un problema de privacidad: datos de contacto que no debían ser públicos.',
    },
    technologies: ['NEXT.JS', 'REACT', 'TYPESCRIPT', 'SPEC KIT', 'AI CODING AGENTS', 'CANVAS'],
    image: {
      src: '/assets/imgs/projects/chercedWorld2026.webp',
      alt: {
        en: 'CHERCED-WORLD 2026 home in dark theme on mobile, with the glass card over the animated canvas',
        es: 'Inicio de CHERCED-WORLD 2026 en tema oscuro en móvil, con la tarjeta de vidrio sobre el canvas animado',
      },
      width: 420,
      height: 870,
    },
    links: {
      live: `${SITE_ORIGIN}/`,
      github: 'https://github.com/CHERCED-DEV/CHERCED-WORLD',
    },
    order: 3,
    era: '2024-2026',
    highlights: [
      { es: '8 lanes de agentes en paralelo, cada una con propiedad exclusiva de sus archivos', en: '8 agent lanes in parallel, each with exclusive file ownership' },
      { es: 'Sitio bilingüe ES/EN con panel de administración', en: 'Bilingual ES/EN site with an admin panel' },
      { es: 'Sin costos de infraestructura nuevos', en: 'No new infrastructure costs' },
      { es: 'Un problema de privacidad detectado y corregido con un hotfix en producción', en: 'A privacy issue found and fixed with a hotfix in production' },
    ],
  },
  {
    id: '3',
    title: 'AIRLINE',
    summary: {
      en: 'A landing page I built with Next.js, with responsive design and smooth page transitions.',
      es: 'Una landing page que construí con Next.js, con diseño responsive y transiciones de página suaves.',
    },
    context: {
      en: 'AIRLINE is a landing page that I built using Next.js, which serves as an excellent example of good development practices. The website showcases a modern and sleek design, with a focus on providing an enjoyable user experience. The landing page includes features such as responsive design and smooth page transitions, which enhance the overall user experience and make navigation seamless.',
      es: 'AIRLINE es una landing page que construí con Next.js y que sirve como un excelente ejemplo de buenas prácticas de desarrollo. El sitio tiene un diseño moderno y elegante, enfocado en ofrecer una experiencia de usuario agradable. La landing page incluye funcionalidades como diseño responsive y transiciones de página suaves, que mejoran la experiencia general y hacen que la navegación sea fluida.',
    },
    role: null,
    decisions: {
      en: "To create the website, I used a range of web development technologies, including HTML, CSS and JavaScript. I also employed frameworks such as React and Next.js to optimize the performance and speed of the website. Additionally, I utilized Figma to design the interface, ensuring that the website's aesthetic appeal matched its functionality.",
      es: 'Para crear el sitio usé varias tecnologías de desarrollo web, como HTML, CSS y JavaScript. También usé frameworks como React y Next.js para optimizar el rendimiento y la velocidad del sitio. Además, diseñé la interfaz en Figma para que el atractivo visual del sitio estuviera a la altura de su funcionalidad.',
    },
    result: {
      en: "Overall, AIRLINE serves as a testament to my proficiency in web development and my commitment to adhering to best practices. The website's clean design and seamless navigation demonstrate my attention to detail and ability to create high-quality websites that meet clients' needs. The website's implementation using popular web development tools ensures that it is easy to maintain and scale, allowing for future updates and enhancements as needed.",
      es: 'En resumen, AIRLINE demuestra mi dominio del desarrollo web y mi compromiso con las buenas prácticas. Su diseño limpio y su navegación fluida muestran mi atención al detalle y mi capacidad para crear sitios de alta calidad que respondan a las necesidades de los clientes. Al estar construido con herramientas populares de desarrollo web, es fácil de mantener y escalar, y admite futuras actualizaciones y mejoras cuando hagan falta.',
    },
    technologies: ['HTML', 'CSS', 'SASS', 'JAVASCRIPT', 'REACT', 'NEXT.JS', 'FIGMA'],
    image: {
      src: '/assets/imgs/projects/page.webp',
      alt: { en: 'AIRLINE landing page on mobile', es: 'Landing page de AIRLINE en móvil' },
      width: 403,
      height: 868,
    },
    links: {
      live: 'https://airlines-cherced.vercel.app/',
      github: 'https://github.com/Cherced/AIRLINES',
    },
    order: 7,
    era: '2022-2023',
    highlights: [
      { es: 'Diseño responsive con transiciones de página suaves', en: 'Responsive design with smooth page transitions' },
      { es: 'Interfaz diseñada en Figma', en: 'Interface designed in Figma' },
      { es: 'React y Next.js para optimizar el rendimiento y la velocidad', en: 'React and Next.js to optimize performance and speed' },
    ],
  },
  {
    id: '4',
    title: 'Newman Club',
    summary: {
      en: 'A corporate religious website built with React and Next.js, focused on performance and user experience.',
      es: 'Un sitio web corporativo religioso construido con React y Next.js, enfocado en el rendimiento y la experiencia de usuario.',
    },
    context: {
      en: 'Newman Club is a corporate religious website that stands out for its focus on performance and user experience. By combining client-side and server-side rendering, this platform ensures fast loading times and smooth navigation. Utilizing technologies such as HTML, CSS, JavaScript, React and Next.js, Newman Club offers an interactive and engaging experience for visitors.',
      es: 'Newman Club es un sitio web corporativo religioso que se destaca por su enfoque en el rendimiento y la experiencia de usuario. Al combinar renderizado en cliente y en servidor, la plataforma garantiza tiempos de carga rápidos y una navegación fluida. Con tecnologías como HTML, CSS, JavaScript, React y Next.js, Newman Club ofrece a sus visitantes una experiencia interactiva y atractiva.',
    },
    role: null,
    decisions: {
      en: 'One of the key highlights of Newman Club is its horizontal scaling capability in the database. Thanks to the implementation of efficient techniques and technologies, this religious website can seamlessly handle the growth of information and user interactions. This ensures scalability and adaptability as the religious community expands.',
      es: 'Uno de los puntos clave de Newman Club es su capacidad de escalar horizontalmente en la base de datos. Gracias a técnicas y tecnologías eficientes, el sitio puede manejar sin problemas el crecimiento de la información y de las interacciones de los usuarios. Esto le da escalabilidad y capacidad de adaptación a medida que crece la comunidad religiosa.',
    },
    result: {
      en: 'Newman Club takes pride in its pixel-perfect design and dedication to best practices in user experience. Every detail has been carefully considered to create a cohesive and visually pleasing interface that reflects the identity and values of the religious corporation. Leveraging tools like Figma, this religious website effectively conveys its message in a visually compelling manner.',
      es: 'Newman Club se enorgullece de su diseño pixel perfect y de su compromiso con las buenas prácticas de experiencia de usuario. Cada detalle se pensó con cuidado para crear una interfaz coherente y agradable a la vista, que refleja la identidad y los valores de la corporación religiosa. Con herramientas como Figma, el sitio transmite su mensaje de una forma visualmente atractiva.',
    },
    technologies: ['HTML', 'CSS', 'SASS', 'TYPESCRIPT', 'REACT', 'NEXT.JS', 'FIGMA'],
    image: {
      src: '/assets/imgs/projects/newMan.webp',
      alt: { en: 'Newman Club website on mobile', es: 'Sitio web de Newman Club en móvil' },
      width: 416,
      height: 879,
    },
    links: {
      live: 'https://newman-club-seven.vercel.app/',
      github: 'https://github.com/CHERCED-DEV/newmanClub',
    },
    order: 8,
    era: '2022-2023',
    highlights: [
      { es: 'Renderizado combinado en cliente y servidor para cargas rápidas', en: 'Combined client-side and server-side rendering for fast loading' },
      { es: 'Base de datos con capacidad de escalar horizontalmente', en: 'Horizontal scaling capability in the database' },
      { es: 'Diseño pixel perfect construido con Figma', en: 'Pixel-perfect design built with Figma' },
    ],
  },
  {
    id: '5',
    title: 'CENTRIBAL',
    summary: {
      en: 'A MERN and TypeScript dashboard to create orders and manage clients, products and inventory.',
      es: 'Un dashboard MERN con TypeScript para crear pedidos y gestionar clientes, productos e inventario.',
    },
    context: {
      en: 'Centribal is a comprehensive dashboard project that enables the creation of orders, management of clients and products, and efficient inventory control. Built using the MERN stack (MongoDB, Express, React, Node.js) with TypeScript, this project provides a robust solution for businesses to streamline their operations and enhance productivity.',
      es: 'Centribal es un dashboard completo que permite crear pedidos, gestionar clientes y productos, y controlar el inventario de forma eficiente. Construido con el stack MERN (MongoDB, Express, React y Node.js) y TypeScript, ofrece una solución robusta para que los negocios optimicen sus operaciones y mejoren su productividad.',
    },
    role: null,
    decisions: {
      en: 'The Centribal dashboard is designed to be responsive and follows a mobile-first approach, ensuring a seamless experience across devices. With its modular component and style architecture, the project promotes code reusability and maintainability, allowing for efficient development and scalability.',
      es: 'El dashboard de Centribal es responsive y sigue un enfoque mobile-first, para ofrecer una experiencia fluida en cualquier dispositivo. Su arquitectura modular de componentes y estilos favorece la reutilización y la mantenibilidad del código, lo que permite un desarrollo eficiente y escalable.',
    },
    result: {
      en: 'One of the key features of the Centribal project is its implementation of mixed rendering, combining server-side and client-side rendering. This approach optimizes the performance by generating a faster initial load time and improving the overall user experience. Additionally, the project utilizes memory caching techniques to further enhance performance, resulting in a smooth and efficient dashboard.',
      es: 'Una de las características clave de Centribal es su renderizado mixto, que combina renderizado en servidor y en cliente. Este enfoque optimiza el rendimiento con una carga inicial más rápida y mejora la experiencia de usuario en general. Además, el proyecto usa técnicas de caché en memoria para mejorar aún más el rendimiento, lo que da como resultado un dashboard fluido y eficiente.',
    },
    technologies: ['HTML', 'CSS', 'SASS', 'TYPESCRIPT', 'REACT', 'NEXT.JS', 'FIGMA'],
    image: {
      src: '/assets/imgs/projects/Centribal.png',
      alt: { en: 'CENTRIBAL dashboard on mobile', es: 'Dashboard de CENTRIBAL en móvil' },
      width: 418,
      height: 878,
    },
    links: {
      live: 'https://centribal.vercel.app/',
      github: 'https://github.com/CHERCED-DEV/centribal',
    },
    order: 9,
    era: '2022-2023',
    highlights: [
      { es: 'Pedidos, clientes, productos e inventario en un solo dashboard', en: 'Orders, clients, products and inventory in one dashboard' },
      { es: 'Renderizado mixto en servidor y cliente para una carga inicial más rápida', en: 'Mixed server-side and client-side rendering for a faster initial load' },
      { es: 'Caché en memoria para mejorar el rendimiento', en: 'Memory caching to further enhance performance' },
      { es: 'Responsive y mobile-first', en: 'Responsive and mobile-first' },
    ],
  },
  {
    id: '6',
    title: 'My Website',
    summary: {
      en: 'My first personal website: I built it in HTML and CSS, moved it to VanillaJS and later migrated it to React with Next.js.',
      es: 'Mi primer sitio personal: lo construí en HTML y CSS, lo pasé a VanillaJS y después lo migré a React con Next.js.',
    },
    context: {
      en: 'My project "My Website" has been my personal challenge from the start. I started building it in HTML and CSS, and over time, I have been transforming it. I first made it in VanillaJS, and now I have migrated it to React, using Next.js as a framework. In the future, I plan to add a blog to the page to keep visitors updated on my projects and thoughts.\n\nLooking back, I realize that this page reflects my evolution as a developer. Although I am a little embarrassed to see all the bad practices I used in the past, it is exciting to see how I have improved and grown as a programmer. Keeping this project reminds me that it is important not to be afraid to experiment and try new things, even if that means making mistakes.',
      es: 'Mi proyecto "My Website" ha sido mi reto personal desde el principio. Empecé a construirlo en HTML y CSS y con el tiempo lo he ido transformando. Primero lo hice en VanillaJS y ahora lo migré a React, con Next.js como framework. En el futuro pienso agregarle un blog para mantener a los visitantes al tanto de mis proyectos y mis ideas.\n\nMirando hacia atrás, me doy cuenta de que esta página refleja mi evolución como desarrollador. Aunque me da un poco de vergüenza ver todas las malas prácticas que usaba antes, es emocionante ver cuánto he mejorado y crecido como programador. Mantener este proyecto me recuerda que es importante no tenerle miedo a experimentar y probar cosas nuevas, aunque eso signifique equivocarse.',
    },
    role: null,
    decisions: null,
    result: {
      en: 'Despite its imperfections, I feel a great affection for "My Website". I love seeing how it has changed over time and how it has transformed into something better. This project represents my love for programming and my passion for learning. I hope that visitors to the page enjoy its design and content, and that it inspires them to continue experimenting and evolving as developers.',
      es: 'A pesar de sus imperfecciones, le tengo mucho cariño a "My Website". Me encanta ver cómo ha cambiado con el tiempo y cómo se ha transformado en algo mejor. Este proyecto representa mi amor por la programación y mi pasión por aprender. Espero que quienes visiten la página disfruten su diseño y su contenido, y que los inspire a seguir experimentando y evolucionando como desarrolladores.',
    },
    technologies: ['HTML', 'CSS', 'SASS', 'JAVASCRIPT', 'REACT', 'NEXT.JS', 'FIGMA', 'SWEETALERT2'],
    image: {
      src: '/assets/imgs/projects/webSite.webp',
      alt: {
        en: 'My Website home page on mobile, with my portrait',
        es: 'Página de inicio de My Website en móvil, con mi retrato',
      },
      width: 422,
      height: 904,
    },
    links: {
      live: 'https://mywebsite-peach.vercel.app/',
      github: 'https://github.com/Cherced/mywebsite',
    },
    order: 10,
    era: '2022-2023',
    highlights: [
      { es: 'De HTML y CSS a VanillaJS, y luego a React con Next.js', en: 'From HTML and CSS to VanillaJS, then to React with Next.js' },
      { es: 'El reflejo de mi evolución como desarrollador', en: 'A reflection of my evolution as a developer' },
    ],
  },
  {
    id: '7',
    title: 'E-Shop',
    summary: {
      en: 'An online store built with React and Webpack, with a shopping cart managed with Hooks.',
      es: 'Una tienda online construida con React y Webpack, con un carrito de compras manejado con Hooks.',
    },
    context: {
      en: 'This web application is built using React, a popular JavaScript library for building user interfaces, and configured with Webpack, a popular build tool that helps manage assets and dependencies. The app allows users to browse and purchase items through a shopping cart feature, which is managed using Hooks, a new addition to React that allows for more concise and efficient code.',
      es: 'Esta aplicación web está construida con React, una librería de JavaScript muy popular para construir interfaces de usuario, y configurada con Webpack, una herramienta de build muy popular que ayuda a manejar assets y dependencias. La aplicación permite explorar y comprar productos con un carrito de compras, que se maneja con Hooks, una novedad de React que permite escribir código más conciso y eficiente.',
    },
    role: null,
    decisions: {
      en: 'The shopping cart functionality includes the ability to add and remove items, update the cart total and check out securely. These actions are handled through Axios, a popular HTTP client library that simplifies making requests to external APIs. The app also utilizes responsive design to ensure that the user experience is optimized on both desktop and mobile devices.',
      es: 'El carrito permite agregar y quitar productos, actualizar el total y pagar de forma segura. Estas acciones se manejan con Axios, una librería cliente HTTP muy popular que simplifica las peticiones a APIs externas. La aplicación también usa diseño responsive para que la experiencia de usuario esté optimizada tanto en escritorio como en móvil.',
    },
    result: {
      en: 'Overall, this web application is a modern and efficient solution for online shopping. By utilizing React, Webpack, Hooks and Axios, it is able to deliver a fast and responsive experience to users, while also providing a robust shopping cart system that is easy to use and secure.',
      es: 'En resumen, esta aplicación web es una solución moderna y eficiente para comprar en línea. Gracias a React, Webpack, Hooks y Axios, ofrece una experiencia rápida y responsive, además de un carrito de compras robusto, fácil de usar y seguro.',
    },
    technologies: ['HTML', 'CSS', 'JAVASCRIPT', 'REACT', 'WEBPACK', 'FIGMA'],
    image: {
      src: '/assets/imgs/projects/eshop.webp',
      alt: { en: 'E-Shop product grid on mobile', es: 'Cuadrícula de productos de E-Shop en móvil' },
      width: 418,
      height: 871,
    },
    links: {
      live: 'https://e-shop-cherced.netlify.app/',
      github: 'https://github.com/CHERCED-DEV/react-Shop.git',
    },
    order: 11,
    era: '2022-2023',
    highlights: [
      { es: 'Carrito con Hooks para agregar y quitar productos y actualizar el total', en: 'Shopping cart with Hooks to add and remove items and update the total' },
      { es: 'Peticiones a APIs externas con Axios', en: 'Requests to external APIs with Axios' },
      { es: 'Assets y dependencias configurados con Webpack', en: 'Assets and dependencies configured with Webpack' },
    ],
  },
  {
    id: '8',
    title: 'GET IT DONE',
    summary: {
      en: 'A personal task tracker that measures effectiveness over different time scales and uses AI models to suggest how to improve.',
      es: 'Un gestor personal de tareas que mide la efectividad en distintas escalas de tiempo y usa modelos de inteligencia artificial para sugerir cómo mejorar.',
    },
    context: {
      en: 'The "GET IT DONE" project is a personal task control tool that allows users to evaluate their effectiveness over different time scales. Its aim is to help users improve their personal productivity and performance. The project incorporates artificial intelligence models to evaluate task results and suggest relevant content to help users improve their weaknesses.',
      es: 'El proyecto "GET IT DONE" es una herramienta personal de control de tareas que permite evaluar la propia efectividad en distintas escalas de tiempo. Su objetivo es ayudar a mejorar la productividad y el desempeño personal. El proyecto incorpora modelos de inteligencia artificial que evalúan los resultados de las tareas y sugieren contenido relevante para trabajar en los puntos débiles.',
    },
    role: null,
    decisions: {
      en: 'The project has been developed using modern technologies such as HTML, CSS, SASS, JavaScript, React, Next.js, Figma, Next Auth, Next Redux, SweetAlert2 and Next-Router, among others. The platform is intuitive and easy to use, allowing users to create, organize and track their tasks effectively. The project also features a user-friendly and attractive interface, making it visually appealing and easy to navigate.',
      es: 'El proyecto se desarrolló con tecnologías modernas como HTML, CSS, SASS, JavaScript, React, Next.js, Figma, Next Auth, Next Redux, SweetAlert2 y Next-Router, entre otras. La plataforma es intuitiva y fácil de usar: permite crear, organizar y hacer seguimiento de las tareas de forma efectiva. Además, tiene una interfaz amigable y atractiva, agradable a la vista y fácil de navegar.',
    },
    result: {
      en: 'In summary, "GET IT DONE" is a comprehensive personal task control platform that utilizes advanced technologies to improve user effectiveness over different time scales. The combination of artificial intelligence models, friendly design and modern technologies makes this tool an excellent option for anyone looking to improve their personal productivity and performance. Additionally, the project source code is available on GitHub for other developers to study and contribute to its continuous improvement.',
      es: 'En resumen, "GET IT DONE" es una plataforma completa de control personal de tareas que usa tecnologías avanzadas para mejorar la efectividad en distintas escalas de tiempo. La combinación de modelos de inteligencia artificial, un diseño amigable y tecnologías modernas la convierte en una excelente opción para quien quiera mejorar su productividad y su desempeño personal. Además, el código fuente está disponible en GitHub para que otros desarrolladores lo estudien y contribuyan a mejorarlo.',
    },
    technologies: [
      'HTML',
      'CSS',
      'SASS',
      'JAVASCRIPT',
      'REACT',
      'NEXT.JS',
      'FIGMA',
      'NEXT AUTH',
      'NEXT REDUX',
      'SWEETALERT2',
      'NEXT-ROUTER',
    ],
    image: {
      src: '/assets/imgs/projects/doItDone.png',
      alt: { en: 'GET IT DONE task list on mobile', es: 'Lista de tareas de GET IT DONE en móvil' },
      width: 436,
      height: 934,
    },
    links: {
      live: 'https://ge-it-done.vercel.app/',
      github: 'https://github.com/Cherced/GeItDone.git',
    },
    order: 12,
    era: '2022-2023',
    highlights: [
      { es: 'Mide la efectividad en distintas escalas de tiempo', en: 'Measures effectiveness over different time scales' },
      { es: 'Modelos de inteligencia artificial que evalúan los resultados y sugieren contenido', en: 'Artificial intelligence models that evaluate results and suggest content' },
      { es: 'Código fuente disponible en GitHub', en: 'Source code available on GitHub' },
    ],
  },
  {
    id: '9',
    title: 'Studio Ghibli Tracking System',
    summary: {
      en: 'A web app from the Platzi Master bootcamp for Studio Ghibli fans to keep track of their favorite movies, characters and directors.',
      es: 'Una aplicación web del bootcamp Platzi Master para que los fans de Studio Ghibli lleven el registro de sus películas, personajes y directores favoritos.',
    },
    context: {
      en: 'The Studio Ghibli Tracking System is a web application developed as part of the Platzi Master bootcamp. This project is designed for Studio Ghibli fans who want to keep track of their favorite movies, characters and directors. The application features a user-friendly interface, developed with HTML, CSS and SASS, which makes it easy to navigate and use. The system is also responsive, allowing users to access it from any device, including desktops, tablets and mobile phones.',
      es: 'Studio Ghibli Tracking System es una aplicación web desarrollada como parte del bootcamp Platzi Master. Está pensada para los fans de Studio Ghibli que quieren llevar el registro de sus películas, personajes y directores favoritos. La aplicación tiene una interfaz amigable, desarrollada con HTML, CSS y SASS, que la hace fácil de navegar y de usar. Además, es responsive, así que se puede usar desde cualquier dispositivo: computadores de escritorio, tablets y celulares.',
    },
    role: null,
    decisions: {
      en: 'In addition to the design of the interface, the project also involves the implementation of state management using React and Next.js. The application integrates with a REST API backend, which was developed by the project owner. The technologies used in this project also include Next Auth and Next Redux, which provide secure and reliable authentication and data management. Furthermore, SweetAlert2 and Next-Router were used to enhance the user experience by providing notifications and seamless navigation, respectively.',
      es: 'Además del diseño de la interfaz, el proyecto incluye el manejo de estado con React y Next.js. La aplicación se integra con un backend de API REST desarrollado por el dueño del proyecto. Entre las tecnologías también están Next Auth y Next Redux, que aportan autenticación y manejo de datos seguros y confiables. Por último, SweetAlert2 y Next-Router mejoran la experiencia de usuario con notificaciones y una navegación fluida, respectivamente.',
    },
    result: {
      en: 'Overall, the Studio Ghibli Tracking System is a comprehensive application that demonstrates my skills in front-end design and back-end development. The project is available on GitHub for those who want to contribute or explore the code. Check out the deployed version of the project through its link.',
      es: 'En resumen, Studio Ghibli Tracking System es una aplicación completa que demuestra mis habilidades en diseño front-end y desarrollo back-end. El proyecto está en GitHub para quien quiera contribuir o explorar el código. Mira la versión desplegada del proyecto en su enlace.',
    },
    technologies: [
      'HTML',
      'CSS',
      'SASS',
      'JAVASCRIPT',
      'REACT',
      'NEXT.JS',
      'FIGMA',
      'NEXT AUTH',
      'NEXT REDUX',
      'SWEETALERT2',
      'NEXT-ROUTER',
      'APIREST OWNBACKEND',
    ],
    image: {
      src: '/assets/imgs/projects/ghibliTracker.png',
      alt: {
        en: 'Studio Ghibli Tracking System sign-in screen on mobile',
        es: 'Pantalla de inicio de sesión de Studio Ghibli Tracking System en móvil',
      },
      width: 383,
      height: 852,
    },
    links: {
      live: 'https://studio-ghibli-theta.vercel.app/',
      github: 'https://github.com/Cherced/studio-ghibli',
    },
    order: 13,
    era: '2022-2023',
    highlights: [
      { es: 'Registro de películas, personajes y directores favoritos', en: 'Keeps track of favorite movies, characters and directors' },
      { es: 'Integración con un backend de API REST', en: 'Integrated with a REST API backend' },
      { es: 'Responsive en computadores de escritorio, tablets y celulares', en: 'Responsive on desktops, tablets and mobile phones' },
    ],
  },
  {
    id: '10',
    title: 'Studio Ghibli BackOffice',
    summary: {
      en: 'An account administration platform for Studio Ghibli clients that I developed at the Platzi Master bootcamp.',
      es: 'Una plataforma de administración de cuentas para clientes de Studio Ghibli que desarrollé en el bootcamp Platzi Master.',
    },
    context: {
      en: 'The Studio Ghibli BackOffice is a project that I developed as part of the Platzi Master bootcamp. It is an account administration platform for Studio Ghibli clients.',
      es: 'Studio Ghibli BackOffice es un proyecto que desarrollé como parte del bootcamp Platzi Master. Es una plataforma de administración de cuentas para los clientes de Studio Ghibli.',
    },
    role: {
      en: "During the project's development, I was responsible for designing the interface and implementing responsive and state design. I also collaborated with the backend team to generate fake data and create the necessary endpoints to make the platform work correctly.",
      es: 'Durante el desarrollo fui responsable de diseñar la interfaz e implementar el diseño responsive y el manejo de estado. También colaboré con el equipo de backend para generar datos de prueba y crear los endpoints necesarios para que la plataforma funcionara correctamente.',
    },
    decisions: {
      en: 'As for the technologies used, a set of popular web development tools was employed, such as HTML, CSS and JavaScript. In addition, frameworks such as React and Next.js were used to build the application. Libraries like Next Auth and Next Redux were also implemented to manage authentication and data storage in the application. Other tools used include Figma for interface design and SweetAlert2 to display alerts in the application.',
      es: 'En cuanto a tecnologías, se usaron herramientas populares de desarrollo web como HTML, CSS y JavaScript. Además, la aplicación se construyó con frameworks como React y Next.js, y se implementaron librerías como Next Auth y Next Redux para manejar la autenticación y el almacenamiento de datos. Entre otras herramientas, se usaron Figma para diseñar la interfaz y SweetAlert2 para mostrar alertas.',
    },
    result: {
      en: 'In summary, the Studio Ghibli BackOffice is a well-designed and complete platform for managing Studio Ghibli client accounts. With its responsive design and well-implemented state, users can access the platform from any device and have a seamless experience. Moreover, the application uses a set of popular web development tools, making it easy to maintain and improve in the future.',
      es: 'En resumen, Studio Ghibli BackOffice es una plataforma completa y bien diseñada para administrar las cuentas de los clientes de Studio Ghibli. Gracias a su diseño responsive y a un manejo de estado bien implementado, se puede usar desde cualquier dispositivo con una experiencia fluida. Además, la aplicación usa herramientas populares de desarrollo web, lo que la hace fácil de mantener y mejorar en el futuro.',
    },
    technologies: [
      'HTML',
      'CSS',
      'SASS',
      'JAVASCRIPT',
      'REACT',
      'NEXT.JS',
      'FIGMA',
      'NEXT AUTH',
      'NEXT REDUX',
      'SWEETALERT2',
      'NEXT-ROUTER',
      'APIREST OWNBACKEND',
    ],
    image: {
      src: '/assets/imgs/projects/ghibliBackofice.webp',
      alt: {
        en: 'Studio Ghibli BackOffice dashboard on desktop',
        es: 'Dashboard de Studio Ghibli BackOffice en escritorio',
      },
      width: 1928,
      height: 1088,
    },
    links: { live: null, github: null },
    order: 14,
    era: '2022-2023',
    highlights: [
      { es: 'Diseño de la interfaz, responsive y manejo de estado a mi cargo', en: 'I owned the interface design, the responsive design and the state' },
      { es: 'Datos de prueba y endpoints junto al equipo de backend', en: 'Fake data and endpoints built with the backend team' },
      { es: 'Autenticación y datos con Next Auth y Next Redux', en: 'Authentication and data storage with Next Auth and Next Redux' },
    ],
  },
  {
    id: '11',
    title: 'BookingUI system',
    summary: {
      en: 'An Airbnb-inspired booking system that I built with senior students during a bootcamp.',
      es: 'Un sistema de reservas inspirado en Airbnb que construí con estudiantes más avanzados durante un bootcamp.',
    },
    context: {
      en: 'As a dedicated bootcamp participant, I was given the opportunity to collaborate with senior students on a project that would test my skills and push me to learn new ones. The result was the development of a sophisticated booking system inspired by Airbnb. The system features an intuitive user interface that allows users to browse, search and book listings with ease.',
      es: 'Como participante comprometido de un bootcamp, tuve la oportunidad de colaborar con estudiantes más avanzados en un proyecto que pondría a prueba mis habilidades y me empujaría a aprender otras nuevas. El resultado fue un sistema de reservas sofisticado inspirado en Airbnb, con una interfaz intuitiva que permite explorar, buscar y reservar alojamientos con facilidad.',
    },
    role: null,
    decisions: {
      en: 'Built using HTML, CSS, SASS, JavaScript, React and Next.js, the BookingUI system is a testament to my ability to work with cutting-edge technologies. I also utilized popular design tools such as Figma to create a visually appealing interface that is both functional and aesthetically pleasing.',
      es: 'Construido con HTML, CSS, SASS, JavaScript, React y Next.js, BookingUI system demuestra mi capacidad para trabajar con tecnologías de punta. También usé herramientas de diseño populares como Figma para crear una interfaz atractiva, funcional y estética.',
    },
    result: {
      en: 'In addition to its technical features, the BookingUI system also incorporates Next Auth, Next Redux and SweetAlert2 to enhance its performance and user experience. With its seamless integration of multiple technologies, the BookingUI system is a prime example of my ability to tackle complex projects and deliver high-quality results. Check out the live version of the project on the link provided, or visit the GitHub repository for more information on the codebase.',
      es: 'Además de sus características técnicas, BookingUI system incorpora Next Auth, Next Redux y SweetAlert2 para mejorar su rendimiento y la experiencia de usuario. Con su integración fluida de varias tecnologías, es un claro ejemplo de mi capacidad para abordar proyectos complejos y entregar resultados de alta calidad. Mira la versión en vivo del proyecto en su enlace, o visita el repositorio de GitHub para conocer más sobre el código.',
    },
    technologies: [
      'HTML',
      'CSS',
      'SASS',
      'JAVASCRIPT',
      'REACT',
      'NEXT.JS',
      'FIGMA',
      'NEXT AUTH',
      'NEXT REDUX',
      'SWEETALERT2',
    ],
    image: {
      src: '/assets/imgs/projects/bookingUI.png',
      alt: {
        en: 'BookingUI system user list in the admin panel, on desktop',
        es: 'Lista de usuarios del panel de administración de BookingUI system, en escritorio',
      },
      width: 1520,
      height: 990,
    },
    links: {
      live: 'https://booking-ui-ashen.vercel.app/',
      github: 'https://github.com/Cherced/BookingUi',
    },
    order: 15,
    era: '2022-2023',
    highlights: [
      { es: 'Explorar, buscar y reservar alojamientos, inspirado en Airbnb', en: 'Browse, search and book listings, inspired by Airbnb' },
      { es: 'Construido junto a estudiantes más avanzados del bootcamp', en: 'Built together with senior bootcamp students' },
      { es: 'Next Auth, Next Redux y SweetAlert2 integrados', en: 'Next Auth, Next Redux and SweetAlert2 integrated' },
    ],
  },
  {
    id: '12',
    title: 'Synergos',
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
      es: `Partir el backend por atomicidad, no por dominio: ${facts.capabilities} capacidades que no saben de negocios. Booking sabe de "recurso, ventana y cupo"; no sabe que el recurso es un médico. Orquestadores de saga por vertical, con la compensación tratada como dato. Las reglas de arquitectura son tests que rompen el build. El design system sale por CDN como custom elements, así que lo que cruza la frontera es DOM, no framework.`,
      en: `Split the backend by atomicity, not by domain: ${facts.capabilities} capabilities that know nothing about any business. Booking knows "resource, window and slot"; it does not know the resource is a doctor. Saga orchestrators per vertical, with compensation treated as data. Architecture rules are tests that break the build. The design system ships through a CDN as custom elements, so what crosses the boundary is DOM, not a framework.`,
    },
    result: {
      es: `${facts.pieces} piezas desplegables: un CMS, ${facts.capabilities} capacidades, ${facts.orchestrators} orquestadores y un proxy. El tercer y el cuarto orquestador entraron sin una sola capacidad nueva. Más de ${formatFact(facts.testsAtLeast, 'es')} tests automatizados, más de ${formatFact(facts.adrsAtLeast, 'es')} decisiones de arquitectura documentadas y un design system de más de ${formatFact(facts.designSystemAtLeast, 'es')} elementos en CDN propio.`,
      en: `${facts.pieces} deployable pieces: a CMS, ${facts.capabilities} capabilities, ${facts.orchestrators} orchestrators and a proxy. The third and fourth orchestrators shipped without a single new capability. ${formatFloor(facts.testsAtLeast, 'en')} automated tests, ${formatFloor(facts.adrsAtLeast, 'en')} documented architecture decisions and a design system of ${formatFloor(facts.designSystemAtLeast, 'en')} elements on its own CDN.`,
    },
    technologies: ['.NET 8', 'C#', 'ASP.NET CORE', 'UMBRACO 13', 'ANGULAR', 'WEB COMPONENTS', 'NX', 'CLOUDFLARE WORKERS', 'DOCKER', 'GITHUB ACTIONS', 'SPEC KIT', 'AI CODING AGENTS'],
    image: {
      src: '/assets/imgs/projects/synergos-en.svg',
      localizedSrc: { es: '/assets/imgs/projects/synergos-es.svg', en: '/assets/imgs/projects/synergos-en.svg' },
      alt: {
        en: 'Synergos layered architecture diagram: CDN resources feed Umbraco (.NET) as the composition layer, which serves micro-frontends and Web Components on any web framework',
        es: 'Diagrama de la arquitectura por capas de Synergos: los recursos en CDN alimentan a Umbraco (.NET) como capa de composición, que sirve micro-frontends y Web Components en cualquier framework web',
      },
      width: 960,
      height: 640,
    },
    links: {
      live: 'https://synergos-ui.synergos-labs.workers.dev/',
      github: null,
      repos: [
        { label: 'Synergos.CMS', href: 'https://github.com/CHERCED-DEV/Synergos.CMS' },
        { label: 'Synergos.UI', href: 'https://github.com/CHERCED-DEV/Synergos.UI' },
        { label: 'Synergos.Fabrica', href: 'https://github.com/CHERCED-DEV/Synergos.Fabrica' },
      ],
    },
    order: 1,
    era: '2024-2026',
    highlights: [
      {
        es: `${facts.pieces} piezas desplegables: un CMS, ${facts.capabilities} capacidades, ${facts.orchestrators} orquestadores y un proxy`,
        en: `${facts.pieces} deployable pieces: a CMS, ${facts.capabilities} capabilities, ${facts.orchestrators} orchestrators and a proxy`,
      },
      {
        es: 'El tercer y el cuarto orquestador entraron sin una sola capacidad nueva',
        en: 'The third and fourth orchestrators shipped without a single new capability',
      },
      {
        es: `Más de ${formatFact(facts.testsAtLeast, 'es')} tests automatizados, incluidos gates de arquitectura`,
        en: `${formatFloor(facts.testsAtLeast, 'en')} automated tests, including architecture gates`,
      },
      {
        es: `Más de ${formatFact(facts.adrsAtLeast, 'es')} decisiones de arquitectura documentadas`,
        en: `${formatFloor(facts.adrsAtLeast, 'en')} documented architecture decisions`,
      },
      {
        es: `Un design system de más de ${formatFact(facts.designSystemAtLeast, 'es')} elementos en CDN propio`,
        en: `A design system of ${formatFloor(facts.designSystemAtLeast, 'en')} elements on its own CDN`,
      },
    ],
    adrCards: [
      {
        decision: { es: 'Capacidades agnósticas del dominio', en: 'Domain-agnostic capabilities' },
        why: { es: 'Que el vertical nuevo no cueste lo mismo que el primero.', en: "So a new vertical doesn't cost as much as the first one." },
        tradeoff: {
          es: 'Las referencias externas viajan como pares opacos (Kind, Id), sin ramificar.',
          en: 'External references travel as opaque (Kind, Id) pairs, never branched on.',
        },
      },
      {
        decision: { es: 'La compensación es dato, no función', en: 'Compensation is data, not a function' },
        why: { es: 'Una reserva no se deshace igual que un apartado.', en: "A booking isn't undone the same way as a hold." },
        tradeoff: {
          es: 'Hay que reescribir la compensación cada vez que cambia el estado.',
          en: 'Compensation must be rewritten every time the state changes.',
        },
      },
      {
        decision: { es: 'Reglas de arquitectura como tests', en: 'Architecture rules as tests' },
        why: {
          es: 'Una convención escrita se olvida; una que rompe el build se cumple.',
          en: 'A written convention gets forgotten; one that breaks the build gets followed.',
        },
        tradeoff: {
          es: 'Cada gate se muta antes de confiar en él: un gate que nunca falló no vigila nada.',
          en: "Every gate is mutated before it's trusted: a gate that never failed isn't watching anything.",
        },
      },
      {
        decision: { es: 'Correlación propia, sin OpenTelemetry por ahora', en: 'Own correlation ID, no OpenTelemetry for now' },
        why: {
          es: 'Un identificador viaja por seis servicios y sale en cada línea de log.',
          en: 'One ID travels through six services and shows up in every log line.',
        },
        tradeoff: {
          es: 'Decisión documentada, con el disparador que la haría cambiar.',
          en: 'Documented decision, with the trigger that would change it.',
        },
      },
    ],
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
  },
  {
    id: '13',
    title: { es: 'Director y líneas: agentes de IA en paralelo', en: 'Director & lines: parallel AI agents' },
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
    links: {
      live: null,
      github: null,
      repos: [{ label: 'Synergos.Fabrica', href: 'https://github.com/CHERCED-DEV/Synergos.Fabrica' }],
    },
    order: 2,
    era: '2026',
    highlights: [
      {
        es: 'Una sola sesión toca lo compartido; cada línea, solo su worktree',
        en: 'Only one session touches shared code; each line, only its own worktree',
      },
      { es: 'Cada tarea trazada a su commit y a la bitácora de su línea', en: 'Every task traced to its commit and its line log' },
      {
        es: '19 lotes de decisiones resueltos entre octubre y noviembre de 2026',
        en: '19 decision batches resolved between October and November 2026',
      },
    ],
  },
  {
    id: '14',
    title: { es: 'Espacio de trabajo legal', en: 'Legal workspace' },
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
    order: 4,
    era: '2026',
    highlights: [
      { es: 'Nada se consolida sin revisión humana', en: 'Nothing is consolidated without human review' },
      {
        es: 'Banco de evaluaciones en verde y reglas probadas con mutantes',
        en: 'A green evaluation bench and rules proven with mutants',
      },
      { es: '13 decisiones de arquitectura documentadas', en: '13 documented architecture decisions' },
    ],
  },
  {
    id: '15',
    title: { es: 'Puente de eventos: AWS → Azure', en: 'Event bridge: AWS → Azure' },
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
    order: 5,
    era: '2026',
    highlights: [
      { es: 'Azure Service Bus como frontera entre nubes', en: 'Azure Service Bus as the boundary between clouds' },
      { es: 'Productores y consumidores desacoplados', en: 'Producers and consumers decoupled' },
      { es: 'Un consumidor .NET que escala según la carga', en: 'A .NET consumer that scales with the load' },
    ],
  },
]
