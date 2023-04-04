import React from 'react'
import { useRouter } from 'next/router';
import { PortfolioServicesServerDataProps } from '../../../utils/dataConfigWorkflow.interfaces';
import { ServicesConfig } from '../../../pages/api/customCMS/interfaces';
import { ListServicesOffer } from './utils/ListServicesOffer';



export const ServicesWCFUSection: React.FC<PortfolioServicesServerDataProps> = ({portfolio}) => {

    const router = useRouter();

    const handleOnClick = () => {
        router.push("portfolio");
    }

    return (
        <>
            <section className='services-wcfu'>
                <h1 className='services-wcfu__title'>{portfolio?.wcfu.title}</h1>
                <p className='services-wcfu__parragraph' >{portfolio?.wcfu.description}</p>
                <button className='services-wcfu__button' onClick={handleOnClick} >{portfolio?.wcfu.explore.text}</button>
            </section>
            <section className='services-offer'>
                <ul className='services-offer__list'>
                    {
                        portfolio?.services.map((offer: ServicesConfig) => (
                            <ListServicesOffer
                                key={offer.title}
                                title={offer.title}
                                img={
                                    {
                                        src: offer.img.src,
                                        alt: offer.img.alt,
                                    }
                                }
                                description={offer.description}
                            />
                        ))
                    }
                </ul>
            </section>
        </>
    )
}