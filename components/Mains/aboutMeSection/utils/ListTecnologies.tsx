import React from 'react';
import Image from 'next/legacy/image';
import { techListConfig } from "../../../../pages/api/customCMS/interfaces";


export const ListTecnologies: React.FC<techListConfig> = (props) => {

    return (
        <li className="aboutMe-tecnologies__item">
            <h1 className="aboutMe-tecnologies__title">
                {props.techName}
            </h1>
            <div className="aboutMe-tecnologies__img">
                {props?.img?.src && (
                    <Image
                        src={props.img.src}
                        alt={props.img.alt}
                        loading={props.img.loading}
                        width={256}
                        height={256}
                        layout="responsive"
                    />
                )
                }
            </div>
            <progress className="aboutMe-tecnologies__progress" value={props.progress} max="100"></progress>
        </li>
    )
}