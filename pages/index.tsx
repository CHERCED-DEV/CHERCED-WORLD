import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { StarterApp } from '../components/atoms/Spiners&Loaders/StarterApp';
import { PageLoader } from '../components/atoms/Spiners&Loaders/PageLoader';
import { Header } from '../components/molecules/Headers/Header';
import { HomeBanner } from '../components/molecules/Banners/MainBanner';
import { Footer } from '../components/molecules/Footers/Footer';
import { useCmsDataHome } from '../providers/cmsDataProvider';

export default function Home() {
    const { pageClass } = useCmsDataHome();
    const [showStarterApp, setShowStarterApp] = useState<boolean>(true);
    const [showPageLoader, setShowPageLoader] = useState<boolean>(false);

    useEffect(() => {
        if (sessionStorage.getItem('showStarterApp') === 'false') {
            setShowStarterApp(false);
            setShowPageLoader(true);
            const timerId = setTimeout(() => {
                setShowPageLoader(false);
            }, 3500);
            return () => {
                clearTimeout(timerId);
            };
        } else {
            const timerId = setTimeout(() => {
                setShowStarterApp(false);
                sessionStorage.setItem('showStarterApp', 'false');
                setShowPageLoader(true);
                const pageLoaderTimerId = setTimeout(() => {
                    setShowPageLoader(false);
                }, 3500);
                return () => {
                    clearTimeout(pageLoaderTimerId);
                };
            }, 6000);
            return () => {
                clearTimeout(timerId);
            };
        }
    }, []);

    return (
        <>
            <Head>
                <title>Create Next App</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {showStarterApp && <StarterApp />}
            {showPageLoader && <PageLoader />}
            {!showStarterApp && (
                <body className={pageClass}>
                    <Header />
                    <main className="main-home">
                        <HomeBanner />
                    </main>
                    <Footer />
                </body>
            )}
        </>
    );
}