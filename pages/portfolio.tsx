import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useCmsDataHome } from '../providers/cmsDataProvider';
import { PageLoader } from '../components/atoms/Spiners&Loaders/PageLoader';
import { Header } from '../components/molecules/Headers/Header';
import { PortfolioSection } from '../components/molecules/Mains/PortfolioSection'
import { Footer } from '../components/molecules/Footers/Footer';

export default function Portfolio() {
    const { pageClass } = useCmsDataHome()
    const [showStarterPage, setShowStarterPage] = useState<boolean>(true);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setShowStarterPage(!showStarterPage);
        }, 3500);

        // Return a function to clear the timer before the component is unmounted.
        return () => {
            clearTimeout(timerId);
        }
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
                    <body className={pageClass}>
                        <Header />
                        <main className="portfolio">
                            <PortfolioSection />
                        </main>
                        <Footer />
                    </body>
                )
            }
        </>
    )
}