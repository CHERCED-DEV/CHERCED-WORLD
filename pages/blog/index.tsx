import React, { memo } from 'react';
import Head from 'next/head';
import { getBlogCMSData, getPostsData } from '../../utils/providers/requests/homeCB';
import { BlogCmsConfig } from '../api/blog/blogData/database/blog.interface';
import { ListBlogCarrousel } from '../../components/Mains/blogLanding/utils/ListBlogCarrousel';
import { PostConfig } from '../api/blog/posts/database/post.interface';


interface blogLandingConifg {
    BlogCms: BlogCmsConfig
    postData: PostConfig[];
}

export default memo(function BlogIntro({ BlogCms, postData }: blogLandingConifg) {

    return (
        <>
            <Head>
                <title>Blog | &lt;-CHERCED-WORLD-&gt;</title>
                <meta name="description" content="Read about my latest insights on web development, technology, and more." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
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
    const postData = await getPostsData();
    return {
        props: {
            BlogCms,
            postData
        }
    }
}