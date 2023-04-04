import React, { lazy, memo } from 'react';
import Head from 'next/head'
import { PortfolioConfig } from './api/customCMS/interfaces';
import { useLocalStorageData } from '../utils/hooks/getLocalStorageData';

const ServicesWCFUSection = lazy(() => import('../components/Mains/ServicesWCFU/ServicesWCFUSection').then(({ ServicesWCFUSection }) => ({ default: ServicesWCFUSection })));

export default memo(function Services() {

    const [portfolio] = useLocalStorageData<PortfolioConfig>("CmsData", "portfolio");

    return (
        <>
            <Head>
                <title>Services | &lt;-CHERCED-WORLD-&gt;</title>
                <meta name="description" content="I offer web development services using the latest technologies to build scalable and efficient applications." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            {
                portfolio ? <ServicesWCFUSection portfolio={portfolio} /> : null
            }
        </>
    );
});