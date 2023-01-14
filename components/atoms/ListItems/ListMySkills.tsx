import React from 'react'

export const ListMySkills = (props: any) => {
    return (
        <li className="aboutMe-skills__item">
            {
                props.skill
            }
        </li>
    )
}

