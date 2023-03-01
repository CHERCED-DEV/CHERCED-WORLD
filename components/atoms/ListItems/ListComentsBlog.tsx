import React from 'react'
import { ComentsConfig } from '../../../pages/api/blog/posts/post.interface'

export const ListComentsBlog: React.FC<ComentsConfig> = (props) => {
    return (
        <li className='comments-list__item'>
            <div className='comments-list__textContainer'>
                <span className='comments-item__author'>{props.userName}</span>
                <p className='comments-item__date'>{props.date}</p>
            </div>
            <p className='comments-item__text'>{props.comment}</p>
        </li>
    )
}