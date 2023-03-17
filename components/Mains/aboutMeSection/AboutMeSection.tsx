import React, { useState } from 'react';

import { AboutMeServerDataProps } from '../../../utils/dataConfigWorkflow.interfaces';
import { ProExpConfig, techListConfig, CoursesConfig, IdiomsConfig, EducationConfig } from '../../../pages/api/customCMS/interfaces';
import { ListExperiencie } from './utils/ListExperiencie';
import { ListMySkills } from './utils/ListMySkills';
import { ListTecnologies } from './utils/ListTecnologies';
import { ListEducationPro } from './utils/ListEducationPro';
import { ListEducationCourses } from './utils/ListEducationCourses';
import { ListIdioms } from './utils/ListIdioms';
import { AboutMeDescriptionContainer } from './sections/aboutMeDescriptionContainer';


export const AboutMeSection: React.FC<AboutMeServerDataProps> = ({ aboutMe }) => {

    const [showHidden, setShowHidden] = useState(false);

    function toggleShowHidden() {
        setShowHidden(!showHidden);
    }

    return (       
        <>
            <AboutMeDescriptionContainer aboutMe={aboutMe}/>
            <section className="aboutMe-career">
                
                <h1 className="aboutMe-career__title" >
                    {aboutMe?.titles.career}
                </h1>
                <ul className="aboutMe-career__list">
                    {
                        aboutMe?.proExp.map((proExp: ProExpConfig, index: number) => (
                            <ListExperiencie
                                key={index}
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
            <section className="aboutMe-skills">
                <h1 className="aboutMe-skills__title">
                    {aboutMe?.titles.skills}
                </h1>
                <p className="aboutMe-skills__parragraph">
                    {aboutMe?.descriptions.skills}
                </p>
                <ul className="aboutMe-skills__list">
                    {
                        aboutMe?.skills.map((skill: string) => (
                            <ListMySkills
                                key={skill}
                                skill={skill}
                            />
                        ))
                    }
                </ul>
            </section>
            <section className="aboutMe-tecnologies">
                <ul className="aboutMe-tecnologies__list">
                    {aboutMe?.techList.map((techList: techListConfig, index: number) => {
                        const hidden = index >= 4 && !showHidden;
                        return (
                            <ListTecnologies
                                key={techList.techName}
                                hidden={hidden}
                                techName={techList.techName}
                                img={{
                                    src: techList.img.src,
                                    alt: techList.img.alt,
                                    loading: techList.img.loading,
                                }}
                                progress={techList.progress}
                            />
                        );
                    })}
                </ul>
                {aboutMe?.techList.length > 4 && (
                    <button className={ showHidden ?  "aboutMe-tecnologies__show-more off" : "aboutMe-tecnologies__show-more" }  onClick={toggleShowHidden}>
                        {showHidden ? 'Show less' : 'Show more!'}
                    </button>
                )}
            </section>
            <section className="aboutMe-education">
                <h1 className="aboutMe-education__title">
                    {aboutMe?.titles.education}
                </h1>
                <ul className="aboutMe-education__list">
                    {
                        aboutMe?.education.map((education: EducationConfig) => (
                            <ListEducationPro
                                key={education.proTitleDegree.proTitle}
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
            <section className="aboutMe-courses">
                <h1 className="aboutMe-courses__textFlag" >
                    {aboutMe?.titles.courses}
                </h1>
                <ul className="aboutMe-courses__list" >
                    {
                        aboutMe?.courses.map((course: CoursesConfig, index: number) => (
                            <ListEducationCourses
                                key={course.schools[index]}
                                schools={course.schools}
                                descriptions={course.descriptions}
                            />
                        ))
                    }
                </ul>
                <a className="aboutMe-courses__platzi" href={aboutMe?.linkPlatzi.a}>
                   <Image
                        src={aboutMe?.linkPlatzi.img.src}
                        alt={aboutMe?.linkPlatzi.img.alt}
                        layout='intrinsic'
                        width={128}
                        height={128}
                   />
                   <span>{aboutMe?.linkPlatzi.text}</span>
                </a>
            </section>
            <section className="aboutMe-idioms">
                <h1 className="aboutMe-idioms__mainTitle">Idioms</h1>
                <ul className="aboutMe-idioms__list">
                    {
                        aboutMe?.idioms.map((idiom: IdiomsConfig) => (
                            <ListIdioms
                                key={idiom.idiom}
                                idiom={idiom.idiom}
                                progress={idiom.progress}
                                img={
                                    {
                                        src: idiom.img.src,
                                        alt: idiom.img.alt,
                                        loading: idiom.img.loading
                                    }
                                }
                            />
                        ))
                    }
                </ul>
            </section>
        </>
    )
}