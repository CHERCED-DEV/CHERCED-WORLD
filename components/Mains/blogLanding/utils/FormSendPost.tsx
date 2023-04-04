import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { CommentsConfig } from '../../../../pages/api/blog/posts/database/post.interface';
import { BlogCms } from '../../../../pages/api/blog/blogData/database/blog.cms';
import DataBase from '../../../../pages/api/blog/posts/database/post.methods';
import { usePortalProvider } from '../../../../utils/providers/modalProvider';


export const FormSendPost: React.FC = () => {

    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const { modalSwitch, setModalSwitch } = usePortalProvider()
    const { register, handleSubmit, formState: { errors } } = useForm<CommentsConfig>();
    

    const { sendPost } = BlogCms;

    useEffect(() => {
        if (modalSwitch) {
            setTimeout(() => {
                setShowModal(true);
            }, 100); 
        } else {
            setTimeout(() => {
                setShowModal(false);
            }, 100); 
        }
    }, [modalSwitch]);

    const postData = async (contactInfo: CommentsConfig) => {
        const id = router.asPath.split("/").pop()?.toString() || "default";
        try {
            // isValid?
            if (!contactInfo.userName || !contactInfo.comment || !contactInfo.date) {
                throw new Error("Por favor complete todos los campos");
            }

            const db = new DataBase();

            // Fetch Data
            await db.create(contactInfo, id);

            const apiEndpoint = "/api/blog/posts";
            const headers = { "Content-Type": "application/json" };
            const body = JSON.stringify(contactInfo);

            // API fetching
            const response = await fetch(apiEndpoint, { method: "POST", headers, body });
            const data = await response.json();

            if (!response.ok) {
                throw new Error("Ha ocurrido un error al enviar su comentario. Por favor intente de nuevo más tarde.");
            }

        } catch (error) {
            if (error instanceof SyntaxError) {
                console.error("Error de análisis JSON:", error);
            } else {
                console.error("Error al enviar comentario:", error);
            }
        }
    };

    const onSubmit = (data: CommentsConfig) => {
        const idLength = 8;
        const idCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
        let id = "";

        for (let i = 0; i < idLength; i++) {
            const randomIndex = Math.floor(Math.random() * idCharacters.length);
            id += idCharacters[randomIndex];
        }

        const postId = router.asPath.split("/").pop()?.toString() || "default";
        const date = new Date().toISOString();

        const newData = {
            ...data,
            id: id,
            postId: postId,
            date: date
        };

        postData(newData);
    };

    

  

    return (
        <div className='modalBackground'>
            <section className={showModal ? ("postMe on") : ("postMe off")}>
                <button className='postMe-close' onClick={() => { setModalSwitch(!modalSwitch) }}>X</button>
                <h1 className="postMe-title">{sendPost.title}</h1>
                <form className="postMe-form" onSubmit={handleSubmit(onSubmit)}>
                    <input
                        className="postMe-form__input"
                        type="text"
                        required={sendPost?.fields.email.required}
                        {...register("email")}
                        placeholder={sendPost?.fields.email.value}
                    />
                    <input
                        className="postMe-form__input"
                        type="text"
                        required={sendPost?.fields.name.required}
                        {...register("userName")}
                        placeholder={sendPost?.fields.name.value}
                    />
                    <input
                        className="postMe-form__input"
                        type="text"
                        required={sendPost?.fields.comment.required}
                        {...register("comment")}
                        placeholder={sendPost?.fields.comment.value}
                    />
                    <button className="postMe-form__submit" type="submit" >{sendPost.button}</button>
                </form>
            </section>
        </div>
    )
}