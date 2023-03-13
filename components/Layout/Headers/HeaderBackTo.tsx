import React, { memo, useEffect, useState } from 'react';
import Image from 'next/legacy/image';
import { useRouter } from 'next/router';
import { HeaderConfig } from '../../../pages/api/customCMS/interfaces';
import { getCMSData } from '../../../utils/providers/requests/homeCB';


export const HeaderBackTo: React.FC = memo(() => {

    const [header, setHeader] = useState<HeaderConfig | undefined>();

    const router = useRouter();

    useEffect(() => {
        const fetchHeaderData = async () => {
            const CmsData = await getCMSData();
            setHeader(CmsData?.header);
        }
        fetchHeaderData();
    }, []);

    const handleEvent = () => {
        const pathArray = router.asPath.split("/");
        pathArray.splice(-1, 1);
        const backTo = pathArray.join("/");
        return router.push(backTo)
    }

    return (
        <>
            <header id='header' className="headerBackTo">
                <div className="headerBackTo__img">
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
                <button className="headerBackTo-button" onClick={handleEvent}>
                    <div className="headerBackTo-button__img">
                        {header?.brandImage?.src && (
                            <Image
                                src={header?.backTo.src}
                                alt={header?.backTo.alt}
                                loading={header?.backTo.loading}
                                layout="intrinsic"
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

HeaderBackTo.displayName = 'HeaderBackTo';