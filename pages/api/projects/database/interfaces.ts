import { ImageProps } from "../../customCMS/interfaces";

interface ImagePropsCarrousel extends ImageProps {
  width: string;
  height: string;
}

export interface NotFoundProject {
  status: number;
  message: string;
}
export interface ProjectsConfig {
  id: string;
  title?: string;
  description?: {
    p1: string;
    p2: string;
    p3: string;
  };
  image: ImagePropsCarrousel;
  link?: string;
  github?: string;
  technologies?: string[];
}
