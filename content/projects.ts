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
    technologies: ['HTML', 'CSS', 'SASS', 'JAVASCRIPT', 'REACT', 'NEXTJS', 'FIGMA'],
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
    order: 3,
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
    technologies: ['HTML', 'CSS', 'SASS', 'TYPESCRIPT', 'REACT', 'NEXTJS', 'FIGMA'],
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
    order: 4,
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
    technologies: ['HTML', 'CSS', 'SASS', 'TYPESCRIPT', 'REACT', 'NEXTJS', 'FIGMA'],
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
    order: 5,
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
    technologies: ['HTML', 'CSS', 'SASS', 'JAVASCRIPT', 'REACT', 'NEXTJS', 'FIGMA', 'SWEETALERT2'],
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
    order: 6,
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
    order: 7,
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
      'NEXTJS',
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
    order: 8,
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
      'NEXTJS',
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
    order: 9,
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
      'NEXTJS',
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
    order: 10,
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
      'NEXTJS',
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
    order: 11,
  },
]
