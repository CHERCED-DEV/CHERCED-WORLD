import React, { useEffect, useState, memo } from 'react';
import Head from 'next/head';
import { UseCmsDataHome } from '../utils/providers/cmsDataProvider';
import { AboutMeSectionProps } from '../utils/mainPages.interfaces';
import { PageLoader } from '../components/Spiners&Loaders/PageLoader';
import { Header } from '../components/Layout/Headers/Header';
import { AboutMeSection } from '../components/Mains/aboutMeSection/AboutMeSection';
import { Footer } from '../components/Layout/Footers/Footer';

interface AboutMeProps {
    data: AboutMeSectionProps;
}

export default function AboutMe({ data }: AboutMeProps) {

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
                <title>About Me</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {
                showStarterPage ? (
                    <PageLoader />
                ) : (
                    <body className={data.pageClass}>
                        <Header />
                        <main className="aboutMe">
                            <AboutMeSection
                                aboutMe={data.aboutMe}
                            />
                        </main>
                        <Footer />
                    </body>
                )
            }
        </>
    )
}

export async function getServerSideProps() {
    
    const { pageClass, CmsData } = await UseCmsDataHome();
    const { aboutMe } = CmsData;

    return {
        props: {
            pageClass,
            aboutMe
        }
    }
}

export const MemoizedAboutMe = memo(AboutMe);