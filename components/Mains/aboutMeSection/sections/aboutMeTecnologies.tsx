import React, { memo, useCallback, useState } from 'react';
import { TechListConfig } from '../../../../pages/api/customCMS/interfaces';
import { ListTecnologies } from '../utils/ListTecnologies';


export const AboutMeTecnologies: React.FC<{ techList: TechListConfig[] }> = memo(({ techList }) => {

  const [showHidden, setShowHidden] = useState(false);

  const toggleShowHidden = useCallback(() => {
    setShowHidden(!showHidden);
  }, [showHidden]);


  return (
    <section className="aboutMe-tecnologies">
      <ul className="aboutMe-tecnologies__list">
        {techList?.map((techList, index: number) => {
          const hidden = index >= 4 && !showHidden;
          return (
            <ListTecnologies
              key={techList.techName}
              hidden={hidden}
              techName={techList.techName}
              img={{
                src: techList.img.src,
                alt: techList.img.alt,
                loading: techList.img.loading,
              }}
              progress={techList.progress}
            />
          );
        })}
      </ul>
      {techList?.length > 4 && (
        <button className={showHidden ? "aboutMe-tecnologies__show-more off" : "aboutMe-tecnologies__show-more"} onClick={toggleShowHidden}>
          {showHidden ? 'Show less' : 'Show more!'}
        </button>
      )}
    </section>
  )
})