import React, { lazy, useEffect, useState } from 'react';
import '../sass/styles.scss';
import '../sass/StarterAndLoaders.scss';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { PortalContextProvider } from '../utils/providers/modalProvider';
import { pageClassDynamicBody } from '../utils/domMethods/pageClassDynamicBody';


const LayOut = lazy(() => import('../components/Layout/LayOut'));

interface PageClasses {
    pageClass: string;
    mainClass: string;
}

export default function App({ Component, pageProps }: AppProps) {

    const router = useRouter();
    const id = router.asPath;
    const [handleSubMenu, sethandleSubMenu] = useState<boolean>(false);
    const [pageClasses, setPageClasses] = useState<PageClasses>({ pageClass: "", mainClass: "" });

    useEffect(() => {
        const { pageClass, mainClass } = pageClassDynamicBody(id);
        setPageClasses({ pageClass, mainClass });
        sethandleSubMenu(false);
    }, [id]);

    return (
        pageClasses.pageClass !== "none" ? (
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
        ) : (
            <PortalContextProvider>
                <Component {...pageProps as any} />
            </PortalContextProvider>
        )
    );

}