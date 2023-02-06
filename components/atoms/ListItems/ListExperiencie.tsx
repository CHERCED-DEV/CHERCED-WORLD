import React from 'react'
import { ProExpConfig } from "../../../pages/api/customCMS/interfaces"

export const ListExperiencie: React.FC<ProExpConfig> = (props) => {
    return (
        <li className="aboutMe-career__item">
            <div className="aboutMe-career__itemTitleConainer">
                <h1 className="aboutMe-career__itemTitle">
                    {props.initialDate} - {props.endingDate}
                </h1>
            </div>
            <div className="aboutMe-career__containerExp">
                <h1 className="aboutMe-containerExp__title">
                    {props.expTitleDescription.expTitle}
                </h1>
                <h2 className="aboutMe-containerExp__subTitle">
                    {props.expTitleDescription.company}
                </h2>
                <p className="aboutMe-containerExp__description">
                    {props.expTitleDescription.descriptionExp}
                </p>
            </div>
        </li>
    )
}
