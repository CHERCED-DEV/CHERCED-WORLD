import React from 'react';
import '../sass/styles.scss';
import type { AppProps } from 'next/app'
import { CmsDataContextProvider } from '../providers/cmsDataProvider';

export default function App({ Component, pageProps }: AppProps) {
  return    <CmsDataContextProvider>
                <Component {...pageProps as any} />
            </CmsDataContextProvider> 
}