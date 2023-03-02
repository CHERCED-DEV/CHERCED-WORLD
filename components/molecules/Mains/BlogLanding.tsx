import React from 'react'
import { CommentsConfig, PostConfig } from '../../../pages/api/blog/posts/post.interface'
import { ListComentsBlog } from '../../atoms/ListItems/ListComentsBlog'

export const BlogLanding: React.FC<PostConfig> = (props) => {

    return (
        <>
            <article className='blog-content'>
                <h1 className='blog-main__title'>{props.title}</h1>
                <img className='blog-content__image'
                    src={props.img.src}
                    alt={props.img.alt}
                    loading={props.img.loading}
                />
                <h2 className='blog-content__subTitle'>{props.subtitle}</h2>
                <p className='blog-content__text'>{props.description}</p>
            </article>
            <section className='comments'>
                <h3 className='comments-title'>Comentarios</h3>
                <ul className='comments-list'>
                    {
                        props.comments?.map((comnent: CommentsConfig, index: number) => (
                            <ListComentsBlog
                                key={index}
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