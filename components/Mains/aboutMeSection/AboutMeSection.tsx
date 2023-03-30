import {lazy} from 'react';

import { AboutMeClientDataProps } from '../../../utils/dataConfigWorkflow.interfaces';

const AboutMeDescriptionContainer = lazy(() => import('./sections/AboutMeDescriptionContainer'));
const AboutMeCareer = lazy(() => import('./sections/AboutMeCareer'));
const AboutMeSkills = lazy(() => import('./sections/AboutMeSkills'));
const AboutMeTecnologies = lazy(() => import('./sections/AboutMeTecnologies'));
const AboutMeEducation = lazy(() => import('./sections/AboutMeEducation'));
const AboutMeCourses = lazy(()=>import('./sections/AboutMeCourses'))
const AboutMeIdioms = lazy(() => import('./sections/AboutMeIdioms'));


const AboutMeSection: React.FC<AboutMeClientDataProps> = ({ aboutMe }) => {
    return (
        <>
            <AboutMeDescriptionContainer description={aboutMe.description} />
            <AboutMeCareer career={aboutMe.career} />
            <AboutMeSkills skills={aboutMe.skills} />
            <AboutMeTecnologies techList={aboutMe.skills.techList} />
            <AboutMeCourses courses={aboutMe.courses}/>
            <AboutMeEducation education={aboutMe.education} />
            <AboutMeIdioms idioms={aboutMe.idioms} />
        </>
    )
}

export default AboutMeSection