import { Fragment, lazy, memo } from 'react';
import Head from 'next/head';
import { useLocalStorageData } from '../../utils/hooks/getLocalStorageData';
import { PortfolioConfig } from '../api/customCMS/interfaces';

const PortfolioSection = lazy(() => import('../../components/Mains/portfolio/PortfolioSection').then(({ PortfolioSection }) => ({ default: PortfolioSection })));

export default memo(function Portfolio() {

    const [portfolio] = useLocalStorageData<PortfolioConfig>("CmsData", "portfolio");

    return (
        <>
            <Head>
                <title>Portfolio | &lt;-CHERCED-WORLD-&gt;</title>
                <meta name="description" content="Take a look at some of my recent projects showcasing my skills and expertise." />
                
            </Head>
            {portfolio ? (
                <Fragment>
                    <PortfolioSection portfolio={portfolio} />
                    <div className="AtomContainer">
                        <div className="atomP">
                            <div className="electronP" />
                            <div className="electronP" />
                            <div className="electronP" />
                        </div>
                    </div>
                </Fragment>
            ) : null}
        </>
    );
});