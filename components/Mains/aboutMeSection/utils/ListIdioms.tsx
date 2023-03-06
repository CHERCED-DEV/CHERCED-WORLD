import React from 'react';
import { IdiomsConfig } from "../../../../pages/api/customCMS/interfaces";

export const ListIdioms: React.FC<IdiomsConfig> = (props) => {

    return (
        <li className="aboutMe-idioms__item">
            <h1 className="aboutMe-idioms__title">{props.idiom}</h1>
            <img className="aboutMe-idioms__img"
                src={props.img.src}
                alt={props.img.alt}
                loading={props.img.loading}
            />
            <progress className="aboutMe-idioms__progress" value={props.progress} max="100"></progress>
        </li>
    )
}