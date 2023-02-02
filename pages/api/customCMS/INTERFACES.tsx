// general config
export interface ImageProps {
    src: string;
    alt: string;
    loading: "lazy" | "eager" | undefined;
    a?: string;
    width?: number;
    height?: number;
}
export interface ListItems {
    title?: string;
    href: string;
}
interface Link {
    href?: string;
}
interface HomeBannerTitles {
    textParragraph: string;
    textStrong: string;
    mainTitle: string;
}
export interface techListConfig {
    techName: string;
    img: ImageProps;
    progress: string;
}
export interface ProExpConfig {
    initialDate: string;
    endingDate?: string;
    expTitleDescription: {
        expTitle: string;
        company: string;
        descriptionExp: string;
    }
}

export interface skillConfig {
    skill: string;
}

export interface EducationConfig {
    initialDate: string;
    endingDate?: string;
    proTitleDegree: {
        proTitle: string;
        strong: string;
    }
}

export interface CoursesConfig {
    schools: string[];
    descriptions: string[];
}

export interface IdiomsConfig {
    idiom: string;
    progress: string;
    img: ImageProps;
}

export interface ServicesConfig {
    title: string;
    img: ImageProps;
    description: string;
}

export interface CardsPortfolioConfig {
    nameProject: string;
    description: string;
    buttonNext: string;
}

export interface ContactMeFieldsConfig {
    name: {
        value: string; 
        required: boolean;
    }
    email: {
        value: string; 
        required: boolean;
    }
    phone: {
        value: string; 
        required: boolean;
    }
    message: {
        value: string; 
        required: boolean;
    }
}

// special config for contexts
export interface CmsDataContextProviderProps {
    children: React.ReactNode | JSX.Element | JSX.Element[];
}

//elements structure
export interface HeaderConfig {
    brandImage: ImageProps;
    dskList: ListItems[];
    buttonMenu: ImageProps;
}

export interface HomeBannerConfig {
    homeBannerTitles: HomeBannerTitles;
    separator: ImageProps;
    homeSocialMedia: ImageProps[];
}

export interface FloatMenuMobileConfig {
    options: ListItems[];
    brandLogo: ImageProps;
}

export interface FooterConfig {
    backOption: {
        img: ImageProps;
        text: string;
        link: Link;
    };
    footerSocialMedia: ImageProps[];
    copyright: {
        strongText: string;
        normalText: string;
    }
}

export interface MainDescriptionConfig {
    brandButton: {
        img: ImageProps;
        link: Link;
    };
    description: string;
    moreButton: string;
}

export interface AboutMeConfig {
    parallax: ImageProps;
    titles: {
        mainTitle: string;
        career: string;
        skills: string;
        education: string;
        courses: string;
        idioms: string;
    }
    descriptions: {
        aboutMe: string;
        skills: string;
        endSkills: string;
    }
    proExp: ProExpConfig[];
    skills: string[];
    techList: techListConfig[];
    education: EducationConfig[];
    courses: CoursesConfig[];
    linkPlatzi: string;
    idioms: IdiomsConfig[];
}

export interface PortfolioConfig {
    services: ServicesConfig[];
    portFolioTitle: string;
    optionsMenu: {
        all: string;
        coded: string;
        designed: string;
    }
    footerPortfolio: string;
}

export interface ContactMeConfig {
    title: string;
    description: string;
    separator: ImageProps;
    fields: ContactMeFieldsConfig;
    button: string;
}

// this its the call of all data just import this to fetch the apiCms
export interface CmsDataConfig {
    header: HeaderConfig;
    homeBanner: HomeBannerConfig;
    mainDescription: MainDescriptionConfig;
    floatMenuMobile: FloatMenuMobileConfig;
    aboutMe: AboutMeConfig;
    portfolio: PortfolioConfig;
    contactMe: ContactMeConfig;
    footer: FooterConfig;
}