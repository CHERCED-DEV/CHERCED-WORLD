import React from 'react'
import { ServicesConfig } from '../../../pages/api/customCMS/interfaces'

export const ListServices: React.FC<ServicesConfig> = (props) => {
  return (
    <li className="portfolio-services__container" >
        <h1 className="portfolio-services__title" >{props.title}</h1>
        <img className="portfolio-services__img"   
            src={props.img.src} 
            alt={props.img.alt}
            loading={props.img.loading} 
        />
        <p className="portfolio-services__parragraph" >{props.description}</p>
    </li>
  )
}
