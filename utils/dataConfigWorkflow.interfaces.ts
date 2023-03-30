import {
  AboutMeConfig,
  ContactMeConfig,
  HomeBannerConfig,
  PortfolioConfig,
  LayOutConfig,
} from "../pages/api/customCMS/interfaces";

//PAGES:

//[HOME: DATA]:
//SSRContract
export interface HomeClientDataProps {
  homeBanner: HomeBannerConfig;
}

//[ABOUTME: DATA]:
//SSRContract
export interface AboutMeClientDataProps {
  aboutMe: AboutMeConfig;
}

//[CONTACTME: DATA]:
//SSRContract
export interface ContactMeClientDataProps {
  contactMe: ContactMeConfig;
}

//[PORTFOLIO&SERVICES: DATA]:
//SSRContract
export interface PortfolioServicesClientDataProps {
  portfolio: PortfolioConfig;
}

//Layout

//[LayOut: DATA]:
//SSRContract
export interface LayoutServerDataProps {
  layout: LayOutConfig;
}
