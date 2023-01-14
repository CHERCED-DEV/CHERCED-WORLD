import React from 'react'

export const ListSubMenu = (props: any) => {
    return (
        <li className="floatMenu-navegation__item">
            <a className="floatMenu-navegation__link" href={props.href}>{props.title}</a>
        </li>
    )
}
