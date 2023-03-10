import React, { memo, useEffect, useState } from 'react';
import Image from 'next/legacy/image';
import { UseCmsDataHome } from '../../../utils/providers/cmsDataProvider';
import { HeaderConfig, ListItems } from '../../../pages/api/customCMS/interfaces';
import { ListOptionsHeader } from './utils/ListOptionsHeader';
import { FloatMenuMobile } from './FloatMenuMobile'
import { dinamycReaderOptions } from './HeaderLogic/dinamicReaderRouteToOptions';
import { floatMenuData } from './HeaderLogic/floatMenuData';
import { getCMSData } from '../../../utils/providers/requests/homeCB';


export const Header: React.FC = memo(() => {

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
            <header id='header' className="header-container" >
                <nav className="header">
                <div className="header__img">
                    {header?.brandImage?.src && (
                        <Image
                            src={header?.brandImage.src}
                            alt={header?.brandImage.alt}
                            loading={header?.brandImage.loading}
                            layout="intrinsic"
                            width={64}
                            height={64}
                        />
                    )}
                </div>
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
                    <div className="header-button__img"
                    >
                        {header?.buttonMenu?.src && (
                            <Image
                                src={header?.buttonMenu?.src}
                                alt={header?.buttonMenu?.alt}
                                loading={header?.buttonMenu?.loading}
                                layout="intrinsic"
                                width={31}
                                height={18}
                            />
                        )}
                    </div>
                </button>
                </nav>
            </header>
        </>
    )
}
)

Header.displayName = 'Header';