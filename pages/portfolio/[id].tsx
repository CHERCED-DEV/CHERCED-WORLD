import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { fetchProject } from '../../utils/providers/requests/homeCB'
import { ProjectsConfig } from '../api/projects/database/interfaces'
import Image from 'next/image'

const Projects = () => {
    const router = useRouter()
    const { id } = router.query
    const [project, setProject] = React.useState<ProjectsConfig>();

    useEffect(() => {
        let isMounted = true;
        console.log(id)
        fetchProject(id).then((project: any) => {
            if (isMounted) {
                setProject(project);
            }
        })
        return () => {
            isMounted = false;
        }
    }, [id]);

    return (
        <>
            <section className="project-sectionOne">
                <div className="project-sectionOne__img">
                    {project?.image.src && (
                        <Image
                            src={project.image?.src}
                            alt={project.image?.alt}
                            fill={false}
                            width={256}
                            height={256}
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
                            <li className="project-sectionTwo__list" key={index}>{technologie}</li>
                        ))
                    }

                </ul>
                <div>
                    <button>Live</button>
                    <button>GitHub</button>
                </div>
            </section>
        </>
    )
}

export default Projects