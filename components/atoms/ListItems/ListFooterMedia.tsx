import React from 'react'
import { ImageProps } from "../../../pages/api/customCMS/interfaces"

export const ListFooterMedia: React.FC<ImageProps> = (props) => {
    return (
        <li className="footer-socialMedia__list">
            <a className="footer-socialMedia__link" href={props.a}>
                <img className="footer-socialMedia__img"
                    src={props.src}
                    alt={props.alt}
                    loading={props.loading}
                />
            </a>
        </li>
    )
}
