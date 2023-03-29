import React from 'react'
import Image from 'next/legacy/image';
import styles from './footer.module.scss'
import { ImageProps } from "../../../../pages/api/customCMS/interfaces"

export const ListFooterMedia: React.FC<ImageProps> = (props) => {

    return (
        <li className={styles.footerSocialMediaItem}>
            <a className={styles.footerSocialMediaLink} href={props.a}>
                <div className={styles.footerSocialMediaImg} >
                    {props?.src && (
                            <Image
                                src={props.src}
                                alt={props.alt}
                                loading={props.loading}
                                layout="intrinsic"
                                width={30}
                                height={30}
                            />
                        )}
                </div>
            </a>
        </li>
    )
}
