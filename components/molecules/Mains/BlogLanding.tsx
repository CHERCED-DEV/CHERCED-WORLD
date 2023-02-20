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
                    <h3 className='comments__title'>Comentarios</h3>
                    <ul className='comments__list'>
                        <li className='comments__item'>
                            <p className='comments__text'>Comentario 1</p>
                            <span className='comments__author'>Autor del Comentario</span>
                        </li>
                        <li className='comments__item'>
                            <p className='comments__text'>Comentario 2</p>
                            <span className='comments__author'>Autor del Comentario</span>
                        </li>
                        <li className='comments__item'>
                            <p className='comments__text'>Comentario 3</p>
                            <span className='comments__author'>Autor del Comentario</span>
                        </li>
                    </ul>
                </section>
            </main>
        </>
    )
}
