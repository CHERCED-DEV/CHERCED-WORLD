type PageClassMap = {
  [path: string]: string;
};

type mainClassMap = {
  [pageClass: string]: string;
};

export function pageClassDynamicBody(id: string): {
  pageClass: string;
  mainClass: string;
} {
  const ctx = id;
  let pageClass = "";
  let mainClass = "";

  // Assign class based on pathname
  const pageClassMap: PageClassMap = {
    "/aboutMe": "ABOUTME-PAGE",
    "/blog": "BLOG-PAGE",
    "/contactMe": "CONTACTME-PAGE",
    "/": "HOME-PAGE",
    "/portfolio": "PORTFOLIO-PAGE",
    "/services": "SERVICES-PAGE",
    "/projects": "PROJECTS-PAGE",
    // add classes as required
  };

  //Assign class based on pageClass
  const mainClassMap: mainClassMap = {
    "ABOUTME-PAGE": "aboutMe",
    "BLOG-PAGE": "",
    "CONTACTME-PAGE": "contactMe",
    "HOME-PAGE": "main-home",
    "PORTFOLIO-PAGE": "portfolio",
    "SERVICES-PAGE": "services",
    "PROJECTS-PAGE": "projects"
  };

  if (pageClassMap[ctx]) {
    pageClass = pageClassMap[ctx]; // update the class based on the path
  } else {
    pageClass = "none"
  }
  if (mainClassMap[pageClass]) {
    mainClass = mainClassMap[pageClass]; // update the class based on the path
  } else {
    mainClass = "none"
  }

  return { pageClass, mainClass };
}