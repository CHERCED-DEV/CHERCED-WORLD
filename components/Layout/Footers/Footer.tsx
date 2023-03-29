import React, { memo } from 'react'
import styles from './utils/footer.module.scss'
import Image from 'next/legacy/image';
import { FooterConfig, ImageProps } from '../../../pages/api/customCMS/interfaces';
import { ListFooterMedia } from './utils/ListFooterMedia';


interface FooterPropsConfig {
    footer: FooterConfig;
}

const Footer: React.FC<FooterPropsConfig> = memo(function Footer({ footer }) {
    return (
        <footer className={styles.footerContainer}>
            <div className={styles.footer}>
                <section className={styles.footerBack}>
                    <a className={styles.footerBackLink} href={footer?.backOption.link.href}>
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
                    <h1 className={styles.footerBackTitle}>
                        {footer?.backOption.text}
                    </h1>
                </section>
                <ul className={styles.footerSocialMedia}>
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
                <section className={styles.footerCopyRight}>
                    <h1 className={styles.footerCopyRightTitle}>
                        <strong className={styles.footerCopyRightStrong}>
                            {footer?.copyright.strongText}
                        </strong>
                        {footer?.copyright.normalText}
                    </h1>
                </section>
            </div>
        </footer>
    )
})

export default Footer