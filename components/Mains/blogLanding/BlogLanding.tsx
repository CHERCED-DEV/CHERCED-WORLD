import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PostConfig } from '../../../pages/api/blog/posts/database/post.interface';
import { CommentsConfig } from '../../../pages/api/blog/comments/database/comments.interface'; 
import { ListComentsBlog } from './utils/ListComentsBlog';

interface BlogLandingConfig extends PostConfig {
    comments: CommentsConfig[];
}
export const BlogLanding: React.FC<BlogLandingConfig> = (props, comments) => {

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
            <section className='comments'>
                <h3 className='comments-title'>Comentarios</h3>
                <ul className='comments-list'>
                    {
                        comments?.map((comnent: CommentsConfig) => (
                            <ListComentsBlog
                                key={comnent.comment}
                                postId={comnent.postId}
                                id={comnent.id}
                                userName={comnent.userName}
                                comment={comnent.comment}
                                date={comnent.date}
                            />
                        ))
                    }
                </ul>
            </section>
        </>
    )
}