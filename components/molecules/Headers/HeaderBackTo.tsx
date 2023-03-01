import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';


export const HeaderBackTo: React.FC = () => {
    
    const router = useRouter();

    const { CmsData } = useCmsDataHome();
    const { header } = CmsData;


    const handleEvent = () => {
        const pathArray = router.asPath.split("/");
        pathArray.splice(-1, 1);
        const backTo = pathArray.join("/");
        return router.push(backTo)
    }

    return (
        <>
            <header id='header' className="headerBackTo">
            <button className="headerBackTo-button" onClick={handleEvent}>
                    <img className="headerBackTo-button__img"
                        src={header?.backTo.src}
                        alt={header?.backTo.alt}
                        loading={header?.backTo.loading}
                    />
                </button>
                <img className="headerBackTo__img"
                    src={header?.brandImage.src}
                    alt={header?.brandImage.alt}
                    loading={header?.brandImage.loading}
                />
            </header>
        </>
    )
}