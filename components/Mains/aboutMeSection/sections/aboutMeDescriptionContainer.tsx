import React from 'react'
import Image from 'next/legacy/image';

export const AboutMeDescriptionContainer: React.FC<any> = ({aboutMe}) => {
    return (
        <section className="aboutMe-description">
            <div className="aboutMe-container__parallax">
                <div className="aboutMe-img__parallax">
                    {aboutMe?.parallax.src && (
                        <Image
                            src={aboutMe?.parallax.src}
                            alt={aboutMe?.parallax.alt}
                            loading={aboutMe?.parallax.loading}
                            layout='responsive'
                            width={500}
                            height={627}
                        />
                    )}
                </div>
            </div>
            <div className="aboutMe-description__container">
                <h1 className="aboutMe-description__title">
                    {aboutMe?.titles.mainTitle}
                </h1>
                <p className="aboutMe-description__parragraph">
                    {aboutMe?.descriptions.aboutMe}
                </p>
            </div>
        </section>
    )
}
