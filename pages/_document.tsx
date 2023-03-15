import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
    onload: (() => void) | null = null;
    rel: 'preload' | 'stylesheet' = 'preload';
    render() {
        return (
            <Html lang="en">
                <Head>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
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
                    <NextScript />
                </body>
            </Html>
        );
    }
}