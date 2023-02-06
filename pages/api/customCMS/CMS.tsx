import { HeaderConfig, HomeBannerConfig, MainDescriptionConfig, FloatMenuMobileConfig, AboutMeConfig, PortfolioConfig, ContactMeConfig, FooterConfig } from "./interfaces";

export const CMS: {
	[key: string]:
	HeaderConfig | HomeBannerConfig | MainDescriptionConfig
	| FloatMenuMobileConfig | AboutMeConfig | PortfolioConfig |
	ContactMeConfig | FooterConfig
} = {
	header: {
		brandImage: {
			src: 'assets/icons/brandLogo.png',
			alt: 'CHERCED logo',
			loading: 'lazy',
		},
		dskList: [
			{
				title: 'About me',
				href: 'aboutMe'
			},
			{
				title: 'Services',
				href: 'services'
			},
			{
				title: 'Portfolio',
				href: 'portfolio'
			},
			{
				title: 'Blog',
				href: 'blog'
			},
			{
				title: 'Contact me',
				href: 'contactMe'
			}
		],
		buttonMenu: {
			src: 'assets/icons/navbar.png',
			alt: 'menu button',
			loading: 'lazy',
		},
	},
	homeBanner: {
		homeBannerTitles: {
			textParragraph: 'My name is',
			textStrong: 'Camilo',
			mainTitle: 'I’M A DEVELOPER'
		},
		separator: {
			src: 'assets/icons/separatorWhite.png',
			alt: 'separator line',
			loading: 'lazy',
			width: 94,
			height: 4
		},
		homeSocialMedia: [
			{
				src: 'assets/icons/mailito.png',
				alt: 'mailito icon',
				loading: 'lazy',
				a: '.hola'
			},
			{
				src: 'assets/icons/githubCircle.png',
				alt: 'github icon',
				loading: 'lazy',
				a: 'hasd'
			},
			{
				src: 'assets/icons/linkedinCircle.png',
				alt: 'linkedin icon',
				loading: 'lazy',
				a: 'hasds'
			}
		]
	},
	mainDescription: {
		brandButton: {
			img: {
				src: 'assets/icons/brad',
				alt: 'linkedin icon',
				loading: 'lazy',
				width: 24,
				height: 24
			},
			link: {
				href: ""
			}
		},
		description: "I am a professional in business administration, the last 8 years of my life I CHANGEEEEEEE have worked in all operational areas of a corporation, leading a company of civil projects, there I learned about programming, and I fell in love with the whole beautiful world computer science, so I am looking for an opportunity to demonstrate my capabilities and take my talents to another level, I believe in continuous learning as the most important added value of my profile, thanks for reading.",
		moreButton: "MORE",
	},
	floatMenuMobile: {
		options: [
			{
				title: 'About me',
				href: 'aboutMe'
			},
			{
				title: 'Services',
				href: 'services'
			},
			{
				title: 'Portfolio',
				href: 'portfolio'
			},
			{
				title: 'blog',
				href: 'blog'
			},
			{
				title: 'Contact Me',
				href: 'contactMe'
			}
		],
		brandLogo: {
			src: 'assets/icons/brandLogo.png',
			alt: 'CHERCED logo',
			loading: 'lazy',
		}
	},
	aboutMe: {
		parallax: {
			src: 'assets/imgs/meParallax.png',
			alt: 'CHERCED',
			loading: 'lazy'
		},
		titles: {
			mainTitle: "About Me!",
			career: "Career",
			skills: "Skills",
			education: "Education",
			courses: "Courses",
			idioms: "Idioms"
		},
		descriptions: {
			aboutMe: "I am a front-end developer with experience in developing highly interactive and high-performance web applications. I specialize in React and Angular, and have company knowledge of HTML, CSS, JavaScript, TypeScript, Node.js, and Next.js.",
			skills: "I am a front-end and full-stack developer with experience in a variety of technologies and skills such as:",
			endSkills: "With these skills, I am capable of working on web projects from design to implementation and maintenance.",
		},
		skills: [
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
		techList: [
			{
				techName: "HTML5",
				img: {
					src: "assets/icons/skillsIcon/html-5.png",
					alt: "HTML5",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "CSS",
				img: {
					src: "assets/icons/skillsIcon/css.png",
					alt: "CSS",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "SASS",
				img: {
					src: "assets/icons/skillsIcon/sass.png",
					alt: "SASS",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "JAVASCRIPT",
				img: {
					src: "assets/icons/skillsIcon/js.png",
					alt: "JAVASCRIPT",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "REACT",
				img: {
					src: "assets/icons/skillsIcon/react.png",
					alt: "REACT",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "ANGULAR",
				img: {
					src: "assets/icons/skillsIcon/angular.png",
					alt: "ANGULAR",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "NEXTJS",
				img: {
					src: "assets/icons/skillsIcon/nextjs.png",
					alt: "NEXTJS",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "MONGO",
				img: {
					src: "assets/icons/skillsIcon/mongodb.png",
					alt: "MONGO",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "NODEJS",
				img: {
					src: "assets/icons/skillsIcon/nodejs.png",
					alt: "NODEJS",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "FIGMA",
				img: {
					src: "assets/icons/skillsIcon/figma.png",
					alt: "FIGMA",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "GIT",
				img: {
					src: "assets/icons/skillsIcon/merge.png",
					alt: "GIT",
					loading: "lazy",
				},
				progress: "50"
			},
			{
				techName: "AZURE",
				img: {
					src: "assets/icons/skillsIcon/azure.png",
					alt: "AZURE",
					loading: "lazy",
				},
				progress: "50"
			}
		],
		education: [
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
		courses: [
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
		linkPlatzi: "https://platzi.com/p/Cherced/",
		idioms: [
			{
				idiom: "Spanish",
				progress: "100",
				img: {
					src: "",
					alt: "Spanish",
					loading: "lazy",
				}
			},
			{
				idiom: "English",
				progress: "60",
				img: {
					src: "",
					alt: "English",
					loading: "lazy",
				}
			}
		]
	},
	portfolio: {
		services: [
			{
				title: "Desing",
				img: {
					src: "",
					alt: "",
					loading: "lazy",
				},
				description: "I can design the website based on your needs and suggestions. I can also create it from scratch by consulting with you during work."
			},
			{
				title: "Development",
				img: {
					src: "",
					alt: "",
					loading: "lazy",
				},
				description: "Based on a project created by me or another one, sent by you, I can program the website to be fully functional and responsive.",
			},
			{
				title: "Maintenance",
				img: {
					src: "",
					alt: "",
					loading: "lazy",
				},
				description: "In case of any problems or the need for changes, I can introduce new functionalities and solutions.",
			}
		],
		portFolioTitle: "Portfolio",
		optionsMenu: {
			all: "All",
			coded: "Coded",
			designed: "Designed"
		},
		footerPortfolio: "And many more to come!",
	},
	contactMe: {
		title: "Contact",
		description: "My name is Camilo Hernandez, I’m a third year Applied Computer Science student at UNAD University of Science and Technology in Bogota Colombia.",
		separator: {
			src: "",
			alt: "",
			loading: "lazy",
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
	footer: {
		backOption: {
			img: {
				src: 'assets/icons/arrowFooter.png',
				alt: 'arrow back to top',
				loading: 'lazy'
			},
			text: 'BACK TO TOP',
			link: {
				href: ''
			}
		},
		footerSocialMedia: [
			{
				src: 'assets/icons/facebookIcon.png',
				alt: 'faceBook icon',
				loading: 'lazy',
				a: ''
			},
			{

				src: 'assets/icons/linkedInIcon.png',
				alt: 'linkedIn icon',
				loading: 'lazy',
				a: 'sdad'
			},
			{
				src: 'assets/icons/instagramIcon.png',
				alt: 'instagram icon',
				loading: 'lazy',
				a: 'sdad'
			},
			{
				src: 'assets/icons/gmailIcon.png',
				alt: 'gmail icon',
				loading: 'lazy',
				a: 'sdad'
			},
		],
		copyright: {
			strongText: '@2023 Camilo Hernandez',
			normalText: 'All Rigths Reserved',
		}
	}
};