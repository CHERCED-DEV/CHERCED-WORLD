import React from 'react'
import { CoursesConfig } from "../../../pages/api/customCMS/interfaces"

export const ListEducationCourses: React.FC<CoursesConfig> = (props) => {
    
    return (
        <li className="aboutMe-courses__item">
            {
                props.schools.map((school: string, index: number) => (
                    <h1 key={index} className="aboutMe-courses__textFlag">
                        {school}
                    </h1>
                ))
            }
            <ul className="aboutMe-courses__listCrouses">
                {
                    props.descriptions.map((description: string, index: number) => (
                        <li key={index} className="aboutMe-courses__itemCoruses">
                            <h1 className="aboutMe-courses__descriptionCoruse">
                                {description}
                            </h1>
                        </li>
                    ))
                }
            </ul>
        </li>
    )
}
