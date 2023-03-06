import React from 'react'
import { CommentsConfig } from '../../../../pages/api/blog/posts/database/post.interface'

export const ListComentsBlog: React.FC<CommentsConfig> = (props) => {
    return (
        <li className='comments-list__item'>
            <div className='comments-list__textContainer'>
                <h1 className='comments-item__author'>{props.userName}</h1>
                <hr />
                <p className='comments-item__date'>{props.date}</p>
            </div>
            <div className='comments-item__text'>
                <hr />
                <p>{props.comment}</p>
            </div>
        </li>
    )
}