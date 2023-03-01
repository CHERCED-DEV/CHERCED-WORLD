import React from 'react'
import { ComentsConfig } from '../../../pages/api/blog/posts/post.interface'

export const ListComentsBlog: React.FC<ComentsConfig> = (props) => {
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