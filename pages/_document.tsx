import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';
import { getCMSData } from '../utils/providers/requests/homeCB';
import { CmsDataConfig } from './api/customCMS/interfaces';
interface MyDocumentProps extends DocumentInitialProps {
    CmsData: CmsDataConfig;
}
export default class MyDocument extends Document<MyDocumentProps> {
    static async getInitialProps(ctx: DocumentContext) {
        const initialProps = await Document.getInitialProps(ctx)
        const CmsData = await getCMSData()
        return { ...initialProps, CmsData }
    };
    onload: (() => void) | null = null;
    rel: 'preload' | 'stylesheet' = 'preload';
    render() {
        const {CmsData} = this.props
        return (
            <Html lang="en">
                <Head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" />
                    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Advent+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&display=swap" />
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Advent+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&display=swap" media="print" onLoad={() => { this.onload = null; this.rel = 'stylesheet' }} />
                    <noscript>
                        <link href="https://fonts.googleapis.com/css2?family=Advent+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&display=swap" rel="stylesheet" />
                    </noscript>
                </Head>
                <body>
                    <Main />
                    <div id='modal' />
                    <NextScript/>
                    <script dangerouslySetInnerHTML={{ __html: `localStorage.setItem('CmsData', JSON.stringify(${JSON.stringify(CmsData)}));`}}/>
                </body>
            </Html>
        );
    }
}