type PageClassMap = {
  [path: string]: string;
};

export function pageClassDynamicBody(id:string): string {
  const ctx = id;
  let pageClass = '';

  // Assign class based on pathname
  const pageClassMap: PageClassMap = {
    "/aboutMe": "ABOUTME-PAGE",
    "/blog": "BLOG-PAGE",
    "/contactMe": "CONTACTME-PAGE",
    "/": "HOME-PAGE",
    "/portfolio": "PORTFOLIO-PAGE",
    "/services": "SERVICES-PAGE",
    // add classes as required
  };

  if (pageClassMap[ctx]) {
    pageClass = pageClassMap[ctx]; // update the class based on the path
  }

  return pageClass;
}
