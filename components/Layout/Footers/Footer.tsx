import React, { memo } from 'react'
import styles from './utils/footer.module.scss'
import Image from 'next/legacy/image';
import { FooterConfig, ImageProps, LayOutConfig } from '../../../pages/api/customCMS/interfaces';
import { ListFooterMedia } from './utils/ListFooterMedia';
import { useLocalStorageData } from '../../../utils/hooks/getLocalStorageData';


const Footer: React.FC = memo(function Footer() {
    const [layOut] = useLocalStorageData<LayOutConfig>("CmsData", "layOut");
    return (
        <footer id='footer' className={styles.footerContainer}>
            <div className={styles.footer}>
                <section id='footer-back' className={styles.footerBack}>
                    <a className={styles.footerBackLink} href={layOut?.footer?.backOption.link.href}>
                        <div className="footer-back__img">
                            {layOut?.footer?.backOption?.img?.src && (
                                <Image
                                    src={layOut.footer?.backOption.img.src}
                                    alt={layOut.footer?.backOption.img.alt}
                                    layout='intrinsic'
                                    width={15}
                                    height={15}
                                />
                            )
                            }
                        </div>
                    </a>
                    <h1 className={styles.footerBackTitle}>
                        {layOut?.footer?.backOption.text}
                    </h1>
                </section>
                <ul id='footer-socialMedia' className={styles.footerSocialMedia}>
                    {
                        layOut?.footer?.footerSocialMedia.map((footerSocialMedia: ImageProps, index: number) => (
                            <ListFooterMedia
                                key={index}
                                src={footerSocialMedia.src}
                                alt={footerSocialMedia.alt}
                                a={footerSocialMedia.a}
                            />
                        ))
                    }
                </ul>
                <section className={styles.footerCopyRight}>
                    <h1 className={styles.footerCopyRightTitle}>
                        <strong className={styles.footerCopyRightStrong}>
                            {layOut?.footer?.copyright.strongText}
                        </strong>
                        {layOut?.footer?.copyright.normalText}
                    </h1>
                </section>
            </div>
        </footer>
    )
})

export default Footer