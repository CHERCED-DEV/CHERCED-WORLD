import React from 'react';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { useForm, UseFormRegisterReturn } from 'react-hook-form';
import { ContactMeFieldsInfoConfig } from '../../../pages/api/contactMe/database/interfaceMessage'
import DataBase from '../../../pages/api/contactMe/database/db';

export const ContactMeSection: React.FC = () => {

    const { CmsData } = useCmsDataHome();
    const { contactMe } = CmsData

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
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error(error);
        }
    }



    const onSubmit = (data: ContactMeFieldsInfoConfig) => {
        postData(data);
    };

    if (!contactMe) {
        return (
            <header>
                <h1 style={{ color: 'red', fontSize: 32 }}>
                    Loading...
                </h1>
            </header>
        )
    } else {
        return (
            <>
                <img
                    className="contactMe-background__paralaxx"
                    src=""
                    alt=""
                    loading="lazy"
                />
                <section className="contactMe">
                    <h1 className="contactMe-title"></h1>
                    <p className="contactMe-description"></p>
                    <img
                        className="contactMe-img"
                        src=""
                        alt=""
                        loading="lazy"
                    />
                    <form className="contactMe-form" onSubmit={handleSubmit(onSubmit)}>
                        <input
                            className="contactMe-form__input"
                            type="text"
                            required={contactMe.fields.name.required}
                            placeholder={contactMe.fields.name.value}
                            {...register("name")}
                        />
                        <input
                            className="contactMe-form__input"
                            type="text"
                            required={contactMe.fields.email.required}
                            {...register("email")}
                            placeholder={contactMe.fields.email.value}
                        />
                        <input
                            className="contactMe-form__input"
                            type="number"
                            required={contactMe.fields.phone.required}
                            {...register("phone")}
                            placeholder={contactMe.fields.phone.value}
                        />
                        <input
                            className="contactMe-form__input"
                            type="text"
                            required={contactMe.fields.message.required}
                            {...register("message")}
                            placeholder={contactMe.fields.message.value}
                        />
                        <input className="contactMe-form__submit" type="submit" />
                    </form>
                </section>
            </>
        );
    };
};
