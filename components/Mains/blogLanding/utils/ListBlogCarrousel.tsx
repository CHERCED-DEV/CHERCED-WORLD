import React from 'react';
import { PostConfig } from '../../../../pages/api/blog/posts/database/post.interface';
import { useRouter } from 'next/router';
import Image from 'next/image';

export const ListBlogCarrousel: React.FC<PostConfig> = (props) => {
    const router = useRouter();
    return (
        <li className="blog-carrousel__item" >
            <h1 className="blog-carrousel__title">{props.title}</h1>
            <div className="blog-carrousel__img">
                {props?.img.src && (
                    <Image
                        src={props.img.src}
                        alt={props.img.alt}
                        fill={false}                        
                        width={256}
                        height={256}
                    />
                )}
            </div>
            <button className="blog-carrousel__button"
                onClick={() => {
                    router.push(`blog/${props.id}`);
                }}
            >See More</button>
        </li>
    )
}