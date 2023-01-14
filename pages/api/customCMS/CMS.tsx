import { HeaderConfig, HomeBannerConfig, MainDescriptionConfig, FloatMenuMobileConfig, AboutMeConfig, FooterConfig } from "./interfaces"

export const CMS: { [key: string]: HeaderConfig | HomeBannerConfig | MainDescriptionConfig | FloatMenuMobileConfig | AboutMeConfig | FooterConfig } = {
	header: {
		brandImage: {
			src: 'assets/icons/brandLogo.png',
			alt: 'CHERCED logo',
			loading: 'lazy',
		},
		dskList: [
			{
				title: 'About me',
				href: ''
			},
			{
				title: 'Services',
				href: ''
			},
			{
				title: 'Portfolio',
				href: ''
			},
			{
				title: 'Blog',
				href: ''
			},
			{
				title: 'Contact me',
				href: ''
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
			textParragraph: 'Hi there, my name is',
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
				href: ''
			},
			{
				title: 'Services',
				href: ''
			},
			{
				title: 'Portfolio',
				href: ''
			},
			{
				title: 'blog',
				href: ''
			},
			{
				title: 'Contact Me',
				href: ''
			}
		],
		brandLogo: {
			src: 'assets/icons/brandLogo.png',
			alt: 'CHERCED logo',
			loading: 'lazy',
			width: 64,
			height: 64
		}
	},
	aboutMe: {
		titles: {
			mainTitle: "About Me!",
			career: "Career",
			skills: "Skills",
			education: "Education",
		},
		descriptions: {
			aboutMe: "I am a front-end developer with experience in developing highly interactive and high-performance web applications. I specialize in React and Angular, and have strong knowledge of HTML, CSS, JavaScript, TypeScript, Node.js, and Next.js.",
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

				src: 'assets/icons/arrowFooter.png',
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
			normalText: 'All Rigths Reserved'
		}
	}
};