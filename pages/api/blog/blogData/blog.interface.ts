import { ImageProps } from "../../customCMS/interfaces";

export interface BlogCmsConfig {
    mainTitle: string;
    mainTitleStrong: string
    welcomeMenssage: string;
    img: ImageProps;
    sendPost: SendPostConfig;
}
export interface SendPostConfig {
    title: string; 
    fields: {
        name: {
            value: string;
            required: boolean;
        },
        date: {
            value: string;
            required: boolean;
        },
        comment: {
            value: string;
            required: boolean;
        },        
    }
    button: string;
}