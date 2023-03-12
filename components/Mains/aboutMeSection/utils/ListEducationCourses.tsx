import React from 'react';
import { CoursesConfig } from "../../../../pages/api/customCMS/interfaces";

export const ListEducationCourses: React.FC<CoursesConfig> = (props) => {

    return (
        <>
            {props.schools.map((school: string, index: number) => (
                <li key={index} className="aboutMe-courses__item">
                    <h2 className="aboutMe-courses__school">{school}</h2>
                    <div className="aboutMe-courses__descriptionCoruse">
                        <hr />
                        <p>{props.descriptions[index]}</p>
                    </div>
                </li>
            ))}
        </>
    )
}