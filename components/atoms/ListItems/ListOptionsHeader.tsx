import React from 'react'

export const ListOptionsHeader = (props: any) => {
    return (
        <>
            <li className="header-navegation__item">
                <a className="header-navegation__link" href={props.href}>{props.title}</a>
            </li>
        </>
    )
}
