import React from 'react';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';


export const Header: React.FC = () => {
    const {homeData, loading} = useCmsDataHome();
    const headerData = homeData.header;

    if (loading) {
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
                    <img src={headerData?.brandImage.src} alt={headerData?.brandImage.alt} loading={headerData?.brandImage.loading}/>
                </div>
                    <nav className="header-navegation">
                        <ul className="header-navegation__list">
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{headerData?.dskList.optionOne.title}</a>
                            </li>
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{headerData?.dskList.optionTwo.title}</a>
                            </li>
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{headerData?.dskList.optionThree.title}</a>
                            </li>
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{headerData?.dskList.optionFour.title}</a>
                            </li> 
                            <li className="header-navegation__item">
                                <a className="header-navegation__link" href="">{headerData?.dskList.optionFive.title}</a>
                            </li> 
                        </ul>
                    </nav>
                    <button className="header-button">
                        <div className="header-button__imgContainer">
                            <img src={headerData?.buttonMenu.src} alt={headerData?.buttonMenu.alt} loading={headerData?.buttonMenu.loading}/>
                        </div>
                    </button>
            </header>
        )
    }   
}