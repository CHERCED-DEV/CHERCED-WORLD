import React, { memo, useEffect, useState } from 'react'
import Image from 'next/legacy/image';
import { FooterConfig, ImageProps } from '../../../pages/api/customCMS/interfaces';
import { getCMSData } from '../../../utils/providers/requests/homeCB';
import { ListFooterMedia } from './utils/ListFooterMedia';


export const Footer: React.FC = memo(() => {

    const [footer, setFooter] = useState<FooterConfig | undefined>();

    useEffect(() => {
        const fetchHeaderData = async () => {
            const CmsData = await getCMSData();
            setFooter(CmsData?.footer);
        }
        fetchHeaderData();
    }, []);

    return (
        <footer className="footer-container">
           <div className="footer">
           <section className="footer-back">
                <a className="footer-back__link" href={footer?.backOption.link.href}>
                    <div className="footer-back__img">
                        {footer?.backOption?.img?.src && (
                            <Image
                                src={footer?.backOption.img.src}
                                alt={footer?.backOption.img.alt}
                                loading={footer?.backOption.img.loading}
                                layout='intrinsic'
                                width={15}
                                height={15}
                            />
                        )
                    }
                    </div>
                </a>
                <h1 className="footer-back__title">
                    {footer?.backOption.text}
                </h1>
            </section>
            <ul className="footer-socialMedia">
                {
                    footer?.footerSocialMedia.map((footerSocialMedia: ImageProps, index: number) => (
                        <ListFooterMedia
                            key={index}
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
                    <strong className="footer-copyRight__strong">
                        {footer?.copyright.strongText}
                    </strong>
                    {footer?.copyright.normalText}
                </h1>
            </section>
           </div>
        </footer>
    )
})

Footer.displayName = 'Footer';