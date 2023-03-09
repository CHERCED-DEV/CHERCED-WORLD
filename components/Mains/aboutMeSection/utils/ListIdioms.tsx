import React from 'react';
import Image from 'next/legacy/image';
import { IdiomsConfig } from "../../../../pages/api/customCMS/interfaces";

export const ListIdioms: React.FC<IdiomsConfig> = (props) => {

    return (
        <li className="aboutMe-idioms__item">
            <h1 className="aboutMe-idioms__title">{props.idiom}</h1>
            <div className="aboutMe-idioms__img">
                {props?.img?.src && (
                    <Image
                        src={props.img.src}
                        alt={props.img.alt}
                        loading={props.img.loading}
                        width={256}
                        height={256}
                        layout='responsive'
                    />
                )
            }
            </div>
            <progress className="aboutMe-idioms__progress" value={props.progress} max="100"></progress>
        </li>
    )
}