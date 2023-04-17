import React, { memo } from 'react';
import Image from 'next/image';
import styles from './utils/header.module.scss';
import { LayOutConfig } from '../../../pages/api/customCMS/interfaces';
import { FloatMenuMobile } from './FloatMenuMobile'
import { useLocalStorageData } from '../../../utils/hooks/getLocalStorageData';
import { useRouter } from 'next/router';
import { InboxAlert } from './utils/InboxAlert';

interface HeaderPropsConfig {
    handleSubMenu: boolean;
    sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
    pageClass: string
    headerSimple: boolean;
    setHeaderSimple: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderPropsConfig> = memo(function Header({ handleSubMenu, sethandleSubMenu, pageClass, headerSimple, setHeaderSimple }) {

    const [layOut] = useLocalStorageData<LayOutConfig>("CmsData", "layOut");
    const router = useRouter();
    const handleEventBack = () => {
        const pathArray = router.asPath.split("/");
        pathArray.splice(-1, 1);
        let backTo = pathArray.join("/");
        if (backTo === "") {
            backTo = "/"
        }
        return router.push(backTo)
    }

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
                                fill={false}
                                width={64}
                                height={64}
                            />
                        )}
                        <InboxAlert />
                    </div>
                    {
                        headerSimple ? (
                            <button className={styles.headerButton} onClick={handleEvent}>
                                <div className={styles.headerButtonImg}
                                >
                                    {layOut?.header?.buttonMenu?.src && (
                                        <Image
                                            src={layOut.header?.buttonMenu?.src}
                                            alt={layOut.header?.buttonMenu?.alt}
                                            fill={false}
                                            width={31}
                                            height={18}
                                        />
                                    )}
                                </div>
                            </button>
                        ) : (
                            <button className={styles.headerBackToButton} onClick={() => {
                                handleEventBack();
                                setHeaderSimple(!headerSimple);
                            }}>
                                <div className={styles.headerBackToButtonImg}>
                                    {layOut?.header?.brandImage?.src && (
                                        <Image
                                            src={layOut.header?.backTo.src}
                                            alt={layOut.header?.backTo.alt}
                                            fill={false}
                                            width={32}
                                            height={32}
                                        />
                                    )}
                                </div>
                            </button>
                        )
                    }
                </nav>
            </header>
        </>
    )
})

export default Header;