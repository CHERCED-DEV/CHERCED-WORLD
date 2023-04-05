import React, { useEffect, useState } from 'react'
import { getBlogCMSData } from '../../../../utils/providers/requests/homeCB';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { CommentsConfig } from '../../../../pages/api/blog/posts/database/post.interface';
import { usePortalProvider } from '../../../../utils/providers/modalProvider';
import DataBase from '../../../../pages/api/blog/posts/database/post.methods';
import Swal from 'sweetalert';
import { FieldsPostConfig } from '../../../../pages/api/blog/blogData/database/blog.interface';

interface FormPostConfigData {
    postCmsData: FieldsPostConfig;
}

export const FormpostCmsData: React.FC<FormPostConfigData> = ({ postCmsData }) => {

    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const { modalSwitch, setModalSwitch } = usePortalProvider()
    const { register, handleSubmit, formState: { errors } } = useForm<CommentsConfig>();




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

    const onSubmit = async (data: CommentsConfig) => {
        try {
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
            setModalSwitch(false);
            Swal({
                title: "Post sent!",
                text: "Thank you for submitting your post, we will review it soon.",
                icon: "success",
            });
        } catch (error) {
            console.error(error);
            setModalSwitch(true);
            Swal({
                title: "Error",
                text: "There was an error sending your message. Please try again later.",
                icon: "error",
            });
        }
    };





    return (
        <div className='modalBackground'>
            <section className={showModal ? ("postMe on") : ("postMe off")}>
                <button className='postMe-close' onClick={() => { setModalSwitch(!modalSwitch) }}>X</button>
                <h1 className="postMe-title">{postCmsData.title}</h1>
                <form className="postMe-form" onSubmit={handleSubmit(onSubmit)}>
                    <input
                        className="postMe-form__input"
                        type="text"
                        required={postCmsData?.fields.email.required}
                        {...register("email")}
                        placeholder={postCmsData?.fields.email.value}
                    />
                    <input
                        className="postMe-form__input"
                        type="text"
                        required={postCmsData?.fields.name.required}
                        {...register("userName")}
                        placeholder={postCmsData?.fields.name.value}
                    />
                    <input
                        className="postMe-form__input"
                        type="text"
                        required={postCmsData?.fields.comment.required}
                        {...register("comment")}
                        placeholder={postCmsData?.fields.comment.value}
                    />
                    <button className="postMe-form__submit" type="submit" >{postCmsData.button}</button>
                </form>
            </section>
        </div>
    )
}

export async function getServerSideProps() {
    const blogData = await getBlogCMSData();
    return {
        props: {
            postCmsData: blogData.postCmsData
        }
    }
}