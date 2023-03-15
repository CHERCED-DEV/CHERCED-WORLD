import React from 'react'
import Image from 'next/legacy/image';
import { ImageProps } from "../../../../pages/api/customCMS/interfaces"

export const ListFooterMedia: React.FC<ImageProps> = (props) => {

    return (
        <li className="footer-socialMedia__item">
            <a className="footer-socialMedia__link" href={props.a}>
                <div className="footer-socialMedia__img">
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
