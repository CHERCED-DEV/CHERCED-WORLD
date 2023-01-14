import React from 'react'

export const ListTecnologies = (props: any) => {
    return (
        <li className="aboutMe-tecnologies">
            <h1 className="aboutMe-tecnologies__title">
                {
                    props.techName
                }
            </h1>
            <img className="aboutMe-tecnologies__img" src={props.src} alt={props.alt} />
            <progress className="aboutMe-tecnologies__img" value={props.value} max="100"></progress>
        </li>
    )
}