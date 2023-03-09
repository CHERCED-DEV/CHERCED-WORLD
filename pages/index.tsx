import React, { memo, useEffect, useState, Suspense, lazy } from 'react';
import Head from 'next/head';

import { getCMSData } from '../utils/providers/requests/homeCB';
import { HomeServerDataProps } from '../utils/dataConfigWorkflow.interfaces';
import { UseCmsDataHome } from '../utils/providers/cmsDataProvider';
import { StarterApp } from '../components/Spiners&Loaders/StarterApp';
import { Header } from '../components/Layout/Headers/Header';
import { Footer } from '../components/Layout/Footers/Footer';

const PageLoader = lazy(() => import('../components/Spiners&Loaders/PageLoader').then(({ PageLoader }) => ({ default: PageLoader })));
const HomeBanner = lazy(() => import('../components/Mains/Banners/mainBanner/MainBanner').then(({ HomeBanner }) => ({ default: HomeBanner })));

export default memo(function Home({ homeBanner }: HomeServerDataProps) {
  const { pageClass } = UseCmsDataHome();

  const [showStarterApp, setShowStarterApp] = useState<boolean>(true);
  const [showPageLoader, setShowPageLoader] = useState<boolean>(false);

  useEffect(() => {
    function handlePageLoad() {
      if (sessionStorage.getItem('showStarterApp') === 'false') {
        setShowStarterApp(false);
        setShowPageLoader(true);
        const timerId = setTimeout(() => {
          setShowPageLoader(false);
        }, 1500);
        return () => {
          clearTimeout(timerId);
        };
      } else {
        const timerId = setTimeout(() => {
          setShowStarterApp(false);
          sessionStorage.setItem('showStarterApp', 'false');
          const pageLoaderTimerId = setTimeout(() => {
            setShowPageLoader(false);
          }, 3500);
          return () => {
            clearTimeout(pageLoaderTimerId);
          };
        }, 5500);
        return () => {
          clearTimeout(timerId);
        };
      }
    }

    handlePageLoad();

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
      {showPageLoader && !showStarterApp && (
        <Suspense fallback={<StarterApp />}>
          <PageLoader />
        </Suspense>
      )}
      {!showStarterApp && !showPageLoader && (
        <div className={pageClass}>
          <Header />
          <main className="main-home">
            <HomeBanner homeBanner={homeBanner} />
          </main>
          <Footer />
        </div>
      )}
    </>
  );
});

export const getServerSideProps = async (): Promise<{ props: HomeServerDataProps }> => {
  const CmsData = await getCMSData();
  const homeBanner = CmsData?.homeBanner;

  return { props: { homeBanner } };
};