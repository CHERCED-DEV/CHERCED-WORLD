export const PageLoader = () => {
    return (
        <div className='start-page__position'>
            <section className="start-page">
                <header id="header" />
                <div id="banner" />
                <section id="community" />
                <section id="intro" />
                <section id="proyects" />
                <section id="footer" />
            </section>
            <div className="start">
                <section className="loader_container">
                    <div className="loader">
                        <div className="dot" />
                        <div className="dot" />
                        <div className="dot" />
                    </div>
                    <div className="atom">
                        <div className="electron" />
                        <div className="electron" />
                        <div className="electron" />
                    </div>
                </section>
            </div>
        </div>
    )
}
