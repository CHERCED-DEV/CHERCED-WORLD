import Head from 'next/head';
import { memo, lazy } from 'react';
import { useLocalStorageData } from '../utils/hooks/getLocalStorageData';
import { AboutMeConfig } from './api/customCMS/interfaces';

const AboutMeSection = lazy(() => import('../components/Mains/aboutMeSection/AboutMeSection'));

export default memo(function AboutMe() {

    const [aboutMe] = useLocalStorageData<AboutMeConfig>("CmsData", "aboutMe");

    return (
        <>
            <Head>
            <title>About Me | &lt;-CHERCED-WORLD-&gt;</title>
                <meta name="description" content=" I'm a frontend developer with MERN full-stack experience. Passionate about building beautiful and functional web applications." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            {
                aboutMe ? <AboutMeSection aboutMe={aboutMe} /> : null
            }
        </>
    );
});