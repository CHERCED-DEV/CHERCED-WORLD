import React from 'react';
import { ListServices } from '../../atoms/ListItems/ListServices';
import { ServicesConfig } from '../../../pages/api/customCMS/interfaces';
import { CarruselContainer } from '../../atoms/Carrousel/CarruselContainer';
import { ProjectsConfig } from '../../../pages/api/projects/database/interfaces';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { next, prev } from './portfolioDom/slider'


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
    if (!portfolio) {
        return (
            <header>
                <h1 style={{ color: 'red', fontSize: 32 }}>
                    Loading...
                </h1>
            </header>
        )
    } else {
        return (
            <section className="portfolio">
                <ul className="portfolio-services" >
                    {
                        portfolio.services.map((service: ServicesConfig, index: number) => (
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
                <div className="portfolio-titleContainer">
                    <h1 className="portfolio-titleContainer__title">{portfolio.portFolioTitle}</h1>
                </div>
                <ul className="portfolio-carrousel__list">
                    {
                        projects.map((project: ProjectsConfig, index: number) => (
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
                <div className="portfolio-footer">
                    <h1 className="portfolio-footer__title">
                        {portfolio.footerPortfolio}
                    </h1>
                </div>
            </section>
        )
    }
}