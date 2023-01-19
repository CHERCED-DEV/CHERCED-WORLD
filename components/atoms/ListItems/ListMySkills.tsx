import React from 'react'
import { skillConfig } from "../../../pages/api/customCMS/interfaces"

export const ListMySkills: React.FC<skillConfig> = (props) => {

    return (
        <li className="aboutMe-skills__item">
            {
                props.skill
            }
        </li>
    )
}

