import React from 'react'
import { EducationConfig } from "../../../pages/api/customCMS/interfaces"

export const ListEducationPro: React.FC<EducationConfig> = (props) => {

    return (

        <li className="aboutMe-education__item">
            <h1 className="aboutMe-education__institution">
                {props.proTitleDegree.proTitle}
            </h1>
            <p className="aboutMe-education__degreeParragraph">
                {props.proTitleDegree.strong}
            </p>
        </li>
    )
}
