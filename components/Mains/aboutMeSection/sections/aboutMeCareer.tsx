import React, { memo } from 'react'
import { AboutMeCareerConfig } from '../../../../pages/api/customCMS/interfaces'
import { ListExperiencie } from '../utils/ListExperiencie'

export const AboutMeCareer: React.FC<{ career: AboutMeCareerConfig }> = memo(({ career }) => {

  return (
    <section className="aboutMe-career">
      <h1 className="aboutMe-career__title" >
        {career?.mainTitle}
      </h1>
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