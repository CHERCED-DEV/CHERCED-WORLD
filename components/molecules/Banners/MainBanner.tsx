import React from 'react'
import { ImageProps } from '../../../pages/api/customCMS/interfaces';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { ListContacMedia } from '../../atoms/ListItems/ListContacMedia';

export const HomeBanner: React.FC = () => {

    const { CmsData } = useCmsDataHome();
    const { homeBanner } = CmsData;

    if (!homeBanner) {
        return (
            <header>
                <h1 style={{ color: 'red', fontSize: 32 }}>
                    Loading...
                </h1>
            </header>
        )
    } else {
        return (
            <section className="homeBanner">
                <div className="homeBanner-text__container">
                    <p className="homeBanner-text__parragraph">
                        {homeBanner.homeBannerTitles.textParragraph}<strong>{homeBanner.homeBannerTitles.textStrong}</strong>
                    </p>
                    <h1 className="homeBanner-text__title">
                        {homeBanner.homeBannerTitles.mainTitle}
                    </h1>
                </div>
                <div className="homeBanner-img__container">
                    <img
                        src={homeBanner.separator.src}
                        alt={homeBanner.separator.alt}
                        loading={homeBanner.separator.loading}
                    />
                </div>
                <nav className="homeBanner-socialMedia">
                    <ul className="homeBanner-socialMedia__list">
                        {
                            homeBanner.homeSocialMedia.map((homeSocialMedia: ImageProps, index: number) => (
                                <ListContacMedia
                                    key={index}
                                    src={homeSocialMedia.src}
                                    alt={homeSocialMedia.alt}
                                    loading={homeSocialMedia.loading}
                                    a={homeSocialMedia.a}
                                />
                            ))
                        }
                    </ul>
                </nav>
            </section>
        )
    }
}
