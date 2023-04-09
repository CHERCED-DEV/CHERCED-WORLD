import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import React from 'react'
import { fetchProject } from '../../utils/providers/requests/homeCB'
import { ProjectsConfig } from '../api/projects/database/interfaces'
import Image from 'next/image'

interface ProjectConfig {
    project: ProjectsConfig;
}

export default function Projects({ project }: ProjectConfig) {

    return (
        <>
            <section className="project-sectionOne">
                <div className="project-sectionOne__img">
                    {project?.image.src && (
                        <Image
                            src={project.image.src}
                            alt={project.image.alt}
                            layout={'intrinsic'}
                            width={parseInt(project.image.width) / 2}
                            height={parseInt(project.image.height) / 2}
                        />
                    )}
                </div>
            </section>
            <section className="project-sectionTwo">
                <h1 className="project-sectionTwo__title">{project?.title}</h1>
                <p className="project-sectionTwo__parragraph">{project?.description}</p>
                <ul className="project-sectionTwo__list">
                    {
                        project?.technologies?.map((technologie: string, index: number) => (
                            <li className="project-sectionTwo__item" key={index}>{technologie}</li>
                        ))
                    }

                </ul>
                <div className='project-sectionTwo__buttons'>
                    {
                        project?.link ? (<button className='project-sectionTwo__button'>Live</button>) : null
                    }
                    {
                        project?.github ? (<button className='project-sectionTwo__button'>GitHub</button>) : null
                    }
                </div>
            </section>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
    const { query } = context;
    const { id } = query;
    if (typeof id !== 'string' || id.trim() === '') {
        return {
            notFound: true
        };
    }
    const project = await fetchProject(id);
    return {
        props: {
            project
        }
    };
};