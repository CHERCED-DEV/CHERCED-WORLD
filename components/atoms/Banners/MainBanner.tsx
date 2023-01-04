import React from 'react'
import Image from 'next/image'

export const MainBanner = () => {
  return (
    <section className="mainBanner">
        <div className="mainBanner-text__container">
            <p className="mainBanner-text__parragraph">
                my name is <strong>Camilo</strong>
            </p>
            <h1 className="mainBanner-text__title">
                I’M A DEVELOPER
            </h1>
        </div>
        <div className="mainBanner-img__container">
            <Image
                src="../../../public/assets/icons/separatorWhite.png"
                alt="menu button"
                width={120}
                height={10} 
            />
        </div>
        <nav className="mainBanner-socialMedia">
            <ul className="mainBanner-socialMedia__list">
                <li className="mainBanner-socialMedia__item">
                    <a className="mainBanner-socialMedia__link" href="">
                        <Image
                            src="../../../public/assets/icons/mailito.png"
                            alt="send mail"
                            width={29}
                            height={29} 
                        />                        
                    </a>
                </li>
                <li className="mainBanner-socialMedia__item">
                    <a className="mainBanner-socialMedia__link" href="">
                        <Image
                            src="../../../public/assets/icons/githubCircle.png"
                            alt="github"
                            width={29}
                            height={29} 
                        />
                    </a>
                </li>
                <li className="mainBanner-socialMedia__item">
                    <a className="mainBanner-socialMedia__link" href="">
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
