import { LayOutConfig , HomeBannerConfig, AboutMeConfig, PortfolioConfig, ContactMeConfig} from "./interfaces";

export const CMS: {
	[key: string]:
    LayOutConfig | HomeBannerConfig 
	| AboutMeConfig | PortfolioConfig |
	ContactMeConfig 
} = {
    layOut: {
        header: {
            brandImage: {
                src: '/assets/icons/brandLogo.png',
                alt: 'CHERCED logo',
            },
            buttonMenu: {
                src: '/assets/icons/navbar.png',
                alt: 'menu button',
            },
            backTo: {
                src: '/assets/icons/backTo.png',
                alt: 'BackTo',
            }
        },
        footer: {
            backOption: {
                img: {
                    src: '/assets/icons/arrowFooter.png',
                    alt: 'arrow back to top',
                },
                text: 'BACK TO TOP',
                link: {
                    href: '#header'
                }
            },
            footerSocialMedia: [
                {
                    src: '/assets/icons/facebookIcon.png',
                    alt: 'faceBook icon',

                    a: 'https://www.bbc.com/mundo/noticias-51225114'
                },
                {
    
                    src: '/assets/icons/linkedInIcon.png',
                    alt: 'linkedIn icon',

                    a: 'https://www.linkedin.com/in/cherced/'
                },
                {
                    src: '/assets/icons/instagramIcon.png',
                    alt: 'instagram icon',

                    a: 'https://www.instagram.com/cherced/'
                },
                {
                    src: '/assets/icons/gmailIcon.png',
                    alt: 'gmail icon',

                    a: 'mailto:chernandezcediel@gmail.com'
                },
            ],
            copyright: {
                strongText: '@2023 Camilo Hernandez',
                normalText: 'All Rigths Reserved',
            }
        }
    },	
	homeBanner: {
		homeBannerTitles: {
			textParragraph: 'My name is',
			textStrong: 'Camilo',
			mainTitle: 'I’M A DEVELOPER'
		},
		separator: {
			src: '/assets/icons/separatorWhite.png',
			alt: 'separator line'
		},
		homeSocialMedia: [
			{
				src: '/assets/icons/mailito.png',
				alt: 'mailito icon',
				a: 'mailto:chernandezcediel@gmail.com'
			},
			{
				src: '/assets/icons/githubCircle.png',
				alt: 'github icon',
				a: 'https://github.com/CHERCED-DEV'
			},
			{
				src: '/assets/icons/linkedinCircle.png',
				alt: 'linkedin icon',
				a: 'https://www.linkedin.com/in/cherced/'
			}
		]
	},
	aboutMe: {
		description: {
			mainTitle: "About Me!",
			description: "I am a front-end developer with experience in developing highly interactive and high-performance web applications. I specialize in React and Angular, and have company knowledge of HTML, CSS, JavaScript, TypeScript, Node.js, and Next.js.",
			parallax: {
				src: '/assets/imgs/meParallax.png',
				alt: 'CHERCED'
			},
		},
		career: {
			mainTitle: "Career",
			proExp: [
				{
					initialDate: "Jul 22",
					endingDate: "Actually",
					expTitleDescription: {
						expTitle: "Frontend Developer",
						company: "Newshore (a FLYR Labs company)",
						descriptionExp: "responsible for creating the user interface and user experience on the flight reservation website. This includes designing and building visual elements such as buttons, menus and forms, as well as ensuring the website is easy to navigate and use for customers. They will also work closely with the back-end development team to ensure proper system functionality integration. They also ensure the website is compatible with different devices and browsers, and perform testing and debugging to troubleshoot technical issues. In summary, a Frontend developer at an airline booking web app company creates and maintains the user interface of the website, and works with the back-end team to ensure system integration."
					}
				},
				{
					initialDate: "Feb 22",
					endingDate: "Jun 22",
					expTitleDescription: {
						expTitle: "Frontend Developer",
						company: "Frontend Web Developer -- Platzi Master [CX]",
						descriptionExp: "Platzi Master is an online bootcamp for learning frontend development skills. It offers courses in technologies such as HTML, CSS, JavaScript, and React, as well as hands-on projects and personalized mentorship with industry professionals. The goal of the bootcamp is to help students become skilled frontend developers and find employment in the field."
					}
				},
				{
					initialDate: "Jan 20",
					endingDate: "Nov 21",
					expTitleDescription: {
						expTitle: "Frontend Developer",
						company: "Growup IT",
						descriptionExp: "Frontend developer responsible for improving and optimizing the existing code of a commercial services company's website. This includes identifying and solving performance issues, rewriting code, and updating the code to meet the latest trends and standards. They also create and maintain visual styles using CSS, ensuring the website looks and performs well on different devices and browsers. In summary, a Frontend developer is responsible for improving and optimizing the website's code and ensuring the website's design and visual styles are attractive and consistent."
					}
				},
				{
					initialDate: "Oct 16",
					endingDate: "May 20",
					expTitleDescription: {
						expTitle: "Bussines Manager",
						company: "Squadra Arquitectura",
						descriptionExp: "An administrator and founder of a company focused on the development and remodeling of hospital architecture manages and oversees construction projects, negotiates with clients and suppliers, and represents the company in public bidding. In summary, the administrator and founder leads the hospital architecture projects, handles negotiations, and represents the company in public bidding."
					}
				},
			],
		},
		skills: {
			mainTitle: "Skills",
			description: "I am a front-end and full-stack developer with experience in a variety of technologies and skills such as:",
			bullets: [
				"HTML5 semantics to structure web page content in an accessible and standardized way.",
				"CSS, Sass, and Less to style and bring life to web pages.",
				"JavaScript and TypeScript to create interactivity and logic on web pages.",
				"RESTful APIs to communicate with the back-end and retrieve dynamic data.",
				"ReactJs for developing highly interactive components and web applications.",
				"NodeJs for developing build scripts and automations and for creating back-end applications.",
				"Angular for developing complex web applications.",
				"NextJs for optimizing web application performance and SEO.",
				"NPM for managing project packages and dependencies.",
				"Knowledge in tools such as Umbraco and other CMSs for developing and maintaining."
			],
			techList: [
                {
					techName: "REACT",
					img: {
						src: "/assets/icons/skillsIcon/react.png",
						alt: "REACT",
					},
					progress: "75"
				},
                {
					techName: "NEXTJS",
					img: {
						src: "/assets/icons/skillsIcon/nextjs.png",
						alt: "NEXTJS",
					},
					progress: "80"
				},
                {
					techName: "TYPESCRIPT",
					img: {
						src: "/assets/icons/skillsIcon/typescript.png",
						alt: "TYPESCRIPT",
					},
					progress: "80"
				},
                {
					techName: "NODEJS",
					img: {
						src: "/assets/icons/skillsIcon/nodejs.png",
						alt: "NODEJS",
					},
					progress: "75"
				},
                {
					techName: "MONGO",
					img: {
						src: "/assets/icons/skillsIcon/mongodb.png",
						alt: "MONGO",
					},
					progress: "60"
				},
                {
					techName: "JAVASCRIPT",
					img: {
						src: "/assets/icons/skillsIcon/js.png",
						alt: "JAVASCRIPT",
					},
					progress: "90"
				},
                {
					techName: "ANGULAR",
					img: {
						src: "/assets/icons/skillsIcon/angular.png",
						alt: "ANGULAR",
					},
					progress: "50"
				},
                {
					techName: "SASS",
					img: {
						src: "/assets/icons/skillsIcon/sass.png",
						alt: "SASS",
					},
					progress: "90"
				},
				{
					techName: "HTML5",
					img: {
						src: "/assets/icons/skillsIcon/html-5.png",
						alt: "HTML5",
					},
					progress: "85"
				},
				{
					techName: "CSS",
					img: {
						src: "/assets/icons/skillsIcon/css.png",
						alt: "CSS",
					},
					progress: "95"
				},
				{
					techName: "FIGMA",
					img: {
						src: "/assets/icons/skillsIcon/figma.png",
						alt: "FIGMA",
					},
					progress: "75"
				},
				{
					techName: "GIT",
					img: {
						src: "/assets/icons/skillsIcon/merge.png",
						alt: "GIT",
					},
					progress: "80"
				},
				{
					techName: "AZURE",
					img: {
						src: "/assets/icons/skillsIcon/azure.png",
						alt: "AZURE",
					},
					progress: "70"
				}
			],

		},
		education: {
			mainTitle: "Education",
			titles: [
				{
					initialDate: "Feb 22",
					endingDate: "Jun 22",
					proTitleDegree: {
						proTitle: "Platzi",
						strong: "Frontend Developer",
					}
				},
				{
					initialDate: "20",
					endingDate: "actually",
					proTitleDegree: {
						proTitle: "Universidad Nacional Abierta y a Distancia - UNAD Colombia",
						strong: "Ingeniero de Sistemas, Ingeniería de sistemas",
					}
				},
				{
					initialDate: "11",
					endingDate: "16",
					proTitleDegree: {
						proTitle: "Institución Universitaria EAM",
						strong: "administrador de empresas, Gestión de proyectos",
					}
				}
			],
		},
		courses: {
			mainTitle: "Courses",
			certificatedon: [
				{
					schools: [
						"Full Stack Developer with JavaScript",
						"Frontend and Backend with JavaScript for Web Development",
						"Full Stack with  Next.js",
						"And other shools"
					],
					descriptions: [
						" Learn to create professional web applications from scratch using JavaScript, including popular frameworks like React and Node.js.",
						"Focus on mastering the art of building dynamic user interfaces and efficient web application's backend using JavaScript, explore libraries like React and frameworks like Express.",
						"Build high-performance web apps with Next.js, learn how to handle server-side rendering and work with other technologies like Node.js and MongoDB.",
						"Learn different skills and technologies relevant to web development and software engineering."
					]
				}
			],
			linkPlatzi: {
				img: {
					src: "/assets/icons/plazi.png",
					alt: "Platzi logo"
				},
				a: "https://platzi.com/p/Cherced/",
				text: "--> My Profile On Platzi"
			},
		},
		idioms: {
			mainTitle: "Idioms",
			lenguages: [
				{
					idiom: "Spanish",
					progress: "100",
					img: {
						src: "/assets/icons/flags/spain.png",
						alt: "Spanish",
					}
				},
				{
					idiom: "English",
					progress: "60",
					img: {
						src: "/assets/icons/flags/uniteStates.png",
						alt: "English",
					}
				}
			]
		}
	},
	portfolio: {
		wcfu: {
			title: "How can I help you?",
			description: "A full-stack MERN developer can build end-to-end web applications that are fast, secure, and scalable, using a combination of cutting-edge front-end and back-end technologies. They can help clients achieve their business goals by designing and developing custom solutions, optimizing performance, and providing ongoing support and maintenance. With expertise in MongoDB, Express.js, React.js, and Node.js, MERN developers can leverage the power of the MERN stack to create dynamic, interactive, and responsive web applications that meet the needs of their clients and their customers",
			img: {
				src: "/assets/icons/separatorBlack.png",
				alt: "separator"
			},
			explore: {
				text: "Explore",
				a: "portfolio"
			}
		},
		projects: {
			title: "Portfolio",
			description: {
				one: "In this section of my web app, you will find some projects that showcase my notable growth in both best practices and complexity, scalability, and user experience. It's a vast universe for me, and as of now, I am a frontend developer seeking to improve my logic and backend knowledge to become a skilled developer with a deep understanding of this exciting world of software.",
				two: "Eventually, I want to develop Native apps. Today, we have many ecosystems, but I am particularly drawn to the frontend trident, along with emerging frameworks. Thank you for visiting, and now I invite you to learn more by clicking on the image in the portfolio carousel.",
				three: "And who knows, someday I may become a great software architect or technical leader, just like the ones I have worked with, who have had great patience and love to teach me, and on the same way return to new people to love this world and build a better one!",
			},
		},
		services: [
			{
				title: "Desing",
				img: {
					src: "/assets/icons/services/desing.png",
					alt: "desingIcon"
				},
				description: "I can design the website based on your needs and suggestions. I can also create it from scratch by consulting with you during work."
			},
			{
				title: "Development",
				img: {
					src: "/assets/icons/services/development.png",
					alt: "developmentIcon"
				},
				description: "Based on a project created by me or another one, sent by you, I can program the website to be fully functional and responsive.",
			},
			{
				title: "Maintenance",
				img: {
					src: "/assets/icons/services/maintenance.png",
					alt: "maintenanceIcon"
				},
				description: "In case of any problems or the need for changes, I can introduce new functionalities and solutions.",
			}
		],
		portFolioTitle: "Projects",
		optionsMenu: {
			all: "All",
			coded: "Coded",
			designed: "Designed"
		},
		footerPortfolio: "And many more to come!",
	},
	contactMe: {
		title: "Contact",
		description: "Hi, I'm Camilo Hernandez, a professional full-stack developer with a strong focus on MERN stack development. With 3 years of experience in the industry, I have honed my skills in building robust and scalable web applications using TypeScript and Next.js.",
		separator: {
			src: "/assets/icons/separatorBlack.png",
			alt: "separator"
		},
		fields: {
			name: {
				value: "Enter your name",
				required: true,
			},
			email: {
				value: "Enter your email",
				required: true,
			},
			phone: {
				value: "Phone number",
				required: true,
			},
			message: {
				value: "Your message",
				required: true,
			},
		},
		button: "Submit"
	},
};