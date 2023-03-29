import dynamic from 'next/dynamic';
import {lazy} from 'react';

import { AboutMeServerDataProps } from '../../../utils/dataConfigWorkflow.interfaces';

const AboutMeDescriptionContainer = dynamic(() => import('./sections/AboutMeDescriptionContainer'));
const AboutMeCareer = lazy(() => import('./sections/AboutMeCareer'));
const AboutMeSkills = lazy(() => import('./sections/AboutMeSkills'));
const AboutMeTecnologies = lazy(() => import('./sections/AboutMeTecnologies'));
const AboutMeEducation = lazy(() => import('./sections/AboutMeEducation'));
const AboutMeIdioms = lazy(() => import('./sections/AboutMeIdioms'));


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