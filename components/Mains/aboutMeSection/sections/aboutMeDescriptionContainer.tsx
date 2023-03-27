import React, { memo } from 'react';
import Image from 'next/legacy/image';
import { AboutMeDescriptionConfig } from '../../../../pages/api/customCMS/interfaces';

const AboutMeDescriptionContainer: React.FC<{ description: AboutMeDescriptionConfig }> = memo(function AboutMeDescriptionContainer({ description }) {
    return (
        <section className="aboutMe-description">
            <div className="aboutMe-container__parallax">
                <div className="aboutMe-img__parallax">
                    {description?.parallax.src && (
                        <Image
                            src={description?.parallax.src}
                            alt={description?.parallax.alt}
                            priority={true}
                            layout='responsive'
                            width={500}
                            height={627}
                        />
                    )}
                </div>
            </div>
            <div className="aboutMe-description__container">
                <h1 className="aboutMe-description__title">
                    {description?.mainTitle}
                </h1>
                <p className="aboutMe-description__parragraph">
                    {description?.description}
                </p>
            </div>
        </section>
    )
})

export default AboutMeDescriptionContainer