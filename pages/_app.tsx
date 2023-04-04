import React, { lazy, useCallback, useEffect, useState } from 'react';
import '../sass/styles.scss';
import '../sass/StarterAndLoaders.scss';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { PortalContextProvider } from '../utils/providers/modalProvider';
import { pageClassDynamicBody } from '../utils/domMethods/pageClassDynamicBody';
import { getCMSData } from '../utils/providers/requests/homeCB';


const LayOut = lazy(() => import('../components/Layout/LayOut'));

interface PageClasses {
    pageClass: string;
    mainClass: string;
}

export default function App({ Component, pageProps }: AppProps) {

    const router = useRouter();
    const id = router.pathname;
    const [handleSubMenu, sethandleSubMenu] = useState<boolean>(false);
    const [pageClasses, setPageClasses] = useState<PageClasses>({ pageClass: "", mainClass: "" });

    const storageConstructor = useCallback(async () => {
        const CmsData = await getCMSData();
        window.localStorage.setItem("CmsData", JSON.stringify(CmsData));
    }, []);

    useEffect(() => {
        storageConstructor();
        const { pageClass, mainClass } = pageClassDynamicBody(id);
        setPageClasses({ pageClass, mainClass });
        sethandleSubMenu(false);
    }, [id]);

    return (
        <PortalContextProvider>
            <LayOut
                pageClass={pageClasses.pageClass}
                handleSubMenu={handleSubMenu}
                sethandleSubMenu={sethandleSubMenu}
                mainClass={pageClasses.mainClass}
            >
                <Component {...pageProps as any} />
            </LayOut>
        </PortalContextProvider>
    );
}