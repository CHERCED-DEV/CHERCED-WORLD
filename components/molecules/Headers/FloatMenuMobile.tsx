import React from 'react';
import { ListItems } from '../../../pages/api/customCMS/interfaces';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { ListSubMenu } from '../../atoms/ListItems/ListSubMenu';

export const FloatMenuMobile: React.FC = () => {

    const { CmsData, handleSubMenu, sethandleSubMenu } = useCmsDataHome();
    const { floatMenuMobile, header } = CmsData;

    const handleEvent = () => {
        sethandleSubMenu(!handleSubMenu);
    }

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
            <nav className={ handleSubMenu ?  ("floatMenu-navegation on") : ("floatMenu-navegation off") }>
            <header>
                <button className='header-button' onClick={handleEvent}>
                    <img 
                    src={header.buttonMenu.src} 
                    alt={header.buttonMenu.alt}
                    loading={header.buttonMenu.loading} 
                    />
                </button>
            </header>
                <ul className="floatMenu-navegation__list">
                    {
                       floatMenuMobile.options.map((option: ListItems, index: number)=>(
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
                        src={floatMenuMobile.brandLogo.src} 
                        alt={floatMenuMobile.brandLogo.alt} 
                        loading={floatMenuMobile.brandLogo.loading} 
                    />
                </div>
            </nav>
        )
    }
}