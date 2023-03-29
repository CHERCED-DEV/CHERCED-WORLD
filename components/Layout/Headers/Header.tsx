import React, { memo, useEffect, useState } from 'react';
import Image from 'next/legacy/image';
import styles from './utils/header.module.scss';
import { UseCmsDataHome } from '../../../utils/providers/cmsDataProvider';
import { HeaderConfig } from '../../../pages/api/customCMS/interfaces';
import { FloatMenuMobile } from './FloatMenuMobile'

interface HeaderPropsConfig {
    header: HeaderConfig;
}

const Header: React.FC<HeaderPropsConfig> = memo(function Header({ header }) {

    const { handleSubMenu, sethandleSubMenu, pageClass } = UseCmsDataHome();

    const handleEvent = () => {
        sethandleSubMenu(!handleSubMenu)
    }

    return (
        <>
            <FloatMenuMobile header={header} />
            <header id='header' className={styles.headerContainer} >
                <nav className={styles.header}>
                    <div className={styles.headerImg}>
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
                    <button className={styles.headerButton} onClick={handleEvent}>
                        <div className={styles.headerButtonImg}
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

export default Header