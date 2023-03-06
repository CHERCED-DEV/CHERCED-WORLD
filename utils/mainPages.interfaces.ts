import { AboutMeConfig, ContactMeConfig, HomeBannerConfig, PortfolioConfig } from "../pages/api/customCMS/interfaces";

//[ABOUTME: DATA]:

//serverSide
export interface AboutMeSectionProps {
    pageClass: string,
    aboutMe: AboutMeConfig
}

//AboutMe componentContract
export interface AboutMeDataProps {
    aboutMe: AboutMeConfig; 
}

//[CONTACTME: DATA]:

//serverSide
export interface ContactMeSectionProps {
    pageClass: string,
    contactMe: ContactMeConfig
}

//ContactMe componentContract
export interface ContactMeDataProps {
    contactMe: ContactMeConfig; 
}

//[HOME: DATA]:

//serverSide
export interface HomeSectionProps {
    pageClass: string,
    homeBanner: HomeBannerConfig;
}

//Home componentContract
export interface HomeDataProps {
    homeBanner: HomeBannerConfig; 
}

//[PORTFOLIO&SERVICES: DATA]:

//serverSide
export interface PortfolioSectionProps {
    pageClass: string,
    portfolio: PortfolioConfig;
}

//Portfolio componentContract
export interface PortfolioDataProps {
    portfolio: PortfolioConfig; 
}