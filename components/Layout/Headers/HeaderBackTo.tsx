import React, { memo } from 'react';
import Image from 'next/image';
import styles from './utils/header.module.scss';
import { useRouter } from 'next/router';
import { HeaderConfig } from '../../../pages/api/customCMS/interfaces';

interface HeaderBackPropsConfig {
    header: HeaderConfig;
}

const HeaderBackTo: React.FC<HeaderBackPropsConfig> = memo(function HeaderBackTo({ header }) {

    const router = useRouter();
    const handleEvent = () => {
        const pathArray = router.asPath.split("/");
        pathArray.splice(-1, 1);
        const backTo = pathArray.join("/");
        return router.push(backTo)
    }

    return (
        <>
            <header id='header' className={styles.headerBackTo}>
                <div className={styles.headerBackToImg}>
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
                <button className={styles.headerBackToButton} onClick={handleEvent}>
                    <div className={styles.headerBackToButtonImg}>
                        {header?.brandImage?.src && (
                            <Image
                                src={header?.backTo.src}
                                alt={header?.backTo.alt}
                                loading={header?.backTo.loading}
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