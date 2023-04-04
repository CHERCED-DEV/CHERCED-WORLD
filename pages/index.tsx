import Head from 'next/head';
import { memo, lazy } from 'react';

import { HomeBannerConfig } from './api/customCMS/interfaces';
import { useLocalStorageData } from '../utils/hooks/getLocalStorageData';

const HomeBanner = lazy(() => import('../components/Mains/Banners/mainBanner/MainBanner'));

export default memo(function Home() {

    const [homeBanner] = useLocalStorageData<HomeBannerConfig>("CmsData", "homeBanner");

    return (
        <>
            <Head>
                <title>&lt;-CHERCED-WORLD-&gt;</title>
                <meta name="description" content="Welcome to my web project! It's a complete solution for web content management with a simulated backend powered by NodeJS and a frontend controlled by TypeScript. Built with NextJS 13, a ReactJS framework, and unique features to enhance its functionality." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#00000"/>
                <meta name="msapplication-TileColor" content="#00000"/>
            </Head>
            {
                homeBanner ? <HomeBanner homeBanner={homeBanner} /> : null
            }
        </>
    );
});