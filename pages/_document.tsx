import Document, { Html, Head, Main, NextScript } from 'next/document';

function MyDocument() {
    return (
        <Html lang="en">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link
                    rel="preload"
                    as="font"
                    href="/fonts/Montserrat/static/Montserrat-Regular.ttf"
                    type="font/ttf"
                    crossOrigin="anonymous"
                />
            </Head>
            <body>
                <Main />
                <NextScript />
                <div id="modal" />
            </body>
        </Html>
    );
}

export default MyDocument;
