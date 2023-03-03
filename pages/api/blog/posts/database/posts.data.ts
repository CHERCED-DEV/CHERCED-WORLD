import { PostConfig } from "./post.interface";

export const posts: PostConfig[] = [
    {
        id: "1",
        title: "how to i do this",
        img: {
            src: '/assets/imgs/Lionel-Messi-2p.png',
			alt: 'separator line',
			loading: 'lazy',
        },
        subtitle: "subtitle! lalala",
        description: "Looking back, John realized that while it was a difficult decision to leave his established career in the construction and hospital architecture industry, he was able to find a new and exciting path that combined his passion for technology with his previous experience. He encourages others to follow their passions, even if it means taking a risk and making a big career change.",
        comments: [
            {
                id: "asdasf43",
                postId: "1",
                date: "01/02/03",
                email: "camilonso@gmail.com",
                userName: "Camilo Alonso Hernandez Cediel",
                comment: "lorenmus  jdsafaghlkjasblkñajsnvlñskcmlasdgm jdsafaghlkjasblkñajsnvlñskcmlasdgm jdsafaghlkjasblkñajsnvlñskcmlasdgm",
            },
            {
                id: "asdasasf43",
                postId: "1",
                date: "01/02/03",
                email: "camilonso@gmail.com",
                userName: "nickdias",
                comment: "lorenmus",
            }
        ]  
    },
    {
        id: "2",
        title: "how to i do this",
        img: {
            src: 'assets/icons/separatorWhite.png',
			alt: 'separator line',
			loading: 'lazy',
        },
        description: "Looking back, John realized that while it was a difficult decision to leave his established career in the construction and hospital architecture industry, he was able to find a new and exciting path that combined his passion for technology with his previous experience. He encourages others to follow their passions, even if it means taking a risk and making a big career change.",
        comments: [
            {
                id: "asdasf43",
                postId: "2",
                date: "01/02/03",
                email: "camilonso@gmail.com",
                userName: "nickdias",
                comment: "lorenmus",
            },
            {
                id: "asdasasf43",
                postId: "2",
                date: "01/02/03",
                email: "camilonso@gmail.com",
                userName: "nickdias",
                comment: "lorenmus",
            }
        ]
    },
    {
        id: "3",
        title: "how to i do this",
        img: {
            src: 'assets/icons/separatorWhite.png',
			alt: 'separator line',
			loading: 'lazy',
        },
        description: "Looking back, John realized that while it was a difficult decision to leave his established career in the construction and hospital architecture industry, he was able to find a new and exciting path that combined his passion for technology with his previous experience. He encourages others to follow their passions, even if it means taking a risk and making a big career change.",
        comments: [
            {
                id: "asdasf43",
                postId: "3",
                date: "01/02/03",
                email: "camilonso@gmail.com",
                userName: "nickdias",
                comment: "lorenmus",
            },
            {
                id: "asdasasf43",
                postId: "3",
                date: "01/02/03",
                email: "camilonso@gmail.com",
                userName: "nickdias",
                comment: "lorenmus",
            }
        ]
    },
]