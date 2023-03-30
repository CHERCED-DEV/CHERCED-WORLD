import { ImageProps } from '../../customCMS/interfaces'

export interface NotFoundProject {
    status: number;
    message: string;
}
export interface ProjectsConfig {
    id: string;
    title?: string;
    description?: string;
    image: ImageProps;
    link?: string;
    github?: string;
    technologies?: string[];
} 