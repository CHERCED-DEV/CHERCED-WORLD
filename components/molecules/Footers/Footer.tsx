import React from 'react'
import { ImageProps } from '../../../pages/api/customCMS/interfaces';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { ListFooterMedia } from '../../atoms/ListItems/ListFooterMedia';


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
                    {
                       footer.footerSocialMedia.map((footerSocialMedia: ImageProps, index: number)=>(
                            <ListFooterMedia
                                src={footerSocialMedia.src}
                                alt={footerSocialMedia.alt}
                                loading={footerSocialMedia.loading}
                                a={footerSocialMedia.a}
                            />
                       )) 
                    }
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
