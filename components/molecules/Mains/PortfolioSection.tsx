import React from 'react';
import { ListServices } from '../../atoms/ListItems/ListServices';
import { ServicesConfig } from '../../../pages/api/customCMS/interfaces';
import { CarruselContainer } from '../../atoms/Carrousel/CarruselContainer';
import { ProjectsConfig } from '../../../pages/api/projects/database/interfaces';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { next, prev } from './portfolioDom/slider';


export const PortfolioSection = () => {

    const [projects, setProjects] = React.useState<ProjectsConfig[]>([])
    const { CmsData } = useCmsDataHome();
    const { portfolio } = CmsData;

    React.useEffect(() => {
        let mounted = true;
        if (mounted) {
            window
                .fetch('/api/projects')
                .then(res => res.json())
                .then(data => {
                    setProjects(data)
                })
        }
        return () => { mounted = false; }
    }, [])

    const handleClickRight = () => {
        next();
    }

    const handleClickLeft = () => {
        prev();
    }

    return (
        <>
            <section className="portfolio-services">
                <ul className="portfolio-services__list">
                    {
                        portfolio?.projects.services.map((service: ServicesConfig, index: number) => (
                            <ListServices
                                key={index}
                                title={service.title}
                                img={
                                    {
                                        src: service.img.src,
                                        alt: service.img.alt,
                                        loading: service.img.loading
                                    }
                                }
                                description={service.description}
                            />
                        ))
                    }
                </ul>
            </section>
            <section className="portfolio-projects">
                <div className="portfolio-projectsContainer">
                    <h1 className="portfolio-projectsContainer__title">{portfolio?.portFolioTitle}</h1>
                </div>
                <ul className="portfolio-carrousel__list" id="slider">
                    {
                        projects?.map((project: ProjectsConfig, index: number) => (
                            <CarruselContainer
                                key={index}
                                id={project.id}
                                description={project.description}
                                image={
                                    {
                                        src: project.image.src,
                                        alt: project.image.alt,
                                        loading: project.image.loading
                                    }
                                }
                            />
                        ))
                    }
                </ul>
                <div className="portfolio-buttonsContainer">
                    <button onClick={handleClickLeft} className="portfolio-buttons__button btn--lf" id="btn-lf">
                        &#60;
                    </button>
                    <button onClick={handleClickRight} className="portfolio-buttons__button btn--rg" id="btn-rg">
                        &#62;
                    </button>
                </div>
                <footer className="portfolio-footer">
                    <h1 className="portfolio-footer__title">
                        {portfolio?.footerPortfolio}
                    </h1>
                </footer>
            </section>
        </>
    )
}