import React from 'react'

export const BlogLanding = () => {
    return (
        <>
            <main className='blog'>
                <article className='blog-content'>
                <h1 className='blog-main__title'>titulo de post</h1>
                    <h2 className='blog-content__title'>Título de la publicación</h2>
                    <img className='blog-content__image' 
                        src='imagen.jpg' 
                        alt='Descripción de la imagen'
                     />
                    <p className='blog-content__text'>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                </article>
                <section className='comments'>
                    <h3 className='comments-title'>Comentarios</h3>
                    <ul className='comments-list'>
                        <li className='comments-list__item'>
                            <div className='comments-list__textContainer'>
                            <span className='comments-item__author'>Autor del Comentario</span>
                            <p className='comments-item__date'>Comentario 1</p>
                            </div>
                            <p className='comments-item__text'>Comentario 1</p>
                        </li>
                        <li className='comments-list__item'>
                            <div className='comments-list__textContainer'>
                            <span className='comments-item__author'>Autor del Comentario</span>
                            <p className='comments-item__date'>Comentario 1</p>
                            </div>
                            <p className='comments-item__text'>Comentario 1</p>
                        </li>
                        <li className='comments-list__item'>
                            <div className='comments-list__textContainer'>
                            <span className='comments-item__author'>Autor del Comentario</span>
                            <p className='comments-item__date'>Comentario 1</p>
                            </div>
                            <p className='comments-item__text'>Comentario 1</p>
                        </li>
                        <li className='comments-list__item'>
                            <div className='comments-list__textContainer'>
                            <span className='comments-item__author'>Autor del Comentario</span>
                            <p className='comments-item__date'>Comentario 1</p>
                            </div>
                            <p className='comments-item__text'>Comentario 1</p>
                        </li>
                    </ul>
                </section>
            </main>
        </>
    )
}
