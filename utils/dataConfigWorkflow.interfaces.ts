import { AboutMeConfig, ContactMeConfig, HomeBannerConfig, PortfolioConfig, LayOutConfig } from "../pages/api/customCMS/interfaces";

//PAGES:

//[HOME: DATA]:
//SSRContract
export interface HomeServerDataProps {
    homeBanner: HomeBannerConfig; 
}

//[ABOUTME: DATA]:
//SSRContract
export interface AboutMeServerDataProps {
    aboutMe: AboutMeConfig;
}

//[CONTACTME: DATA]:
//SSRContract
export interface ContactMeServerDataProps {
    contactMe: ContactMeConfig;
}

//[PORTFOLIO&SERVICES: DATA]:
//SSRContract
export interface PortfolioServicesServerDataProps {
    portfolio: PortfolioConfig; 
}

//Layout

//[LayOut: DATA]:
//SSRContract
export interface LayoutServerDataProps {
    layout: LayOutConfig; 
}