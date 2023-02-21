import React from 'react'
import { useRouter } from 'next/router';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { ListServicesOffer } from '../../atoms/ListItems/ListServicesOffer';
import { ServicesConfig } from '../../../pages/api/customCMS/interfaces';

export const ServicesSection = () => {

    const { CmsData } = useCmsDataHome();
    const router = useRouter();
    const { portfolio } = CmsData;

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
                        portfolio?.services.map((offer: ServicesConfig, index: number) => (
                            <ListServicesOffer
                                key={index}
                                title={offer.title}
                                img={
                                    {
                                        src: offer.img.src,
                                        alt: offer.img.alt,
                                        loading: offer.img.loading
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
