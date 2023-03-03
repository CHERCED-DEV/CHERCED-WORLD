import { ImageProps } from "../../../customCMS/interfaces";

export interface PostConfig {
    id?: string;
    title: string;
    subtitle?: string;
    img: ImageProps;
    description: string;
    comments?: CommentsConfig[];
}

export interface CommentsConfig {
    id: string;
    postId?: string;
    date: string;
    email?: string;
    userName: string;
    comment: string;
}

