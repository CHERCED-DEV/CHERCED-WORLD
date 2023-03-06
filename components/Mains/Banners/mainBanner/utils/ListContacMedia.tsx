import React from 'react';
import { ImageProps } from "../../../../../pages/api/customCMS/interfaces";

export const ListContacMedia: React.FC<ImageProps> = (props) => {

    return (
        <>
            <li className="homeBanner-socialMedia__item">
                <a className="homeBanner-socialMedia__link" href={props.a}>
                    <img className="homeBanner-socialMedia__img"
                        src={props.src}
                        alt={props.alt}
                        loading={props.loading}
                    />
                </a>
            </li>
        </>
    )
}