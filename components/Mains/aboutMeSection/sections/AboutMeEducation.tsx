import React, { memo } from 'react'
import { AboutMeEducationConfig } from '../../../../pages/api/customCMS/interfaces'
import { ListEducationPro } from '../utils/ListEducationPro'


const AboutMeEducation: React.FC<{ education: AboutMeEducationConfig }> = memo(function AboutMeEducation({ education }) {
    return (
        <section className="aboutMe-education">
            <h2 className="aboutMe-education__title">
                {education.mainTitle}
            </h2>
            <ul className="aboutMe-education__list">
                {
                    education?.titles.map((education, index: number) => (
                        <ListEducationPro
                            key={education.proTitleDegree.proTitle[index]}
                            initialDate={education.initialDate}
                            endingDate={education.endingDate}
                            proTitleDegree={
                                {
                                    proTitle: education.proTitleDegree.proTitle,
                                    strong: education.proTitleDegree.strong
                                }
                            }
                        />
                    ))
                }
            </ul>
        </section>
    )
})

export default AboutMeEducation