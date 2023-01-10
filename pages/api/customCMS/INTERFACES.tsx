// general config
interface ImageProps { 
    src: string;
    alt: string;
    loading: "lazy" | "eager" | undefined;
    width?: number;
    height?: number;
}
interface ListItems { 
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

// special config for contexts
export interface CmsDataContextProviderProps {
    children: React.ReactNode | JSX.Element | JSX.Element[];
}

//elements structure
export interface HeaderConfig {
    brandImage: ImageProps;
    dskList: {
        optionOne: ListItems;
        optionTwo: ListItems;
        optionThree: ListItems;
        optionFour: ListItems;
        optionFive: ListItems;
    }
    buttonMenu: ImageProps;
}

export interface HomeBannerConfig {
    homeBannerTitles: HomeBannerTitles;
    separator: ImageProps;
    homeSocialMedia: {
        mailito: ImageProps;
        github: ImageProps;
        linkedin: ImageProps;
    }
}

export interface FloatMenuMobileConfig {
    aboutMe: ListItems;
    services: ListItems;
    portfolio: ListItems;
    blog: ListItems;
    contact: ListItems;
    brandLogo: ImageProps;
}

export interface FooterConfig {
    backOption: {
        img: ImageProps;
        text: string;
        link: Link;
    };
    footerSocialMedia: {
        facebook: {
            img: ImageProps;
            link: Link;
        };
        linkedin: {
            img: ImageProps;
            link: Link;
        };
        instagram: {
            img: ImageProps;
            link: Link;
        };
        mailito: {
            img: ImageProps;
            link: Link;
        }
    };
    copyright: {
        strongText: string;
        normalText: string;
    }
}


// this its the call of all data just import this to fetch the apiCms
export interface CmsDataConfig {
    header: HeaderConfig;
    homeBanner: HomeBannerConfig;
    floatMenuMobile: FloatMenuMobileConfig;
    footer: FooterConfig;
}