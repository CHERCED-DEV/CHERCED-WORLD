import React, { useEffect, useState } from 'react';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { ListItems } from '../../../pages/api/customCMS/interfaces';
import { ListSubMenu } from '../../atoms/ListItems/ListSubMenu';
import { dinamycReaderOptions } from './HeaderLogic/dinamicReaderRouteToOptions';
import { floatMenuData } from './HeaderLogic/floatMenuData';


export const FloatMenuMobile: React.FC = () => {
    
    const [newOptions, setNewOptions] = useState<ListItems[]>([{ title: "", href: "" }]);
    const { CmsData, handleSubMenu, sethandleSubMenu, pageClass } = useCmsDataHome();
    const { header } = CmsData;

    useEffect(() => {
        setNewOptions(dinamycReaderOptions(pageClass, floatMenuData.options));
    }, [pageClass]);

    const handleEvent = () => {
        sethandleSubMenu(!handleSubMenu);
    }
    return (
        <nav className={handleSubMenu ? ("floatMenu-navegation on") : ("floatMenu-navegation off")}>
            <header>
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
                    src={header?.buttonMenu.src}
                    alt={header?.buttonMenu.alt}
                    loading={header?.buttonMenu.loading}
                />
            </div>
        </nav>
    )
}