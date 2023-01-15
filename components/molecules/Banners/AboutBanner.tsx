import React from 'react'
import { ProExpConfig, techListConfig, CoursesConfig, IdiomsConfig } from '../../../pages/api/customCMS/interfaces';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { ListExperiencie } from '../../../components/atoms/ListItems/ListExperiencie';
import { ListMySkills } from '../../atoms/ListItems/ListMySkills';
import { ListTecnologies } from '../../atoms/ListItems/ListTecnologies';
import { ListEducationPro } from '../../atoms/ListItems/ListEducationPro';
import { EducationConfig } from "../../../pages/api/customCMS/interfaces";
import { ListEducationCourses } from '../../atoms/ListItems/ListEducationCourses';
import { ListIdioms } from '../../atoms/ListItems/ListIdioms';

export const AboutBanner = () => {
    const { CmsData } = useCmsDataHome();
    const { aboutMe } = CmsData

    if (!aboutMe) {
        return (
            <header>
                <h1 style={{ color: 'red', fontSize: 32 }}>
                    Loading...
                </h1>
            </header>
        )
    } else {
        return (
            <div className="aboutMe">
                <section className="aboutMe-description">
                    <h1 className="aboutMe-description__title">
                        {aboutMe.titles.mainTitle}
                    </h1>
                    <p className="aboutMe-description__parragraph">
                        {aboutMe.descriptions.aboutMe}
                    </p>
                </section>
                <section className="aboutMe-career">
                    <h1 className="aboutMe-career__title" >
                        {aboutMe.titles.career}
                    </h1>
                    <ul className="aboutMe-career__list">
                        {
                            aboutMe.proExp.map((proExp: ProExpConfig, index: number) => (
                                <ListExperiencie
                                    key={index}
                                    initialDate={proExp.initialDate}
                                    endingDate={proExp.endingDate}
                                    expTitleDescription= {
                                        {   expTitle: proExp.expTitleDescription.expTitle, 
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
                        {aboutMe.titles.skills}
                    </h1>
                    <p className="aboutMe-skills__parragraph">
                        { aboutMe.descriptions.skills }
                    </p>
                    <ul className="aboutMe-skills__list">
                        {
                            aboutMe.skills.map((skill: string, index: number) => (
                                <ListMySkills
                                    key={index}
                                    skill={skill}
                                />
                            ))
                        }
                    </ul>
                </section>
                <section className="aboutMe-tecnologies">
                    <ul className="aboutMe-tecnologies__list">
                        {
                            aboutMe.techList.map((techList: techListConfig, index: number) => (
                                <ListTecnologies
                                    key={index}
                                    techName={techList.techName}
                                    img={
                                        {
                                            src: techList.img.src,
                                            alt: techList.img.alt,
                                            loading: techList.img.loading,
                                        }
                                    }
                                    progress={techList.progress}
                                />   
                            ))
                        }
                    </ul>
                </section>
                <section className="aboutMe-education">
                    <h1 className="aboutMe-education__title">
                        {aboutMe.titles.education}
                    </h1>
                    <ul className="aboutMe-education__list">
                        {
                            aboutMe.education.map(( education: EducationConfig, index: number)=>(
                                <ListEducationPro
                                    key={index}
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
                <ul className="aboutMe-courses__list" >
                        <h1 className="aboutMe-courses__textFlag" >
                            {aboutMe.titles.courses}
                        </h1>
                        {
                            aboutMe.courses.map((course: CoursesConfig, index: number)=>(
                                <ListEducationCourses
                                    key={index}
                                    schools={course.schools}
                                    descriptions={course.descriptions}
                                />
                            ))
                        }
                    </ul>
                <a href={aboutMe.linkPlatzi}>
                    My Profile On Platzi
                </a>
                </section>
                <section className="aboutMe-Idioms">
                    <ul className="aboutMe-Idioms__list">
                        {
                            aboutMe.idioms.map((idiom: IdiomsConfig, index: number)=>(
                                <ListIdioms
                                    key={index}
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
            </div>
        )
    }


}
