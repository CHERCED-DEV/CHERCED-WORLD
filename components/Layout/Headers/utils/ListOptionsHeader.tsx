import React from 'react';
import Link from 'next/link';
import styles from './header.module.scss'
import { ListItems } from "../../../../pages/api/customCMS/interfaces";


export const ListOptionsHeader: React.FC<ListItems> = (props) => {

    return (
        <>
            <li className={styles.headerNavegationItem}>
                <Link href={props.href}>
                    <span className={styles.headerNavegationLink}>{props.title}</span>
                </Link>
            </li>
        </>
    )
}
