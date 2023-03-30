import React, { memo } from 'react';
import { AboutMeSkillsConfig } from '../../../../pages/api/customCMS/interfaces';
import { ListMySkills } from '../utils/ListMySkills';

const AboutMeSkills: React.FC<{ skills: AboutMeSkillsConfig }> = memo(function AboutMeSkills({ skills }) {
    return (
        <section className="aboutMe-skills">
            <h3 className="aboutMe-skills__title">
                {skills?.mainTitle}
            </h3>
            <p className="aboutMe-skills__parragraph">
                {skills?.description}
            </p>
            <ul className="aboutMe-skills__list">
                {
                    skills?.bullets.map((skill) => (
                        <ListMySkills
                            key={skill}
                            skill={skill}
                        />
                    ))
                }
            </ul>
        </section>
    );
});

export default AboutMeSkills