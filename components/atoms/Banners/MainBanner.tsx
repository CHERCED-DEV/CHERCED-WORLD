import React from 'react'
import { useCmsDataHome } from '../../../providers/cmsDataProvider';

export const HomeBanner = () => {
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
                    <img src={homeBanner.separator.src} alt={homeBanner.separator.alt} loading={homeBanner.separator.loading} />
                </div>
                <nav className="homeBanner-socialMedia">
                    <ul className="homeBanner-socialMedia__list">
                        <li className="homeBanner-socialMedia__item">
                            <a className="homeBanner-socialMedia__link" href="">
                                <img src={homeBanner.homeSocialMedia.github.src} alt={homeBanner.homeSocialMedia.github.alt} loading={homeBanner.homeSocialMedia.github.loading} />
                            </a>
                        </li>
                        <li className="homeBanner-socialMedia__item">
                            <a className="homeBanner-socialMedia__link" href="">
                                <img src={homeBanner.homeSocialMedia.linkedin.src} alt={homeBanner.homeSocialMedia.linkedin.alt} loading={homeBanner.homeSocialMedia.linkedin.loading} />
                            </a>
                        </li>
                        <li className="homeBanner-socialMedia__item">
                            <a className="homeBanner-socialMedia__link" href="">
                                <img src={homeBanner.homeSocialMedia.mailito.src} alt={homeBanner.homeSocialMedia.mailito.alt} loading={homeBanner.homeSocialMedia.mailito.loading} />
                            </a>
                        </li>
                    </ul>
                </nav>
            </section>
        )

    }


}
