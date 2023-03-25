import Image from 'next/legacy/image'
import React, { memo } from 'react'
import { AboutMeCoursesConfig } from '../../../../pages/api/customCMS/interfaces'
import { ListEducationCourses } from '../utils/ListEducationCourses'

const AboutMeCourses: React.FC<{ courses: AboutMeCoursesConfig }> = memo(({ courses }) => {

  return (
    <section className="aboutMe-courses">
      <h1 className="aboutMe-courses__textFlag" >
        {courses?.mainTitle}
      </h1>
      <ul className="aboutMe-courses__list" >
        {
          courses.certificatedon.map((course, index: number) => (
            <ListEducationCourses
              key={course.schools[index]}
              schools={course.schools}
              descriptions={course.descriptions}
            />
          ))
        }
      </ul>
      <a className="aboutMe-courses__platzi" href={courses?.linkPlatzi.a}>
        <Image
          src={courses?.linkPlatzi.img.src}
          alt={courses?.linkPlatzi.img.alt}
          layout='intrinsic'
          width={128}
          height={128}
        />
        <span>{courses?.linkPlatzi.text}</span>
      </a>
    </section>

  )
})

export default AboutMeCourses