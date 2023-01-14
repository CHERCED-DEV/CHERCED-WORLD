import React from 'react';
import { ListItems } from '../../../pages/api/customCMS/interfaces';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { ListOptionsHeader } from '../../atoms/ListItems/ListOptionsHeader';


export const Header: React.FC = () => {

    const { CmsData } = useCmsDataHome();
    const { header } = CmsData;

    if (!header) {
        return (
            <header>
                <h1 style={{ color: 'red', fontSize: 32 }}>
                    Loading...
                </h1>
            </header>
        )
    } else {
        return (
            <header className="header">
                <div className="header__imgContainer">
                    <img src={header.brandImage.src} alt={header.brandImage.alt} loading={header.brandImage.loading} />
                </div>
                <nav className="header-navegation">
                    <ul className="header-navegation__list">
                        {
                            header.dskList.map((dskList: ListItems, index: number) => (
                                <ListOptionsHeader
                                    key={index}
                                    href={dskList.href}
                                    title={dskList.title}
                                />
                                )
                            )
                        }
                    </ul>
                </nav>
                <button className="header-button">
                    <div className="header-button__imgContainer">
                        <img src={header.buttonMenu.src} alt={header.buttonMenu.alt} loading={header.buttonMenu.loading} />
                    </div>
                </button>
            </header>
        )
    }
}