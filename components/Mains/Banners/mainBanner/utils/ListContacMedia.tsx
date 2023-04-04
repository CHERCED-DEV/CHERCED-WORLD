import React from 'react';
import Image from 'next/image';
import { ImageProps } from "../../../../../pages/api/customCMS/interfaces";

export const ListContacMedia: React.FC<ImageProps> = (props) => {

    return (
        <>
            <li className="homeBanner-socialMedia__item">
                <a className="homeBanner-socialMedia__link" href={props.a}>
                    <div className="homeBanner-socialMedia__img">
                        {props?.src && (
                            <Image
                                src={props.src}
                                alt={props.alt}
                                fill={false}
                                width={30}
                                height={30}
                            />
                        )}
                    </div>
                </a>
            </li>
        </>
    )
}