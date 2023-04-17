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
    "/portfolio/[id]": "PROJECTS-PAGE",
    "/blog/[id]": "BLOG-POST--PAGE",
    "/inbox": "INBOX--PAGE",
    
  };

  //Assign class based on pageClass
  const mainClassMap: mainClassMap = {
    "ABOUTME-PAGE": "aboutMe",
    "BLOG-PAGE": "blog",
    "CONTACTME-PAGE": "contactMe",
    "HOME-PAGE": "main-home",
    "PORTFOLIO-PAGE": "portfolio",
    "SERVICES-PAGE": "services",
    "PROJECTS-PAGE": "projects",
    "BLOG-POST--PAGE": "post",
    "INBOX--PAGE": "inbox",
  };

  if (pageClassMap[ctx]) {
    pageClass = pageClassMap[ctx]; // update the class based on the path
  }

  if (mainClassMap[pageClass]) {
    mainClass = mainClassMap[pageClass]; // update the class based on the path
  }

  return { pageClass, mainClass };
}
