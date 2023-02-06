import React from 'react'
import { skillConfig } from "../../../pages/api/customCMS/interfaces"

export const ListMySkills: React.FC<skillConfig> = (props) => {

    return (
        <li className="aboutMe-skills__item">
            <p className="aboutMe-skills__text">{ props.skill }</p> 
        </li>
    )
}

