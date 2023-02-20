import React from 'react'
import { useRouter } from 'next/router'
import { ProjectsConfig } from '../../../pages/api/projects/database/interfaces'

export const CarruselContainer: React.FC<ProjectsConfig> = (props) => {
    const router = useRouter();

    function goToPage() {
        router.push(`projects/${props.id}`)
    }

    return (
        <li className="portfolio-carrousel__item" >
            <button onClick={goToPage} className="portfolio-carrousel__button">
                <img className="portfolio-carrousel__img"
                    src={props.image.src}
                    alt={props.image.alt}
                    loading={props.image.loading}
                />
            </button>
        </li>
    )
}