import React from 'react';
import { PortfolioServicesServerDataProps } from '../../../utils/dataConfigWorkflow.interfaces';
import { CarruselContainer } from './utils/CarruselContainer';
import { ProjectsConfig } from '../../../pages/api/projects/database/interfaces';
import { next, prev } from './portfolioDom/slider';


export const PortfolioSection: React.FC<PortfolioServicesServerDataProps> = ({ portfolio }) => {

    const [projects, setProjects] = React.useState<ProjectsConfig[]>([])

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
                <h1 className="portfolio-services__title">{portfolio.projects.title}</h1>
                <p className="portfolio-services__description">{portfolio.projects.description.one}</p>
                <p className="portfolio-services__description">{portfolio.projects.description.two}</p>
                <p className="portfolio-services__description">{portfolio.projects.description.three}</p>
            </section>
            <section className="portfolio-projects">
                <div className="portfolio-projectsContainer">
                    <h1 className="portfolio-projectsContainer__title">{portfolio?.portFolioTitle}</h1>
                </div>
                <nav className="portfolio-carrousel__silder">
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
                </nav>
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