import React from 'react';
import { useForm } from 'react-hook-form';
import { ContactMeServerDataProps } from '../../../utils/dataConfigWorkflow.interfaces';
import { ContactMeFieldsInfoConfig } from '../../../pages/api/contactMe/database/interfaceMessage'
import DataBase from '../../../pages/api/contactMe/database/db';


export const ContactMeSection: React.FC<ContactMeServerDataProps> = ({contactMe}) => {

    const { register, handleSubmit, formState: { errors } } = useForm<ContactMeFieldsInfoConfig>();

    const postData = async (contactInfo: ContactMeFieldsInfoConfig) => {
        try {
            const db = new DataBase();
            await db.create(contactInfo);
            const response = await fetch('/api/contactMe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactInfo)
            });
        } catch (error) {
            console.error(error);
        }
    }

    const onSubmit = (data: ContactMeFieldsInfoConfig) => {
        postData(data);
    };

    return (
        <>
            <img
                className="contactMe-background__paralaxx"
                src=""
                alt=""
                loading="lazy"
            />
            <>
                <section className="contactMe-info">
                    <h1 className="contactMe-info__title">{contactMe?.title}</h1>
                    <p className="contactMe-info__description">{contactMe?.description}</p>
                    <img className="contactMe-info__img"
                        src={contactMe?.separator.src}
                        alt={contactMe?.separator.alt}
                        loading={contactMe?.separator.loading}
                    />
                </section>

                <form className="contactMe-form" onSubmit={handleSubmit(onSubmit)}>
                    <input
                        className="contactMe-form__input"
                        type="text"
                        required={contactMe?.fields.name.required}
                        placeholder={contactMe?.fields.name.value}
                        {...register("name")}
                    />
                    <input
                        className="contactMe-form__input"
                        type="text"
                        required={contactMe?.fields.email.required}
                        {...register("email")}
                        placeholder={contactMe?.fields.email.value}
                    />
                    <input
                        className="contactMe-form__input"
                        type="number"
                        required={contactMe?.fields.phone.required}
                        {...register("phone")}
                        placeholder={contactMe?.fields.phone.value}
                    />
                    <textarea
                        className="contactMe-form__input"
                        required={contactMe?.fields.message.required}
                        {...register("message")}
                        placeholder={contactMe?.fields.message.value}
                    />
                    <button className="contactMe-form__submit" type="submit" >{contactMe?.button}</button>
                </form>
            </>
        </>
    );
};