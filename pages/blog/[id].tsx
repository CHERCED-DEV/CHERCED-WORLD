import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PostConfig } from '../api/blog/posts/database/post.interface';
import { FieldsPostConfig } from '../api/blog/blogData/database/blog.interface';
import { CommentsConfig } from '../api/blog/comments/database/comments.interface';
import { getBlogCMSData, getCommentsData, getPostByIdData } from '../../utils/providers/requests/homeCB';
import { FormSendPost } from '../../components/Mains/blogLanding/utils/FormSendPost';
import { Modal } from '../../utils/portals/modalPortal';
import { usePortalProvider } from '../../utils/providers/modalProvider';
import { BlogLanding } from '../../components/Mains/blogLanding/BlogLanding';
import { ListComentsBlog } from '../../components/Mains/blogLanding/utils/ListComentsBlog';


interface PostConfigProps {
    post: PostConfig;
    postCmsData: FieldsPostConfig;
}

export default function Blog({ post, postCmsData }: PostConfigProps) {

    const { modalSwitch, setModalSwitch } = usePortalProvider();
    const [comments, setComments] = useState<CommentsConfig[]>([]);
    const [sendAction, setSendAction] = useState<boolean>(false)
    const router = useRouter();

    useEffect(() => {
        (async () => {
            const commentIndex = router.asPath.split('/').pop()?.trim();
            if(commentIndex){
                const data = await getCommentsData(commentIndex);
                setComments(data)
            }
        })();
    }, [router.asPath, sendAction]);



    return (
        <>
            <Head>
                <title>Post: {post.title} | &lt;-CHERCED-WORLD-&gt;</title>
                <meta name="description" content={post.title} />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            {
                post && comments ? <>
                    <BlogLanding
                        id={post?.id}
                        title={post?.title}
                        subtitle={post?.subtitle}
                        img={
                            {
                                src: post.img?.src,
                                alt: post.img?.alt
                            }
                        }
                        description={post?.description}
                    />
                    <section className='comments'>
                        <h3 className='comments-title'>Comentarios</h3>
                        <ul className='comments-list'>
                            {
                                comments?.map((comnent: CommentsConfig) => (
                                    <ListComentsBlog
                                        key={comnent._id}
                                        postId={comnent.postId}
                                        _id={comnent._id}
                                        userName={comnent.userName}
                                        comment={comnent.comment}
                                        date={comnent.date}
                                    />
                                ))
                            }
                        </ul>
                    </section>
                    <button className='blog-post__button' onClick={() => { setModalSwitch(!modalSwitch) }}>enviar</button>
                    {!!modalSwitch && (
                        <Modal>
                            <FormSendPost postCmsData={postCmsData} sendAction={sendAction}
                                setSendAction={setSendAction} />
                        </Modal>
                    )}
                </> : null
            }
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
    const { query } = context;
    const { id } = query;
    if (typeof id !== 'string' || id.trim() === '') {
        return {
            notFound: true
        };
    }
    const post = await getPostByIdData(id);
    const blogCms = await getBlogCMSData();
    const { postCmsData } = blogCms
    return {
        props: {
            post,
            postCmsData
        }
    };
};