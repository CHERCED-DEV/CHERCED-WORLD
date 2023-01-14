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
    href?: string;
}
interface Link {
    href?: string;
}
interface HomeBannerTitles {
    textParragraph: string;
    textStrong: string;
    mainTitle: string;
}
interface techListConfig {
    img: ImageProps;
    progress: string;
}
interface ProExpConfig {
    dateDegree: string;
    proTitleDegree: {
        proTitle: string;
        strong: string;
        descriptionDegree: string;
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
    titles: {
        mainTitle: string;
        career: string;
        skills: string;
        education: string;
    }
    descriptions: {
        aboutMe: string;
        skills: string;
        endSkills: string;
    }
    proExp: ProExpConfig[];
    skills: string[];
    techList: techListConfig[];
}



// this its the call of all data just import this to fetch the apiCms
export interface CmsDataConfig {
    header: HeaderConfig;
    homeBanner: HomeBannerConfig;
    mainDescription: MainDescriptionConfig;
    floatMenuMobile: FloatMenuMobileConfig;
    aboutMe: AboutMeConfig;
    footer: FooterConfig;
}