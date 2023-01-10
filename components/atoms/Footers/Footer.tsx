import React from 'react'
import { useCmsDataHome } from '../../../providers/cmsDataProvider';


export const Footer = () => {
    const { CmsData } = useCmsDataHome()
    const { footer } = CmsData;

    if (!footer) {
        return (
            <header>
                <h1 style={{ color: 'red', fontSize: 32 }}>
                    Loading...
                </h1>
            </header>
        )
    } else {
        return (
            <footer className="footer">
                <section className="footer-back">
                    <div className="footer-back__img">
                        <a className="footer-back__link" href={footer.backOption.link.href}>
                            <img className="footer-back__img" src={footer.backOption.img.src} alt={footer.backOption.img.alt} loading={footer.backOption.img.loading} />
                        </a>
                    </div>
                    <h1 className="footer-back__title">
                        {footer.backOption.text}
                    </h1>
                </section>
                <ul className="footer-socialMedia">
                    <li className="footer-socialMedia__list">
                        <a className="footer-socialMedia__link" href={footer.footerSocialMedia.facebook.link.href}>
                            <img className="footer-socialMedia__img" src={footer.footerSocialMedia.facebook.img.src} alt={footer.footerSocialMedia.facebook.img.alt} loading={footer.footerSocialMedia.facebook.img.loading} />
                        </a>
                    </li>
                    <li className="footer-socialMedia__list">
                        <a className="footer-socialMedia__link" href={footer.footerSocialMedia.linkedin.link.href}>
                            <img className="footer-socialMedia__img" src={footer.footerSocialMedia.linkedin.img.src} alt={footer.footerSocialMedia.linkedin.img.alt} loading={footer.footerSocialMedia.linkedin.img.loading} />
                        </a>
                    </li>
                    <li className="footer-socialMedia__list">
                        <a className="footer-socialMedia__link" href={footer.footerSocialMedia.instagram.link.href}>
                            <img className="footer-socialMedia__img" src={footer.footerSocialMedia.instagram.img.src} alt={footer.footerSocialMedia.instagram.img.alt} loading={footer.footerSocialMedia.instagram.img.loading} />
                        </a>
                    </li>
                    <li className="footer-socialMedia__list">
                        <a className="footer-socialMedia__link" href={footer.footerSocialMedia.mailito.link.href}>
                            <img className="footer-socialMedia__img" src={footer.footerSocialMedia.mailito.img.src} alt={footer.footerSocialMedia.mailito.img.alt} loading={footer.footerSocialMedia.mailito.img.loading} />
                        </a>
                    </li>
                </ul>
                <section className="footer-copyRight">
                    <h1 className="footer-copyRight__title">
                        <strong>{footer.copyright.strongText}</strong>
                        {footer.copyright.normalText}
                    </h1>
                </section>
            </footer>
        )
    }
}
