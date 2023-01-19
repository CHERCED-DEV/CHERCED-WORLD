import React from 'react'
import { techListConfig } from "../../../pages/api/customCMS/interfaces"


export const ListTecnologies: React.FC<techListConfig> = (props) => {
    
    return (
        <li className="aboutMe-tecnologies">
            <h1 className="aboutMe-tecnologies__title">
                {props.techName}
            </h1>
            <img className="aboutMe-tecnologies__img"
                src={props.img.src}
                alt={props.img.alt}
                loading={props.img.loading}
            />
            <progress className="aboutMe-tecnologies__progress" value={props.progress} max="100"></progress>
        </li>
    )
}