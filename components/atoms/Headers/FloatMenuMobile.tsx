import React from 'react';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';

export const FloatMenuMobile: React.FC = () => {

    const { CmsData } = useCmsDataHome();
    const { floatMenuMobile } = CmsData;

    if (!floatMenuMobile) {
        return (
            <header>
                <h1 style={{ color: 'red', fontSize: 32 }}>
                    Loading...
                </h1>
            </header>
        )
    } else {
        return (
            /* component: FloatMenuMobile */
            <nav className="floatMenu-navegation">
                <ul className="floatMenu-navegation__list">
                    <li className="floatMenu-navegation__item">
                        <a className="floatMenu-navegation__link" href="">{floatMenuMobile.aboutMe.title}</a>
                    </li>
                    <li className="floatMenu-navegation__item">
                        <a className="floatMenu-navegation__link" href="">{floatMenuMobile.services.title}</a>
                    </li>
                    <li className="floatMenu-navegation__item">
                        <a className="floatMenu-navegation__link" href="">{floatMenuMobile.portfolio.title}</a>
                    </li>
                    <li className="floatMenu-navegation__item">
                        <a className="floatMenu-navegation__link" href="">{floatMenuMobile.blog.title}</a>
                    </li>
                    <li className="floatMenu-navegation__item">
                        <a className="floatMenu-navegation__link" href="">{floatMenuMobile.contact.title}</a>
                    </li>
                </ul>
                <div className="floatMenu-navegation__logo">
                    <img src={floatMenuMobile.brandLogo.src} alt={floatMenuMobile.brandLogo.alt} loading={floatMenuMobile.brandLogo.loading} />
                </div>
            </nav>
        )
    }
}
