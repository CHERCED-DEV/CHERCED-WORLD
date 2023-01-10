import React from 'react';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';


export const Header: React.FC = () => {
    
    const { CmsData } = useCmsDataHome();
    const { header } = CmsData;

    if (!header) {
        return (
        <header>
            <h1 style={{color: 'red', fontSize: 32}}>
                Loading...
            </h1>
        </header>    
        )
    } else {
        return (
            <header className="header">
                <div className="header__imgContainer">
                    <img src={header.brandImage.src} alt={header.brandImage.alt} loading={header.brandImage.loading}/>
                </div>
                    <nav className="header-navegation">
                        <ul className="header-navegation__list">
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{header.dskList.optionOne.title}</a>
                            </li>
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{header.dskList.optionTwo.title}</a>
                            </li>
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{header.dskList.optionThree.title}</a>
                            </li>
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{header.dskList.optionFour.title}</a>
                            </li> 
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{header.dskList.optionFive.title}</a>
                            </li> 
                        </ul>
                    </nav>
                    <button className="header-button">
                        <div className="header-button__imgContainer">
                            <img src={header.buttonMenu.src} alt={header.buttonMenu.alt} loading={header.buttonMenu.loading}/>
                        </div>
                    </button>
            </header>
        )
    }   
}