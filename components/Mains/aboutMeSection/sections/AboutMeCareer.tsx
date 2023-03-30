import React, { memo } from 'react'
import { AboutMeCareerConfig } from '../../../../pages/api/customCMS/interfaces'
import { ListExperiencie } from '../utils/ListExperiencie'

const AboutMeCareer: React.FC<{ career: AboutMeCareerConfig }> = memo(function AboutMeCareer({ career }) {
    return (
        <section className="aboutMe-career">
            <h2 className="aboutMe-career__title" >
                {career?.mainTitle}
            </h2>
            <ul className="aboutMe-career__list">
                {
                    career?.proExp.map((proExp, index: number) => (
                        <ListExperiencie
                            key={proExp.expTitleDescription.company[index]}
                            initialDate={proExp.initialDate}
                            endingDate={proExp.endingDate}
                            expTitleDescription={
                                {
                                    expTitle: proExp.expTitleDescription.expTitle,
                                    company: proExp.expTitleDescription.company,
                                    descriptionExp: proExp.expTitleDescription.descriptionExp
                                }
                            }
                        />
                    ))
                }
            </ul>
        </section>
    )
})

export default AboutMeCareer