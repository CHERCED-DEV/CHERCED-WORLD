import React, { memo } from 'react'
import { AboutMeIdiomsConfig } from '../../../../pages/api/customCMS/interfaces'
import { ListIdioms } from '../utils/ListIdioms'


const AboutMeIdioms: React.FC<{ idioms: AboutMeIdiomsConfig }> = memo(function AboutMeIdioms({ idioms }) {
    return (
        <section className="aboutMe-idioms">
            <h3 className="aboutMe-idioms__mainTitle">Idioms</h3>
            <ul className="aboutMe-idioms__list">
                {
                    idioms?.lenguages.map((idiom) => (
                        <ListIdioms
                            key={idiom.idiom}
                            idiom={idiom.idiom}
                            progress={idiom.progress}
                            img={
                                {
                                    src: idiom.img.src,
                                    alt: idiom.img.alt,
                                }
                            }
                        />
                    ))
                }
            </ul>
        </section>
    )
})

export default AboutMeIdioms