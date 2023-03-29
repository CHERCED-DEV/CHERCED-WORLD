import React from 'react';
import '../sass/styles.scss';
import '../sass/StarterAndLoaders.scss';
import type { AppProps } from 'next/app';
import { CmsDataProvider } from '../utils/providers/cmsDataProvider';
import { PortalContextProvider } from '../utils/providers/modalProvider';


export default function App({ Component, pageProps }: AppProps) {
    return <CmsDataProvider>
                <PortalContextProvider>
                       <Component {...pageProps as any} /> 
                </PortalContextProvider>
            </CmsDataProvider>
}