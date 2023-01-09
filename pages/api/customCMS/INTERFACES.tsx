interface ImageProps { // general config
    src: string;
    alt: string;
    loading:  "lazy" | "eager" | undefined;
    width?: number;
    height?: number;
}
interface ListItems { // general config
    title: string;
    href: string;
}
interface HomeBannerTitles { // specific config
    textParragraph: string;
    textStrong: string;
    mainTitle: string;
}

export interface CmsDataContextProviderProps {
    children: React.ReactNode | JSX.Element | JSX.Element[];
}

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
export interface FloatMenuMobileConfig {

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

export interface HomeData {
    header: HeaderConfig;
    mainBanner: HomeBannerConfig;
}