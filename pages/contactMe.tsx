import React, { lazy, memo, useEffect, useState } from 'react';
import Head from 'next/head';
import { ContactMeServerDataProps } from '../utils/dataConfigWorkflow.interfaces';
import { UseCmsDataHome } from '../utils/providers/cmsDataProvider';
import { Header } from '../components/Layout/Headers/Header';
import { Footer } from '../components/Layout/Footers/Footer';
import { getCMSData } from '../utils/providers/requests/homeCB';

const PageLoader = lazy(() => import('../components/Spiners&Loaders/PageLoader').then(({ PageLoader }) => ({ default: PageLoader })));
const ContactMeSection = lazy(() => import('../components/Mains/contactMe/ContactMeSection').then(({ ContactMeSection }) => ({ default: ContactMeSection })));

export default memo(function ContactMe({ contactMe }: ContactMeServerDataProps) {

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
                <title>Contact Me</title>
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
                        <main className="contactMe">
                            <ContactMeSection
                                contactMe={contactMe}
                            />
                        </main>
                        <Footer />
                    </div>
                )
            }
        </>
    );
});

export async function getServerSideProps(): Promise<{ props: ContactMeServerDataProps }> {

    const CmsData = await getCMSData();
    const contactMe = CmsData?.contactMe

    return { props: { contactMe } };

}