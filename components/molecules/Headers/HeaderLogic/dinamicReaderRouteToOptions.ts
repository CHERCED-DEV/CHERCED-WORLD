import { ListItems } from "../../../../pages/api/customCMS/interfaces";
// router dinamyc logic
export const dinamycReaderOptions = (pageClass: string, options: ListItems[]): ListItems[]  => {
    let optionToReplace: string = "";
    const homePath: ListItems = {title: "Home", href: "/"};
    const newOptions = options.map(option => ({ ...option }));
    
    switch (pageClass) {
      case "ABOUTME-PAGE":
        optionToReplace = "About me";
        break;
      case "BLOG-PAGE":
        optionToReplace = "Blog";
        break;
      case "CONTACTME-PAGE":
        optionToReplace = "Contact Me";
        break;
      case "PORTFOLIO-PAGE":
        optionToReplace = "Portfolio";
        break;
      case "SERVICES-PAGE":
        optionToReplace = "Services";
        break;
      default:
        return options
    }
  
    const index = newOptions.findIndex(option => option.title.trim() === optionToReplace.trim());
  
    if (index >= 0) {
      newOptions[index] = homePath;
    }
    return newOptions;
  };
  