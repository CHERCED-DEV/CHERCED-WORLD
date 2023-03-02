import React from 'react'
import { useForm } from 'react-hook-form';
import { SendPostConfig } from '../../../pages/api/blog/blogData/blog.interface';  

export const FormSendPost = () => {

    const { register, handleSubmit, formState: { errors } } = useForm<>();

    const postData = async (contactInfo: SendPostConfig) => {
        try {
            const db = new DataBase();
            await db.create(contactInfo);
            const response = await fetch('/api/contactMe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactInfo)
            });
            const data = await response.json();
        } catch (error) {
            console.error(error);
        }
    }

    const onSubmit = (data: SendPostConfig) => {
        postData(data);
    };

  return (
    <section>
            <form className="contactMe-form" onSubmit={handleSubmit(onSubmit)}>
                    <input
                        className="contactMe-form__input"
                        type="text"
                        required={props?.fields.message.required}
                        {...register("message")}
                        placeholder={props?.fields.message.value}
                    />
                    <button className="contactMe-form__submit" type="submit" >{props?.button}</button>
                </form>
            </section>
  )
}
