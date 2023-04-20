import React, { lazy, memo, ReactNode, Suspense, useEffect, useState } from 'react';
import { ContextProviderProps } from '../../pages/api/customCMS/interfaces';
import { StarterApp } from './Spiners&Loaders/StarterApp';
import { PageLoader } from './Spiners&Loaders/PageLoader';
import { usePortalProvider } from '../../utils/providers/modalProvider';

interface LayoutPropsConfig {
    handleSubMenu: boolean;
    sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
    pageClass: string;
    mainClass: string;
    children: ContextProviderProps | ReactNode | null;
}

const Header = lazy(() => import('./Headers/Header'));
const Footer = lazy(() => import('./Footers/Footer'));

const LayOut: React.FC<LayoutPropsConfig> = memo(function LayOut({ children, mainClass, pageClass, handleSubMenu, sethandleSubMenu }) {

    const [headerSimple, setHeaderSimple] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [initialStorageValue, setInitialStorageValue] = useState<boolean>(false);
    const { unReadCount, fetchUnreadCount } = usePortalProvider();



    useEffect(() => {
        if (pageClass == "BLOG-POST--PAGE" || pageClass == "PROJECTS-PAGE" || pageClass == "INBOX--PAGE") {
            setHeaderSimple(false);
        }
        fetchUnreadCount();
    }, [pageClass,fetchUnreadCount])

    useEffect(() => {
        const storedValue = window.sessionStorage.getItem('isLoading');
        if (storedValue !== null) {
            setIsLoading(storedValue === 'true');
        } else {
            setIsLoading(true);
        }
        setInitialStorageValue(true);
    }, []);

    useEffect(() => {
        function handlePageLoad() {
            if (sessionStorage.getItem('isLoading') === 'false') {
                console.log("Welcome to Cherced World")
            } else {
                const timerId = setTimeout(() => {
                    sessionStorage.setItem('isLoading', 'false');
                    setIsLoading(false);
                }, 4500);
                return () => {
                    clearTimeout(timerId);
                };
            }
        }

        handlePageLoad();

    }, []);


    return (
        <>
            {initialStorageValue && isLoading && <StarterApp />}
            {!isLoading && (
                <Suspense fallback={<PageLoader />}>
                    <div className={pageClass}>
                        <Header handleSubMenu={handleSubMenu} sethandleSubMenu={sethandleSubMenu} pageClass={pageClass} headerSimple={headerSimple} setHeaderSimple={setHeaderSimple} unReadCount={unReadCount} />
                        <main className={mainClass}>
                            <>
                                {children}
                            </>
                        </main>
                        <Footer />
                    </div>
                </Suspense>)
            }
        </>

    )
})

export default LayOut;
