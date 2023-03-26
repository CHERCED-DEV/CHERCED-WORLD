import React, { useState } from 'react';
import '../sass/styles.scss';
import type { AppProps } from 'next/app';
import { CmsDataProvider } from '../utils/providers/cmsDataProvider';
import { LayoutContextProvider } from '../utils/providers/layOutContext';
import { PortalContextProvider } from '../utils/providers/modalProvider';
import { getCMSData } from '../utils/providers/requests/homeCB';
import type { CmsDataConfig } from './api/customCMS/interfaces';

interface MyAppProps extends AppProps {
    CmsData: CmsDataConfig;
}

export default function App({ Component, pageProps, CmsData }: MyAppProps) {
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Cuando los datos se cargan, se cambia el estado de carga
    const handleLoadData = () => {
        setIsLoading(false);
    };

    // Si todavía se están cargando los datos, muestra un indicador de carga
    if (isLoading) {
        return <div>Cargando...</div>;
    }
console.log(CmsData)
    // De lo contrario, renderiza la aplicación con los datos disponibles
    return (
        <CmsDataProvider CmsData={CmsData}>
            <LayoutContextProvider>
                <PortalContextProvider>
                    <Component {...pageProps} onLoadData={handleLoadData} />
                </PortalContextProvider>
            </LayoutContextProvider>
        </CmsDataProvider>
    );
}

export const getServerSideProps = async () => {
    try {
      const CmsData: CmsDataConfig = await getCMSData();
      return { props: { CmsData } };
    } catch (error) {
      console.error(error);
      return { props: { CmsData: null } };
    }
  };
  
