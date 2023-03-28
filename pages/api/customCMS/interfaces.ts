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
  title: string;
  href: string;
}
interface Link {
  href?: string;
}
export interface TechListConfig {
  techName: string;
  img: ImageProps;
  progress: string;
  hidden?: boolean;
}
export interface ProExpConfig {
  initialDate: string;
  endingDate?: string;
  expTitleDescription: {
    expTitle: string;
    company: string;
    descriptionExp: string;
  };
}

export interface skillConfig {
  skill: string;
}

export interface EducationDegreesConfig {
  initialDate: string;
  endingDate?: string;
  proTitleDegree: {
    proTitle: string;
    strong: string;
  };
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
  };
  email: {
    value: string;
    required: boolean;
  };
  phone: {
    value: string;
    required: boolean;
  };
  message: {
    value: string;
    required: boolean;
  };
}

// special config for contexts
export interface ContextProviderProps {
  children: React.ReactNode | JSX.Element | JSX.Element[];
}

//Layout structure
export interface HeaderConfig {
  brandImage: ImageProps;
  buttonMenu: ImageProps;
  backTo: ImageProps;
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
  };
}

export interface LayOutConfig {
    header: HeaderConfig;
    footer: FooterConfig;
}
export interface HomeBannerConfig {
  homeBannerTitles: {
    textParragraph: string;
    textStrong: string;
    mainTitle: string;
  }
  separator: ImageProps;
  homeSocialMedia: ImageProps[];
}
export interface AboutMeDescriptionConfig {
  mainTitle: string;
  description: string
  parallax: ImageProps;
}
export interface AboutMeCareerConfig {
  mainTitle: string;
  proExp: ProExpConfig[];
}
export interface AboutMeSkillsConfig {
  mainTitle: string;
  description: string;
  bullets: string[]
  techList: TechListConfig[];
}
export interface AboutMeEducationConfig {
  mainTitle: string;
  titles: EducationDegreesConfig[]
}
export interface AboutMeCoursesConfig {
  mainTitle: string;
  certificatedon: CoursesConfig[];
  linkPlatzi: {
    a: string;
    img: ImageProps;
    text: string;
  };
}
export interface AboutMeIdiomsConfig {
  mainTitle: string;
  lenguages: IdiomsConfig[];
}

export interface AboutMeConfig {
  description: AboutMeDescriptionConfig;
  career: AboutMeCareerConfig;
  skills: AboutMeSkillsConfig;
  education: AboutMeEducationConfig;
  courses: AboutMeCoursesConfig;
  idioms: AboutMeIdiomsConfig;
}

export interface PortfolioConfig {
  wcfu: {
    title: string;
    description: string;
    img: ImageProps;
    explore: {
      text: string;
      a: string;
    };
  };
  projects: {
    title: string;
    description: {
      one: string;
      two: string;
      three: string;
    };
  };
  services: ServicesConfig[];
  portFolioTitle: string;
  optionsMenu: {
    all: string;
    coded: string;
    designed: string;
  };
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
  layOut: LayOutConfig;
  homeBanner: HomeBannerConfig;
  aboutMe: AboutMeConfig;
  portfolio: PortfolioConfig;
  contactMe: ContactMeConfig;
  
}
