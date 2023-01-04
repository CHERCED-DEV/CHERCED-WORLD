import React from 'react';
import Image from 'next/image';

export const Header = () => {
    return (
        /* block: Header&Nav */
        <header className="header">
            <div className="header__imgContainer">
                <Image
                    src="../../../public/assets/icons/brandLogo.png"
                    alt="CHERCED logo"
                    width={64}
                    height={64}
                />
            </div>
                <nav className="header-navegation">
                    <ul className="header-navegation__list">
                        <li className="header-navegation__item">
                            <a className="header-navegation__link" href="">About me</a>
                        </li>
                        <li className="header-navegation__item">
                            <a className="header-navegation__link" href="">Skills</a>
                        </li>
                        <li className="header-navegation__item">
                            <a className="header-navegation__link" href="">Portfolio</a>
                        </li>
                        <li className="header-navegation__item">
                            <a className="header-navegation__link" href="">Contact me</a>
                        </li> 
                    </ul>
                </nav>
                <button className="header-button">
                    <div className="header-button__imgContainer">
                        <Image
                            src="../../../public/assets/icons/navbar.png"
                            alt="menu button"
                            width={31}
                            height={18}
                        />
                    </div>
                </button>
        </header>
    )
}