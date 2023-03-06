import React, { memo, useEffect, useState } from 'react';
import { UseCmsDataHome } from '../../../utils/providers/cmsDataProvider';
import { HeaderConfig, ListItems } from '../../../pages/api/customCMS/interfaces';
import { ListOptionsHeader } from './utils/ListOptionsHeader';
import { FloatMenuMobile } from './FloatMenuMobile'
import { dinamycReaderOptions } from './HeaderLogic/dinamicReaderRouteToOptions';
import { floatMenuData } from './HeaderLogic/floatMenuData';
import { getCMSData } from '../../../utils/providers/requests/homeCB';


export const Header: React.FC = () => {

    const [newOptions, setNewOptions] = useState<ListItems[]>([{ title: "", href: "" }]);
    const { handleSubMenu, sethandleSubMenu, pageClass } = UseCmsDataHome();
    const [header, setHeader] = useState<HeaderConfig | undefined>();

    useEffect(() => {
        setNewOptions(dinamycReaderOptions(pageClass, floatMenuData.options));        
    }, [pageClass]);

    useEffect(() => {
        const fetchHeaderData = async () => {
            const CmsData = await getCMSData();
            setHeader(CmsData?.header);
        }
        fetchHeaderData();
    }, []);

    const handleEvent = () => {
        sethandleSubMenu(!handleSubMenu)
    }

    return (
        <>
            <FloatMenuMobile />
            <header id='header' className="header">
                <img className="header__img"
                    src={header?.brandImage.src}
                    alt={header?.brandImage.alt}
                    loading={header?.brandImage.loading}
                />
                <nav className="header-navegation">
                    <ul className="header-navegation__list">
                        {
                            newOptions?.map((dskList: ListItems, index: number) => (
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
                        src={header?.buttonMenu.src}
                        alt={header?.buttonMenu.alt}
                        loading={header?.buttonMenu.loading}
                    />
                </button>
            </header>
        </>
    )
}

export const MemoizedAboutMe = memo(Header);