import { AboutMeConfig, ContactMeConfig, HomeBannerConfig, PortfolioConfig, HeaderConfig, FooterConfig } from "../pages/api/customCMS/interfaces";

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

//[HEADER: DATA]:
//SSRContract
export interface HeaderServerDataProps {
    header: HeaderConfig; 
}

//[FOOTER: DATA]:
//SSRContract
export interface FooterServerDataProps {
    footer: FooterConfig; 
}