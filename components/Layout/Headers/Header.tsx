import React, { memo } from 'react';
import Image from 'next/image';
import styles from './utils/header.module.scss';
import { HeaderConfig } from '../../../pages/api/customCMS/interfaces';
import { FloatMenuMobile } from './FloatMenuMobile'

interface HeaderPropsConfig {
    header: HeaderConfig;
    handleSubMenu: boolean;
    sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
    pageClass: string
}

const Header: React.FC<HeaderPropsConfig> = memo(function Header({ header, handleSubMenu, sethandleSubMenu, pageClass }) {

    const handleEvent = () => {
        sethandleSubMenu(!handleSubMenu)
    }

    return (
        <>
            <FloatMenuMobile header={header} handleSubMenu={handleSubMenu} sethandleSubMenu={sethandleSubMenu} pageClass={pageClass} />
            <header id='header' className={styles.headerContainer} >
                <nav className={styles.header}>
                    <div className={styles.headerImg}>
                        {header?.brandImage?.src && (
                            <Image
                                src={header?.brandImage.src}
                                alt={header?.brandImage.alt}
                                loading={header?.brandImage.loading}
                                fill={false}
                                width={64}
                                height={64}
                            />
                        )}
                    </div>
                    <button className={styles.headerButton} onClick={handleEvent}>
                        <div className={styles.headerButtonImg}
                        >
                            {header?.buttonMenu?.src && (
                                <Image
                                    src={header?.buttonMenu?.src}
                                    alt={header?.buttonMenu?.alt}
                                    loading={header?.buttonMenu?.loading}
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