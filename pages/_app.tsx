import React from 'react';
import '../sass/styles.scss';
import type { AppProps } from 'next/app'
import { CmsDataContextProvider } from '../providers/cmsDataProvider';
import { PortalContextProvider } from '../providers/modalProvider';

export default function App({ Component, pageProps }: AppProps) {
    return <PortalContextProvider>
                <CmsDataContextProvider>
                    <Component {...pageProps as any} />
                </CmsDataContextProvider>
            </PortalContextProvider>
}