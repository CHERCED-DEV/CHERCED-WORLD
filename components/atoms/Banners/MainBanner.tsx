import React from 'react'
import Image from 'next/image'

export const HomeBanner = () => {
  return (
    <section className="homeBanner">
        <div className="homeBanner-text__container">
            <p className="homeBanner-text__parragraph">
                my name is <strong>Camilo</strong>
            </p>
            <h1 className="homeBanner-text__title">
                I’M A DEVELOPER
            </h1>
        </div>
        <div className="homeBanner-img__container">
            <Image
                src="../../../public/assets/icons/separatorWhite.png"
                alt="menu button"
                width={120}
                height={10} 
            />
        </div>
        <nav className="homeBanner-socialMedia">
            <ul className="homeBanner-socialMedia__list">
                <li className="homeBanner-socialMedia__item">
                    <a className="homeBanner-socialMedia__link" href="">
                        <Image
                            src="../../../public/assets/icons/mailito.png"
                            alt="send mail"
                            width={29}
                            height={29} 
                        />                        
                    </a>
                </li>
                <li className="homeBanner-socialMedia__item">
                    <a className="homeBanner-socialMedia__link" href="">
                        <Image
                            src="../../../public/assets/icons/githubCircle.png"
                            alt="github"
                            width={29}
                            height={29} 
                        />
                    </a>
                </li>
                <li className="homeBanner-socialMedia__item">
                    <a className="homeBanner-socialMedia__link" href="">
                        <Image
                            src="../../../public/assets/icons/linkedinCircle.png"
                            alt="linkedIn"
                            width={29}
                            height={29} 
                        />
                    </a>
                </li>
            </ul>
        </nav>
    </section>
  )
}
