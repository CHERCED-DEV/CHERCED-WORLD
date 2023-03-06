import React from 'react'
import { ServicesConfig } from '../../../../pages/api/customCMS/interfaces'

export const ListServicesOffer: React.FC<ServicesConfig> = (props) => {
    return (
        <li className='services-offer__item'>
            <div className='services-offer__titleConteiner'>
                <img className='services-offer__img'
                    src={props.img.src}
                    alt={props.img.alt}
                    loading={props.img.loading}
                />
                <h1 className='services-offer__text'>{props.title}</h1>
            </div>
            <p className='services-offer__description'>{props.description}</p>
        </li>
    )
}
