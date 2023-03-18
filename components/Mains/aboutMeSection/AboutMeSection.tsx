import React from 'react';

import { AboutMeServerDataProps } from '../../../utils/dataConfigWorkflow.interfaces';
import { AboutMeDescriptionContainer } from './sections/AboutMeDescriptionContainer';
import { AboutMeCareer } from './sections/AboutMeCareer';
import { AboutMeSkills } from './sections/AboutMeSkills';
import { AboutMeTecnologies } from './sections/AboutMeTecnologies';
import { AboutMeEducation } from './sections/AboutMeEducation';
import { AboutMeIdioms } from './sections/aboutMeIdioms';

export const AboutMeSection: React.FC<AboutMeServerDataProps> = ({ aboutMe }) => {

    return (
        <>
            <AboutMeDescriptionContainer description={aboutMe.description} />
            <AboutMeCareer career={aboutMe.career} />
            <AboutMeSkills skills={aboutMe.skills} />
            <AboutMeTecnologies techList={aboutMe.skills.techList} />
            <AboutMeEducation education={aboutMe.education} />
            <AboutMeIdioms idioms={aboutMe.idioms} />
        </>
    )
}