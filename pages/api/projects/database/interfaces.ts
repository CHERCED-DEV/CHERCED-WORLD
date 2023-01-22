import { ImageProps } from '../../customCMS/interfaces'

export interface ProjectsConfig {
    id?: string;
    title?: string;
    description?: string;
    image: ImageProps;
    link?: string;
    github?: string;
    technologies?: string[];
} 