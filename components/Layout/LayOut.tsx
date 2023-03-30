import React, { lazy, memo, ReactNode, Suspense, useEffect, useState } from 'react';
import { ContextProviderProps } from '../../pages/api/customCMS/interfaces';
import { useLocalStorageData } from '../../utils/hooks/getLocalStorageData';
import { LayOutConfig } from '../../pages/api/customCMS/interfaces';
import { PageLoader } from './Spiners&Loaders/PageLoader';


interface LayoutPropsConfig {
    handleSubMenu: boolean;
    sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
    pageClass: string;
    mainClass: string;
    children: ContextProviderProps | ReactNode | null;
}

const Header = lazy(() => import('./Headers/Header'));
const HeaderBackTo = lazy(() => import('./Headers/HeaderBackTo'))
const Footer = lazy(() => import('./Footers/Footer'));

const LayOut: React.FC<LayoutPropsConfig> = memo(function LayOut({ children, mainClass, pageClass, handleSubMenu, sethandleSubMenu }) {
    const [headerSimple, setHeaderSimple] = useState<boolean>(true);
    const [layOut] = useLocalStorageData<LayOutConfig>("CmsData", "layOut");

    useEffect(() => {
        if (pageClass == "BLOG-PAGE") {
            setHeaderSimple(false);
        }
    }, [pageClass])

    return (
        <Suspense fallback={<PageLoader />}>
            <div className={pageClass}>
                {
                    headerSimple ? (layOut ? <Header header={layOut.header} handleSubMenu={handleSubMenu} sethandleSubMenu={sethandleSubMenu} pageClass={pageClass} /> : null)
                        : (layOut ? <HeaderBackTo header={layOut.header} /> : null)
                }
                <main className={mainClass}>
                    <>
                        {children}
                    </>
                </main>
                {
                    layOut ? <Footer footer={layOut.footer} /> : null
                }
            </div>
        </Suspense>
    )
})

export default LayOut
