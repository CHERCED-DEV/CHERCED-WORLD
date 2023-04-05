import { ImageProps } from "../../../customCMS/interfaces";

export interface BlogCmsConfig {
    mainTitle: string;
    mainTitleStrong: string
    welcomeMenssage: string;
    img: ImageProps;
    postCmsData: FieldsPostConfig;
}
export interface FieldsPostConfig {
    title: string; 
    fields: {
        email: {
            value: string;
            required: boolean;
        },
        name: {
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