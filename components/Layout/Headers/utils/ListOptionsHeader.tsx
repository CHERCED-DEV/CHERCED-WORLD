import React from 'react';
import Link from 'next/link';
import { ListItems } from "../../../../pages/api/customCMS/interfaces";

export const ListOptionsHeader: React.FC<ListItems> = (props) => {

    return (
        <>
            <li className="header-navegation__item">
                <Link href={props.href}>
                    <span className="header-navegation__link">{props.title}</span>
                </Link>
            </li>
        </>
    )
}
