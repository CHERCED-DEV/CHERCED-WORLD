import React from 'react';
import { useCmsDataHome } from '../../../providers/cmsDataProvider';
import { useForm, UseFormRegisterReturn } from 'react-hook-form';
import { ContactMeFieldsConfig, ContactMeConfig } from '../../../pages/api/customCMS/interfaces';

export const ContactMeSection: React.FC = () => {

    const { CmsData } = useCmsDataHome();
    const { contactMe } = CmsData

    const { register, handleSubmit } = useForm<ContactMeFieldsConfig>();

    const onSubmit = (data: ContactMeFieldsConfig) => {
        console.log(data);
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
                        {contactMe.fields.errors.name && <p>This field is required</p>}
                    <input
                        className="contactMe-form__input"
                        type="text"
                        required={contactMe.fields.email.required}
                        {...register("email")}
                        placeholder={contactMe.fields.email.value}
                    />
                        {contactMe.fields.errors.email && <p>This field is required</p>}
                    <input
                        className="contactMe-form__input"
                        type="number"
                        required={contactMe.fields.phone.required}
                        {...register("phone")}
                        placeholder={contactMe.fields.phone.value}
                    />
                        {contactMe.fields.errors.phone && <p>This field is required</p>}
                    <input
                        className="contactMe-form__input"
                        type="text"
                        {...register("message")}
                        placeholder={contactMe.fields.message.value}
                    />
                        {contactMe.fields.errors.message && <p>This field is required</p>}
                    <input className="contactMe-form__submit" type="submit" />
                </form>
            </section>
        </>
    );
};
};
