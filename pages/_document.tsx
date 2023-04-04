import Document, { Html, Head, Main, NextScript, DocumentInitialProps } from 'next/document';


export default class MyDocument extends Document<DocumentInitialProps> {
    onload: (() => void) | null = null;
    rel: 'preload' | 'stylesheet' = 'preload';
    render() {
        return (
            <Html lang="en">
                <Head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" />
                    <link rel="preload" as="font" href="/fonts/Montserrat/static/Montserrat-Regular.ttf" type="font/ttf" crossOrigin="anonymous" />
                    <link rel="icon" href="/assets/icons/brandLogo.png" />
                </Head>
                <body>
                    <Main/>
                    <div id='modal' />
                    <NextScript />
                </body>
            </Html>
        );
    }
}