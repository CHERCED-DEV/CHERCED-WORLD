import { ImageProps } from "../../../customCMS/interfaces";

export interface PostConfig {
  id: string;
  title: string;
  subtitle?: string;
  img: ImageProps;
  description: string[];
}
