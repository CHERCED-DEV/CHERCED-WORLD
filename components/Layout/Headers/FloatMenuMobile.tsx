import React, { useEffect, useState } from 'react';
import { UseCmsDataHome } from '../../../utils/providers/cmsDataProvider';
import { HeaderConfig, ListItems } from '../../../pages/api/customCMS/interfaces';
import { ListSubMenu } from './utils/ListSubMenu';
import { dinamycReaderOptions } from './HeaderLogic/dinamicReaderRouteToOptions';
import { floatMenuData } from './HeaderLogic/floatMenuData';
import { getCMSData } from '../../../utils/providers/requests/homeCB';


export const FloatMenuMobile: React.FC = () => {

    const { handleSubMenu, sethandleSubMenu, pageClass } = UseCmsDataHome();

    const [newOptions, setNewOptions] = useState<ListItems[]>([{ title: "", href: "" }]);
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
        sethandleSubMenu(!handleSubMenu);
    }

    return (
        <nav className={handleSubMenu ? ("floatMenu-navegation on") : ("floatMenu-navegation off")}>
            <header className='header'>
                <button className='header-button' onClick={handleEvent}>
                    <img
                        src={header?.buttonMenu.src}
                        alt={header?.buttonMenu.alt}
                        loading={header?.buttonMenu.loading}
                    />
                </button>
            </header>
            <ul className="floatMenu-navegation__list">
                {
                    newOptions?.map((option: ListItems, index: number) => (
                        <ListSubMenu
                            key={index}
                            title={option.title}
                            href={option.href}
                        />
                    ))
                }
            </ul>
            <div className="floatMenu-navegation__logo">
                <img className="floatMenu-navegation__img"
                    src={header?.brandImage.src}
                    alt={header?.brandImage.alt}
                    loading={header?.brandImage.loading}
                />
            </div>
        </nav>
    )
}