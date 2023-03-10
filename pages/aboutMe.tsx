import React, { useEffect, useState, memo, lazy } from 'react';
import Head from 'next/head';

import { getCMSData } from '../utils/providers/requests/homeCB';
import { AboutMeServerDataProps } from '../utils/dataConfigWorkflow.interfaces';
import { UseCmsDataHome } from '../utils/providers/cmsDataProvider';
import { Header } from '../components/Layout/Headers/Header';
import { Footer } from '../components/Layout/Footers/Footer';

const PageLoader = lazy(() => import('../components/Spiners&Loaders/PageLoader').then(({ PageLoader }) => ({ default: PageLoader })));
const AboutMeSection = lazy(() => import('../components/Mains/aboutMeSection/AboutMeSection').then(({ AboutMeSection }) => ({ default: AboutMeSection })));

export default memo(function AboutMe({ aboutMe }: AboutMeServerDataProps) {

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
                <title>About Me</title>
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
                        <main className="aboutMe">
                            <AboutMeSection
                                aboutMe={aboutMe}
                            />
                        </main>
                        <Footer />
                    </div>
                )
            }
        </>
    );
});

export async function getServerSideProps(): Promise<{ props: AboutMeServerDataProps }> {

    const CmsData = await getCMSData();
    const aboutMe = CmsData?.aboutMe

    return { props: { aboutMe } };
}
