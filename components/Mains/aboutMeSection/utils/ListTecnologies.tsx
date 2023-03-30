import React from 'react';
import Image from 'next/image';
import { TechListConfig } from "../../../../pages/api/customCMS/interfaces";


export const ListTecnologies: React.FC<TechListConfig> = (props) => {

    return (
        <li className={props.hidden ? ("aboutMe-tecnologies__item HIDDEN") : ("aboutMe-tecnologies__item VISIBLE")}>
            <h1 className="aboutMe-tecnologies__title">
                {props.techName}
            </h1>
            <div className="aboutMe-tecnologies__img">
                {props?.img?.src && (
                    <Image
                        src={props.img.src}
                        alt={props.img.alt}
                        loading={props.img.loading}
                        width={128}
                        height={128}
                        fill={false}
                    />
                )
                }
            </div>
            <progress className="aboutMe-tecnologies__progress" value={props.progress} max="100"></progress>
        </li>
    )
}