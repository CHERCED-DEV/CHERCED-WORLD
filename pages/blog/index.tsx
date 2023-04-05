import React, { memo, useEffect, useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { getBlogCMSData } from '../../utils/providers/requests/homeCB';
import { BlogCmsConfig } from '../api/blog/blogData/database/blog.interface';
import { ListBlogCarrousel } from '../../components/Mains/blogLanding/utils/ListBlogCarrousel';
import { PostConfig } from '../api/blog/posts/database/post.interface';


interface blogLandingConifg {
    BlogCms: BlogCmsConfig
}

export default memo(function BlogIntro({ BlogCms }: blogLandingConifg) {

    const [postData, setPostData] = useState<PostConfig[]>([]);

    useEffect(() => {
        let mounted = true;

        const fetchPostsData = async () => {
            const response = await fetch('/api/blog/posts');
            const data = await response.json();
            if (mounted) {
                setPostData(data);
            }
        };

        fetchPostsData();

        return () => {
            mounted = false;
        };
    }, []);


    return (
        <>
            <Head>
                <title>Blog | &lt;-CHERCED-WORLD-&gt;</title>
                <meta name="description" content="Read about my latest insights on web development, technology, and more." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <section className="blog-intro">
                <h1 className="blog-intro__title">{BlogCms?.mainTitle}<strong>{BlogCms?.mainTitleStrong}</strong> </h1>
                <p className="blog-intro__description">{BlogCms?.welcomeMenssage}</p>
                <div className="AtomContainer">
                        <div className="atomP">
                            <div className="electronP" />
                            <div className="electronP" />
                            <div className="electronP" />
                        </div>
                    </div>
            </section>
            <section className="blog-carrousel">
                <ul className="blog-carrousel__list">
                    {
                        postData.map((post: PostConfig, index: number) => (
                            <ListBlogCarrousel
                                key={index}
                                id={post.id}
                                title={post.title}
                                description={post.description}
                                img={{
                                    src: post.img.src,
                                    alt: post.img.alt,
                                }}
                            />
                        ))
                    }
                </ul>
            </section>
        </>
    );
});

export async function getServerSideProps() {
    const BlogCms = await getBlogCMSData();
    return {
        props: {
            BlogCms
        }
    }
}