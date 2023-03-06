import React from 'react';
import Link from 'next/link';
import { ListItems } from "../../../../pages/api/customCMS/interfaces";

export const ListSubMenu: React.FC<ListItems> = (props) => {

    return (
        <li className="floatMenu-navegation__item">
            <Link href={props.href}>
                <span className="floatMenu-navegation__link" >{props.title}</span>
            </Link>
        </li>
    )
}
