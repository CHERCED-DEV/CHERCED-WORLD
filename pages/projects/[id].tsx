import React from 'react'
import { useRouter } from 'next/router'
import { fetchProject } from '../../utils/providers/requests/homeCB'
import { ProjectsConfig } from '../api/projects/database/interfaces'
import Image from 'next/legacy/image'

const Proyects = () => {
    const router = useRouter()
    const { id } = router.query
    const [project, setProject] = React.useState<ProjectsConfig>();
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let isMounted = true;
        fetchProject(id).then((project: any) => {
            if (isMounted) {
                setProject(project);
            }
        })
        return () => {
            isMounted = false;
        }
    }, [id]);


    if (!project) {
        return (
            <header>
                <h1 style={{ color: 'red', fontSize: 32 }}>
                    Loading...
                </h1>
            </header>
        )
    } else {
        return (
            <>
                <section className="project-sectionOne">
                    <div className="project-sectionOne__img">
                        {project.image?.src && (
                            <Image
                                src={project.image?.src}
                                alt={project.image?.alt}
                                loading={project.image?.loading}
                            />
                        )}
                    </div>
                </section>
                <section className="project-sectionTwo">
                    <h1 className="project-sectionTwo__title">{project.title}</h1>
                    <p className="project-sectionTwo__parragraph">{project.description}</p>
                    <ul className="project-sectionTwo__list">
                        {
                            project.technologies?.map((technologie: string, index: number) => (
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
}

export default Proyects