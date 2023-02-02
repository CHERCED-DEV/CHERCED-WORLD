import React from 'react';
import { ListItems } from '../../../pages/api/customCMS/interfaces';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { ListOptionsHeader } from '../../atoms/ListItems/ListOptionsHeader';
import { FloatMenuMobile } from './FloatMenuMobile'


export const Header: React.FC = () => {

    const { CmsData, handleSubMenu, sethandleSubMenu } = useCmsDataHome();
    const { header } = CmsData;

    const handleEvent = () => {
        sethandleSubMenu(!handleSubMenu)
    }

    if (!header) {
        return (
            <header className="header loading">
            </header>
        )
    } else {
        return (
            <>
            <FloatMenuMobile/>
            <header className="header">
                <img className="header__img"
                    src={header.brandImage.src}
                    alt={header.brandImage.alt}
                    loading={header.brandImage.loading}
                />
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
                <button className="header-button" onClick={handleEvent}>
                    <img className="header-button__img"
                        src={header.buttonMenu.src}
                        alt={header.buttonMenu.alt}
                        loading={header.buttonMenu.loading}
                    />
                </button>
            </header>
            </>
        )
    }
}