import React from 'react';
import { ProExpConfig } from "../../../../pages/api/customCMS/interfaces";

export const ListExperiencie: React.FC<ProExpConfig> = (props) => {

    return (
        <li className="aboutMe-career__item">
            <div className="aboutMe-career__itemTitleConainer">
                <p className="aboutMe-career__itemTitle">
                    {props.initialDate} - {props.endingDate}
                </p>
                <p className="aboutMe-containerExp__title">
                    {props.expTitleDescription.expTitle}
                </p>
            </div>
            <div className="aboutMe-career__containerExp">
                <p className="aboutMe-containerExp__subTitle">
                    {props.expTitleDescription.company}
                </p>
                <p className="aboutMe-containerExp__description">
                    {props.expTitleDescription.descriptionExp}
                </p>
                <hr />
            </div>
        </li>
    )
}