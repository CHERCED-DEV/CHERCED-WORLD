import { ImageProps } from "../../customCMS/interfaces";

export interface PostConfig {
    id: string;
    title: string;
    img: ImageProps;
    description: string;
    comnents: ComentsConfig[];
}

export interface ComentsConfig {
    id: string;
    postId: string;
    date: string;
    userName: string;
    comment: string;
}