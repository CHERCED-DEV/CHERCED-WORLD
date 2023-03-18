import React, { memo } from 'react';
import { AboutMeSkillsConfig } from '../../../../pages/api/customCMS/interfaces';
import { ListMySkills } from '../utils/ListMySkills';

export const AboutMeSkills: React.FC<{ skills: AboutMeSkillsConfig }> = memo(({ skills }) => {
  
  return (
    <section className="aboutMe-skills">
      <h1 className="aboutMe-skills__title">
        {skills?.mainTitle}
      </h1>
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