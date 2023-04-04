import { lazy, memo } from 'react';
import Head from 'next/head';
import { useLocalStorageData } from '../utils/hooks/getLocalStorageData';
import { ContactMeConfig } from './api/customCMS/interfaces';

const ContactMeSection = lazy(() => import('../components/Mains/contactMe/ContactMeSection'));

export default memo(function ContactMe() {

    const [contactMe] = useLocalStorageData<ContactMeConfig>("CmsData", "contactMe");

    return (
        <>
            <Head>
                <title>Contact Me | &lt;-CHERCED-WORLD-&gt;</title>
                <meta name="description" content="Let's get in touch! Fill out the form or email me directly." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {
                contactMe ? <ContactMeSection contactMe={contactMe} /> : null
            }
        </>
    );
});