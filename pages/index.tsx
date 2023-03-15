import { memo, useEffect, useState, Suspense, lazy } from 'react';
import Head from 'next/head';

import { getCMSData } from '../utils/providers/requests/homeCB';
import { HomeServerDataProps } from '../utils/dataConfigWorkflow.interfaces';
import { UseCmsDataHome } from '../utils/providers/cmsDataProvider';
import { StarterApp } from '../components/Spiners&Loaders/StarterApp';
import { Header } from '../components/Layout/Headers/Header';
import { Footer } from '../components/Layout/Footers/Footer';

const PageLoader = lazy(() => import('../components/Spiners&Loaders/PageLoader').then(({ PageLoader }) => ({ default: PageLoader })));
const HomeBanner = lazy(() => import('../components/Mains/Banners/mainBanner/MainBanner').then(({ HomeBanner }) => ({ default: HomeBanner })));

export default memo(function Home({ homeBanner }: HomeServerDataProps) {

    const { pageClass } = UseCmsDataHome();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [initialStorageValue, setInitialStorageValue] = useState<boolean>(false);

    useEffect(() => {
        function storageValidator() {
            const storedValue = window.sessionStorage.getItem('isLoading');
            if (storedValue !== null) {
                setIsLoading(storedValue === 'true');
            } else {
                setIsLoading(true);
            }
            setInitialStorageValue(true);
        }
        storageValidator()
    }, []);

    useEffect(() => {
        function handlePageLoad() {
            if (sessionStorage.getItem('isLoading') === 'false') {
                const timerId = setTimeout(() => {
                    setIsLoading(false);
                }, 10500);
                return () => {
                    clearTimeout(timerId);
                };
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
            <Head>
                <title>Create Next App</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {initialStorageValue && isLoading && <StarterApp />}
            {!isLoading && (
                <Suspense fallback={<PageLoader />}>
                    <div className={pageClass}>
                        <Header />
                        <main className="main-home">
                            <HomeBanner homeBanner={homeBanner} />
                        </main>
                        <Footer />
                    </div>
                </Suspense>
            )}
        </>
    );
});

export const getServerSideProps = async (): Promise<{ props: HomeServerDataProps }> => {
    const CmsData = await getCMSData();
    const homeBanner = CmsData?.homeBanner;

    return { props: { homeBanner } };
};