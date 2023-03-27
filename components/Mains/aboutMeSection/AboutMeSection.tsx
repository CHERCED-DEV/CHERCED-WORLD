import React from 'react';

import { AboutMeServerDataProps } from '../../../utils/dataConfigWorkflow.interfaces';

const AboutMeDescriptionContainer = React.lazy(() => import('./sections/AboutMeDescriptionContainer'));
const AboutMeCareer = React.lazy(() => import('./sections/AboutMeCareer'));
const AboutMeSkills = React.lazy(() => import('./sections/AboutMeSkills'));
const AboutMeTecnologies = React.lazy(() => import('./sections/AboutMeTecnologies'));
const AboutMeEducation = React.lazy(() => import('./sections/AboutMeEducation'));
const AboutMeIdioms = React.lazy(() => import('./sections/AboutMeIdioms'));


const AboutMeSection: React.FC<AboutMeServerDataProps> = ({ aboutMe }) => {
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

export default AboutMeSection