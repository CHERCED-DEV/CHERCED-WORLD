import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';
import { getCMSData } from '../utils/providers/requests/homeCB';
import { CmsDataConfig } from './api/customCMS/interfaces';

interface MyDocumentProps extends DocumentInitialProps {
    CmsData: CmsDataConfig;
}
export default class MyDocument extends Document<MyDocumentProps> {
    onload: (() => void) | null = null;
    rel: 'preload' | 'stylesheet' = 'preload';
    render() {
        const { CmsData } = this.props
        return (
            <Html lang="en">
                <Head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" />
                    <link rel="preload" as="font" href="/fonts/Montserrat/static/Montserrat-Regular.ttf" type="font/ttf" crossOrigin="anonymous" />

                </Head>
                <body>
                    <Main/>
                    <div id='modal' />
                    <NextScript />
                    <script dangerouslySetInnerHTML={{ __html: `localStorage.setItem('CmsData', JSON.stringify(${JSON.stringify(CmsData)}));` }} />
                </body>
            </Html>
        );
    }
}

MyDocument.getInitialProps = async (ctx: DocumentContext): Promise<MyDocumentProps & DocumentInitialProps> => {
    const initialProps = await Document.getInitialProps(ctx);
    const CmsData = await getCMSData();
    return { ...initialProps, CmsData };
};