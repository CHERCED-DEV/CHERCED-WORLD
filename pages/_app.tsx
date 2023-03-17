import React from 'react';
import '../sass/styles.scss';
import type { AppProps } from 'next/app';
import { CmsDataProvider } from '../utils/providers/cmsDataProvider';
import { LayoutContextProvider } from '../utils/providers/layOutContext';
import { PortalContextProvider } from '../utils/providers/modalProvider';


export default function App({ Component, pageProps }: AppProps) {
    return <CmsDataProvider>
        <LayoutContextProvider>
            <PortalContextProvider>
                <Component {...pageProps as any} />
            </PortalContextProvider>
        </LayoutContextProvider>
    </CmsDataProvider>
}