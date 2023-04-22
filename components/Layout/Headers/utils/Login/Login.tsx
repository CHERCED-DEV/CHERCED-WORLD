import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { usePortalProvider } from '../../../../../utils/providers/modalProvider';
import { uiText, KEY } from './logic.Actions';
import Swal from 'sweetalert';
import { useRouter } from 'next/router';

interface credentialsConfig {
    user: string,
    password: string
}

export const Login = () => {
    const router = useRouter()
    const [showModal, setShowModal] = useState(false);
    const { session, setSession, modalSwitch, setModalSwitch } = usePortalProvider();
    const { register, handleSubmit, formState: { errors } } = useForm<credentialsConfig>();

    useEffect(() => {
        if (modalSwitch) {
            setTimeout(() => {
                setShowModal(true);
            }, 100);
        } else {
            setShowModal(false);
        }
    }, [modalSwitch]);

    const loginSeccion = async (data: credentialsConfig) => {
        const transformUser = data.user.toLowerCase().trim()
        const transformPassword = data.password.toLowerCase().trim()
        try {
            if (transformUser === KEY.user || transformPassword === KEY.password) {
                Swal({
                    title: "Post sent!",
                    text: "Thank you for submitting your post, we will review it soon.",
                    icon: "success",
                });
                setSession(!session);
                router.push("/inbox");
                setTimeout(() => {
                    setModalSwitch(!modalSwitch);
                }, 500)
            } else {
                throw new Error("Invalid credentials");
            }
        } catch (error) {
            console.error(error);
            setModalSwitch(!modalSwitch);
            Swal({
                title: "Error",
                text: "There was an error Validating your session. Please try again later.",
                icon: "error",
            });
        }

    }

    return (
        <div className='modalBackground'>
            <section className={showModal ? ("postMe on") : ("postMe off")}>
                <button className='postMe-close' onClick={() => { setModalSwitch(!modalSwitch) }}>X</button>
                <h1 className="postMe-title">LOGIN</h1>
                <form className="postMe-form" onSubmit={handleSubmit(loginSeccion)}>
                    <input
                        className="postMe-form__input"
                        type="text"
                        required={uiText.user.required}
                        {...register("user")}
                        placeholder={uiText.user.text}
                    />
                    <input
                        className="postMe-form__input"
                        type="password"
                        required={uiText.password.required}
                        {...register("password")}
                        placeholder={uiText.password.text}
                    />
                    <button className="postMe-form__submit" type="submit" >{uiText.submit.text}</button>
                </form>
            </section>
        </div>
    )
}
