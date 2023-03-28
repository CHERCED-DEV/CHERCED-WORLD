import React, { useEffect, useState } from 'react';
import Image from 'next/legacy/image';
import { UseCmsDataHome } from '../../../utils/providers/cmsDataProvider';
import { HeaderConfig, ListItems } from '../../../pages/api/customCMS/interfaces';
import { ListSubMenu } from './utils/ListSubMenu';
import { dinamycReaderOptions } from './HeaderLogic/dinamicReaderRouteToOptions';
import { floatMenuData } from './HeaderLogic/floatMenuData';

interface FloarMenuMobilePropsConfig {
    header: HeaderConfig;
}

export const FloatMenuMobile: React.FC<FloarMenuMobilePropsConfig> = ({header}) => {

    const { handleSubMenu, sethandleSubMenu, pageClass } = UseCmsDataHome();
    const [newOptions, setNewOptions] = useState<ListItems[]>([{ title: "", href: "" }]);

    useEffect(() => {
        setNewOptions(dinamycReaderOptions(pageClass, floatMenuData.options));
    }, [pageClass]);

    const handleEvent = () => {
        sethandleSubMenu(!handleSubMenu);
    }

    return (
        <nav className={handleSubMenu ? ("floatMenu-navegation on") : ("floatMenu-navegation off")}>
            <header className='header'>
                <button className='header-button' onClick={handleEvent}>
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
                <div className="floatMenu-navegation__img">
                    {header?.brandImage?.src && (
                        <Image
                            src={header?.brandImage.src}
                            alt={header?.brandImage.alt}
                            loading={header?.brandImage.loading}
                            layout="intrinsic"
                            width={150}
                            height={150}
                        />
                    )}
                </div>
            </div>
        </nav>
    )
}