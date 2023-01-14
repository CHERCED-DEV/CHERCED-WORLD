import React from 'react'

export const ListContacMedia = (props: any) => {
    return (
        <>
            <li className="homeBanner-socialMedia__item">
                <a className="homeBanner-socialMedia__link" href={props.a}>
                    <img src={props.src} alt={props.alt} loading={props.loading} />
                </a>
            </li>
        </>
    )
}
