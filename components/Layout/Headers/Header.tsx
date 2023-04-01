import React, { memo } from 'react';
import Image from 'next/image';
import styles from './utils/header.module.scss';
import { LayOutConfig } from '../../../pages/api/customCMS/interfaces';
import { FloatMenuMobile } from './FloatMenuMobile'
import { useLocalStorageData } from '../../../utils/hooks/getLocalStorageData';

interface HeaderPropsConfig {
    handleSubMenu: boolean;
    sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
    pageClass: string
}

const Header: React.FC<HeaderPropsConfig> = memo(function Header({ handleSubMenu, sethandleSubMenu, pageClass }) {
    const [layOut] = useLocalStorageData<LayOutConfig>("CmsData", "layOut");
    const handleEvent = () => {
        sethandleSubMenu(!handleSubMenu)
    }

    return (
        <>
            <FloatMenuMobile header={layOut?.header} handleSubMenu={handleSubMenu} sethandleSubMenu={sethandleSubMenu} pageClass={pageClass} />
            <header id='header' className={styles.headerContainer} >
                <nav className={styles.header}>
                    <div className={styles.headerImg}>
                        {layOut?.header?.brandImage?.src && (
                            <Image
                                src={layOut.header?.brandImage.src}
                                alt={layOut.header?.brandImage.alt}
                                loading={layOut.header?.brandImage.loading}
                                fill={false}
                                width={64}
                                height={64}
                            />
                        )}
                    </div>
                    <button className={styles.headerButton} onClick={handleEvent}>
                        <div className={styles.headerButtonImg}
                        >
                            {layOut?.header?.buttonMenu?.src && (
                                <Image
                                    src={layOut.header?.buttonMenu?.src}
                                    alt={layOut.header?.buttonMenu?.alt}
                                    loading={layOut.header?.buttonMenu?.loading}
                                    fill={false}
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

export default Header