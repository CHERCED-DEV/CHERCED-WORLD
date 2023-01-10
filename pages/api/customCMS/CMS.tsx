import { HeaderConfig, HomeBannerConfig, FloatMenuMobileConfig, FooterConfig } from "./interfaces"

export const CMS: { [key: string]: HeaderConfig | HomeBannerConfig | FloatMenuMobileConfig | FooterConfig } = {
	header: {
		brandImage: {
			src: 'assets/icons/brandLogo.png',
			alt: 'CHERCED logo',
			loading: 'lazy',
			width: 64,
			height: 64
		},
		dskList: {
			optionOne: {
				title: 'About me',
				href: ''
			},
			optionTwo: {
				title: 'Services',
				href: ''
			},
			optionThree: {
				title: 'Portfolio',
				href: ''
			},
			optionFour: {
				title: 'Blog',
				href: ''
			},
			optionFive: {
				title: 'Contact me',
				href: ''
			}
		},
		buttonMenu: {
			src: 'assets/icons/navbar.png',
			alt: 'menu button',
			loading: 'lazy',
			width: 31,
			height: 18
		},
	},
	homeBanner: {
		homeBannerTitles: {
			textParragraph: 'Hi there, my name is',
			textStrong: 'Camilo',
			mainTitle: 'I’M A DEVELOPER'
		},
		separator: {
			src: '../../../public/assets/icons/separator.png',
			alt: 'separator line',
			loading: 'lazy',
			width: 94,
			height: 4
		},
		homeSocialMedia: {
			mailito: {
				src: '../../../public/assets/icons/mailito.png',
				alt: 'mailito icon',
				loading: 'lazy',
				width: 24,
				height: 24
			},
			github: {
				src: '../../../public/assets/icons/github.png',
				alt: 'github icon',
				loading: 'lazy',
				width: 24,
				height: 24
			},
			linkedin: {
				src: '../../../public/assets/icons/linkedin.png',
				alt: 'linkedin icon',
				loading: 'lazy',
				width: 24,
				height: 24
			}
		}
	},
	floatMenuMobile: {
		aboutMe: {
			title: 'About me',
			href: ''
		}, 
		services: {
			title: 'Services',
			href: ''
		},
		portfolio: {
			title: 'Portfolio',
			href: ''
		},
		blog: {
			title: 'blog',
			href: ''
		},
		contact: {
			title: 'Contact Me',
			href: ''
		},
		brandLogo: {
			src: 'assets/icons/brandLogo.png',
			alt: 'CHERCED logo',
			loading: 'lazy',
			width: 64,
			height: 64
		}
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
		footerSocialMedia: {
			facebook: {
				img: {
					src: 'assets/icons/facebookIcon.png',
					alt: 'faceBook icon',
					loading: 'lazy'
				},
				link: {
					href: ''
				}
			},
			linkedin: {
				img: {
					src: 'assets/icons/arrowFooter.png',
					alt: 'linkedIn icon',
					loading: 'lazy'
				},
				link: {
					href: ''
				}
			},
			instagram: {
				img: {
					src: 'assets/icons/instagramIcon.png',
					alt: 'instagram icon',
					loading: 'lazy'
				},
				link: {
					href: ''
				}
			},
			mailito: {
				img: {
					src: 'assets/icons/gmailIcon.png',
					alt: 'gmail icon',
					loading: 'lazy'
				},
				link: {
					href: ''
				}
			}
		},
		copyright: {
			strongText: '@2023 Camilo Hernandez',
			normalText: 'All Rigths Reserved'
		}
	}
};