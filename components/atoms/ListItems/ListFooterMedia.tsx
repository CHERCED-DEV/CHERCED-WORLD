import React from 'react'

export const ListFooterMedia = (props: any) => {
    return (
        <li className="footer-socialMedia__list">
            <a className="footer-socialMedia__link" href={props.a}>
                <img className="footer-socialMedia__img" src={props.src} alt={props.alt} loading={props.loading} />
            </a>
        </li>
    )
}
