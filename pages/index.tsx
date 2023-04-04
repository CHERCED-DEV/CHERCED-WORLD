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
                <title>Create Next App</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {
                homeBanner ? <HomeBanner homeBanner={homeBanner} /> : null
            }
        </>
    );
});