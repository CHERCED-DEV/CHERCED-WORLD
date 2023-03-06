import React from 'react';
import { useCmsDataHome } from '../../../utils/providers/cmsDataProvider';

export const MainDescription: React.FC = () => {

    const { CmsData } = useCmsDataHome();
    const { mainDescription } = CmsData;

    return (
        <section className="mainDescription">
            <button className="mainDescription-brandButton">
                <img className="mainDescription-brandButton__img"
                    src={mainDescription?.brandButton.img.src}
                    alt={mainDescription?.brandButton.img.alt}
                    loading={mainDescription?.brandButton.img.loading}
                />
            </button>
            <div className="mainDescription-description">
                <p className="mainDescription-description__parragraph">
                    {mainDescription?.description}
                </p>
            </div>
            <button className="mainDescription-moreButton">
                {mainDescription?.moreButton}
            </button>
        </section>
    )
}