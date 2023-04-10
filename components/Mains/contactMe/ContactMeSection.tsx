import React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { ContactMeServerDataProps } from '../../../utils/dataConfigWorkflow.interfaces';
import { ContactMeFieldsInfoConfig } from '../../../pages/api/contactMe/database/interfaceMessage'
import DataBase from '../../../pages/api/contactMe/database/db';
import Swal from 'sweetalert';



const ContactMeSection: React.FC<ContactMeServerDataProps> = ({ contactMe }) => {

    const { register, handleSubmit, formState: { errors } } = useForm<ContactMeFieldsInfoConfig>();

    const resetForm = () => {
        const form = document.querySelector('.contactMe-form') as HTMLFormElement;
        setTimeout(() => {
            form.reset();
        }, 1000);
    };

    const postData = async (contactInfo: ContactMeFieldsInfoConfig) => {
        try {
            const db = new DataBase();
            await db.create(contactInfo);
            const response = await fetch('/api/contactMe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactInfo)
            });
            Swal({
                title: "Sent!",
                text: "Thank you for contacting us, we will get in touch with you soon.",
                icon: "success",
            });
        } catch (error) {
            console.error(error);
            Swal({
                title: "Error",
                text: "There was an error sending your message. Please try again later.",
                icon: "error",
            });
        }
    };

    const onSubmit = (data: ContactMeFieldsInfoConfig) => {
        postData(data);
        resetForm();
    };

    return (
        <>
            <section className="contactMe-info">
                <h1 className="contactMe-info__title">{contactMe?.title}</h1>
                <p className="contactMe-info__description">{contactMe?.description}</p>
                <div className="contactMe-info__img">
                    {contactMe?.separator.src && (
                        <Image
                            src={contactMe?.separator.src}
                            alt={contactMe?.separator.alt}
                            fill={false}
                            width={120}
                            height={10}
                        />
                    )}
                </div>
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
    );
};

export default ContactMeSection;