import React from 'react';
import { useRouter } from 'next/router';
import { ProjectsConfig } from '../../../../pages/api/projects/database/interfaces';
import Image from 'next/legacy/image';

export const CarruselContainer: React.FC<ProjectsConfig> = (props) => {
    const router = useRouter();

    function goToPage() {
        router.push(`portfolio/${props.id}`)
    }

    return (
        <li className="portfolio-carrousel__item" >
            <button onClick={goToPage} className="portfolio-carrousel__button">
                <div className="portfolio-carrousel__img">
                    {
                        props?.image.src && (
                            <Image
                                src={props.image.src}
                                alt={props.image.alt}
                                layout={'intrinsic'}
                                width={parseInt(props.image.width)/2}
                                height={parseInt(props.image.height)/2}
                            />
                        )
                    }
                </div>
            </button>
        </li>
    )
}