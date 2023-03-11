import React, { lazy, memo, useEffect, useState } from 'react';
import Head from 'next/head';
import { getCMSData } from '../utils/providers/requests/homeCB';
import { PortfolioServicesServerDataProps } from '../utils/dataConfigWorkflow.interfaces';
import { UseCmsDataHome } from '../utils/providers/cmsDataProvider';
import { Header } from '../components/Layout/Headers/Header';
import { Footer } from '../components/Layout/Footers/Footer';


const PageLoader = lazy(() => import('../components/Spiners&Loaders/PageLoader').then(({ PageLoader }) => ({ default: PageLoader })));
const PortfolioSection = lazy(() => import('../components/Mains/portfolio/PortfolioSection').then(({ PortfolioSection }) => ({ default: PortfolioSection })));

export default memo(function Portfolio({ portfolio }: PortfolioServicesServerDataProps) {

    const { pageClass } = UseCmsDataHome();

    const [showStarterPage, setShowStarterPage] = useState<boolean>(true);

    useEffect(() => {
        function handlePageLoad() {
            const timerId = setTimeout(() => {
                setShowStarterPage(!showStarterPage);
            }, 1500);

            // Return a function to clear the timer before the component is unmounted.
            return () => {
                clearTimeout(timerId);
            }
        }

        handlePageLoad();
    }, []);

    return (
        <>
            <Head>
                <title>Portfolio</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {
                showStarterPage ? (
                    <PageLoader />
                ) : (
                    <div className={pageClass}>
                        <Header />
                        <main className="portfolio">
                            <PortfolioSection
                                portfolio={portfolio}
                            />
                        </main>
                        <div className="AtomContainer">
                            <div className="atomP">
                                <div className="electronP" />
                                <div className="electronP" />
                                <div className="electronP" />
                            </div>
                        </div>
                        <Footer />
                    </div>
                )
            }
        </>
    );
});

export async function getServerSideProps(): Promise<{ props: PortfolioServicesServerDataProps }> {

    const CmsData = await getCMSData();
    const portfolio = CmsData?.portfolio

    return { props: { portfolio } };
}