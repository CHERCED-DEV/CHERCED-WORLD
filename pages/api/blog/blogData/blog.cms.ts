import { BlogCmsConfig } from "./blog.interface";

export const BlogCms: BlogCmsConfig = {
    mainTitle: "Welcome To",
    mainTitleStrong: "CHERCED-WORLD",
    welcomeMenssage: "Hi, i do this space to share more about me, i hope your instance here will be nice, leave me feedBack on the comments seccion on the posts, thanks! and enjoy!",
    img: {
        src: "/assets/imgs/mePortfolio.jpg",
        alt: "Me",
        loading: "lazy",
        a: "https://github.com/CHERCED-DEV",
    },
    sendPost: {
        title: "send me a post!",
        fields: {
            name: {
                value: "Your name Here!",
                required: true,
            },
            comment: {
                value: "Comment",
                required: true,
            },
            date: {
                value: "today",
                required: true,
            }
        },
        button: "Submit"
    }
};
