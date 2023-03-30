import React from 'react';
import Link from 'next/link';
import styles from './header.module.scss'
import { ListItems } from "../../../../pages/api/customCMS/interfaces";


export const ListSubMenu: React.FC<ListItems> = (props) => {

    return (
        <li className={styles.floatMenuNavegationItem}>
            <Link href={props.href}>
                <span className={styles.floatMenuNavegationLink} >{props.title}</span>
            </Link>
        </li>
    )
}
