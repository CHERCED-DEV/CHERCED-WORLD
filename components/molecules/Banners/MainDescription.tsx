import React from 'react'
import { useCmsDataHome } from '../../../providers/cmsDataProvider';


export const MainDescription = () => {
    
    const { CmsData } = useCmsDataHome(); 
    const { mainDescription } = CmsData;

    if (!mainDescription) {
        return (
            <header>
                <h1 style={{ color: 'red', fontSize: 32 }}>
                    Loading...
                </h1>
            </header>
        )
    } else {
        return (
            <section className="mainDescription">
                <button className="mainDescription-brandButton">
                    <img className="mainDescription-brandButton__img" src={mainDescription.brandButton.img.src} alt={mainDescription.brandButton.img.alt} loading={mainDescription.brandButton.img.loading} />
                </button>
                <div className="mainDescription-description">
                    <p className="mainDescription-description__parragraph">
                        {mainDescription.description}
                    </p>
                </div>
                <button className="mainDescription-moreButton">
                    {mainDescription.moreButton}
                </button>
            </section>
        )
    }
}
