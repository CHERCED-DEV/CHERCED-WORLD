import React from 'react';
import Image from 'next/image'

export const FloatMenuMobile = () => {
    return (
      /* component: FloatMenuMobile */
        <nav className="floatMenu-navegation">
            <ul className="floatMenu-navegation__list">
                <li className="floatMenu-navegation__item">
                    <a className="floatMenu-navegation__link" href="">About me</a>
                </li>
                <li className="floatMenu-navegation__item">
                    <a className="floatMenu-navegation__link" href="">Services</a>
                </li>
                <li className="floatMenu-navegation__item">
                    <a className="floatMenu-navegation__link" href="">Portfolio</a>
                </li>
                <li className="floatMenu-navegation__item">
                    <a className="floatMenu-navegation__link" href="">Blog</a>
                </li>
                <li className="floatMenu-navegation__item">
                    <a className="floatMenu-navegation__link" href="">Contact me</a>
                </li>  
            </ul>
            <div className="floatMenu-navegation__logo">
            <Image
                src="../../../public/assets/icons/brandLogoX2.png"
                alt="CHERCED logo"
                width={122}
                height={128} 
            />
            </div>
        </nav>
    )
}
