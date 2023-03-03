import React from 'react';
import { PostConfig } from '../../../pages/api/blog/posts/database/post.interface';
import { useRouter } from 'next/router';

export const ListBlogCarrousel: React.FC<PostConfig> = (props) => {
    const router = useRouter();
    return (
        <li className="blog-carrousel__item" >
            <h1 className="blog-carrousel__title">{props.title}</h1>
            <img className="blog-carrousel__img"
                src={props.img.src}
                alt={props.img.alt}
                loading={props.img.loading}
            />
            <button className="blog-carrousel__button"
                onClick={() => {
                    router.push(`blog/${props.id}`);
                }}
            >See More</button>
        </li>
    )
}