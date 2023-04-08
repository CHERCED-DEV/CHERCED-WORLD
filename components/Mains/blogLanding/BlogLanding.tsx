import React from 'react';
import Image from 'next/image';
import { PostConfig } from '../../../pages/api/blog/posts/database/post.interface';1

export const BlogLanding: React.FC<PostConfig> = (props) => {

    return (
        <>
            <article className='blog-content'>
                <h1 className='blog-main__title'>{props.title}</h1>
                <div className='blog-content__image'>
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
                <h2 className='blog-content__subTitle'>{props.subtitle}</h2>
                <p className='blog-content__text'>{props.description}</p>
            </article>
        </>
    )
}