import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';

interface MyDocumentProps extends DocumentInitialProps {
	pageClass: string;
}

type PageClassMap = {
	[path: string]: string;
};

class MyDocument extends Document<MyDocumentProps> {
	static async getInitialProps(ctx: DocumentContext): Promise<MyDocumentProps> {
		const initialProps = await Document.getInitialProps(ctx);
		const { pathname } = ctx;
		let pageClass = '';

		// Assign class based on pathname
		const pageClassMap: PageClassMap = {
			"/aboutMe": "ABOUTME-PAGE",
			"/blog": "BLOG-PAGE",
			"/contactMe": "CONTACTME-PAGE",
			"/": "HOME-PAGE",
			"/portfolio": "PORTFOLIO-PAGE",
			"/services": "SERVICES-PAGE",
			// add clases as requiered
		};

		if (pageClassMap[pathname]) {
			pageClass = pageClassMap[pathname]; // actualizate the class as the path indicate you
		}

		return { ...initialProps, pageClass };
	}

	render(): JSX.Element {
		const { pageClass } = this.props;

		return (
			<Html>
				<Head />
				<body className={pageClass}>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;

