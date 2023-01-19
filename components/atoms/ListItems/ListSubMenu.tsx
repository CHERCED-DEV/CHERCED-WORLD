import React from 'react'
import { ListItems } from "../../../pages/api/customCMS/interfaces"

export const ListSubMenu: React.FC<ListItems> = (props) => {

    return (
        <li className="floatMenu-navegation__item">
            <a className="floatMenu-navegation__link" href={props.href}>{props.title}</a>
        </li>
    )
}
