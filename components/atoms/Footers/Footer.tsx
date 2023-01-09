import React from 'react'
import Image from 'next/image'

export const Footer = () => {
    return (
        <footer className="footer">
            <section className="footer-back">
                <div className="footer-back__img">
                    <Image
                        src=""
                        alt="arrowUp"
                        layout="responsive"
                        width={800}
                        height={600}
                    />
                </div>
                <h1 className="footer-back__title">
                    BACK TO TOP
                </h1>
            </section>
            <section className="footer-socialMedia">
                <div className="footer-socialMedia__icon">
                    <Image
                        src=""
                        alt="arrowUp"
                        layout="responsive"
                        width={800}
                        height={600}
                    />
                </div>
                <div className="footer-socialMedia__icon">
                    <Image
                        src=""
                        alt="arrowUp"
                        layout="responsive"
                        width={800}
                        height={600}
                    />
                </div>
                <div className="footer-socialMedia__icon">
                    <Image
                        src=""
                        alt="arrowUp"
                        layout="responsive"
                        width={800}
                        height={600}
                    />
                </div>
                <div className="footer-socialMedia__icon">
                    <Image
                        src=""
                        alt="arrowUp"
                        layout="responsive"
                        width={800}
                        height={600}
                    />
                </div>
            </section>
            <section className="footer-copyRight">
                <h1 className="footer-copyRight__title">
                    <strong>@2021 Camilo Hernandez</strong>
                    All Rights Reserved.
                </h1>
            </section>
        </footer>
    )
}
