import { HeaderConfig, HomeBannerConfig } from "./INTERFACES"

export const HomeDB: {[key: string]: HeaderConfig | HomeBannerConfig} = {
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
        textStrong: 'Cherced',
        mainTitle: 'I am a full stack web developer'
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
    }
  };