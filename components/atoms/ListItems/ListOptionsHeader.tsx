import React from 'react'
import { ListItems } from "../../../pages/api/customCMS/interfaces"

export const ListOptionsHeader: React.FC<ListItems> = (props) => {

    return (
        <>
            <li className="header-navegation__item">
                <a className="header-navegation__link" href={props.href}>{props.title}</a>
            </li>
        </>
    )
}
