import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ImageProps } from '../../../../pages/api/customCMS/interfaces';
import { HomeClientDataProps } from '../../../../utils/dataConfigWorkflow.interfaces';
import { ListContacMedia } from './utils/ListContacMedia';


const GlitteringSea = dynamic(() => import('./utils/glitteringSea/GlitteringSea'));

const HomeBanner: React.FC<HomeClientDataProps> = memo(function HomeBanner({ homeBanner }) {

    return (
        <>
            <GlitteringSea />
            <section className="homeBanner">
                <div className="homeBanner-text__container">
                    <p className="homeBanner-text__parragraph">
                        {homeBanner?.homeBannerTitles.textParragraph}
                        <strong>{homeBanner?.homeBannerTitles.textStrong}</strong>
                    </p>
                    <h1 className="homeBanner-text__title">{homeBanner?.homeBannerTitles.mainTitle}</h1>
                </div>
                <div className="homeBanner-img__container">
                    {homeBanner?.separator?.src && (
                        <Image
                            src={homeBanner?.separator.src}
                            alt={homeBanner?.separator.alt}
                            loading={homeBanner?.separator.loading}
                            fill={false}
                            width={120}
                            height={10}
                        />
                    )}
                </div>
                <nav className="homeBanner-socialMedia">
                    <ul className="homeBanner-socialMedia__list">
                        {homeBanner?.homeSocialMedia.map((homeSocialMedia: ImageProps) => (
                            <ListContacMedia
                                key={homeSocialMedia.a}
                                src={homeSocialMedia.src}
                                alt={homeSocialMedia.alt}
                                loading={homeSocialMedia.loading}
                                a={homeSocialMedia.a}
                            />
                        ))}
                    </ul>
                </nav>
            </section>
        </>
    );
});

export default HomeBanner