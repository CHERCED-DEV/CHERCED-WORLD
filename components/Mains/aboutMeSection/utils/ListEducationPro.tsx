import React from 'react';
import { EducationDegreesConfig } from "../../../../pages/api/customCMS/interfaces";

export const ListEducationPro: React.FC<EducationDegreesConfig> = (props) => {
    return (
        <li className="aboutMe-education__item">
            <p className="aboutMe-education__institution">
                {props.proTitleDegree.proTitle}
            </p>
            <div className="aboutMe-education__degreeParragraph">
                <hr />
                <p>{props.proTitleDegree.strong}</p>
            </div>
        </li>
    )
}