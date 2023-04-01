import React, { memo, useEffect } from 'react';
import Image from 'next/image';
import styles from './utils/header.module.scss';
import { useRouter } from 'next/router';
import { LayOutConfig } from '../../../pages/api/customCMS/interfaces';
import { useLocalStorageData } from '../../../utils/hooks/getLocalStorageData';

interface HeaderBackPropsConfig {
    headerSimple: boolean;
    setHeaderSimple: React.Dispatch<React.SetStateAction<boolean>>;
}

const HeaderBackTo: React.FC<HeaderBackPropsConfig> = memo(function HeaderBackTo({headerSimple, setHeaderSimple, }) {
    const [layOut] = useLocalStorageData<LayOutConfig>("CmsData", "layOut");

    const router = useRouter();
    const handleEvent = () => {
        const pathArray = router.asPath.split("/");
        pathArray.splice(-1, 1);
        /* const backTo = pathArray.join("/"); */
        return router.push('/')
    }

    return (
        <>
            <header id='header' className={styles.headerBackTo}>
                <div className={styles.headerBackToImg}>
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
                <button className={styles.headerBackToButton} onClick={() => {
                    handleEvent();
                    setHeaderSimple(!headerSimple);
                }}>
                    <div className={styles.headerBackToButtonImg}>
                        {layOut?.header?.brandImage?.src && (
                            <Image
                                src={layOut.header?.backTo.src}
                                alt={layOut.header?.backTo.alt}
                                loading={layOut.header?.backTo.loading}
                                fill={false}
                                width={32}
                                height={32}
                            />
                        )}
                    </div>
                </button>
            </header>
        </>
    );
});

export default HeaderBackTo