import React, { memo, useEffect, useState } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { ListBlogCarrousel } from '../../components/Mains/blogLanding/utils/ListBlogCarrousel';
import { BlogCmsConfig } from '../api/blog/blogData/database/blog.interface';
import { PostConfig } from '../api/blog/posts/database/post.interface';



export default memo(function BlogIntro() {

    const [showStarterPage, setShowStarterPage] = useState<boolean>(true);
    const [BlogPostDataCMS, setBlogPostDataCMS] = useState<BlogCmsConfig>();
    const [postData, setPostData] = useState<PostConfig[]>([]);

    useEffect(() => {
        function handlePageLoad() {
            const timerId = setTimeout(() => {
                setShowStarterPage(!showStarterPage);
            }, 1500);

            // Return a function to clear the timer before the component is unmounted.
            return () => {
                clearTimeout(timerId);
            }
        }

        handlePageLoad();
    }, []);

    useEffect(() => {
        let mounted = true;

        const fetchPostsData = async () => {
            const response = await fetch('/api/blog/posts');
            const data = await response.json();
            if (mounted) {
                setPostData(data);
            }
        };

        const fetchBlogData = async () => {
            const response = await fetch('/api/blog/blogData');
            const data = await response.json();
            if (mounted) {
                setBlogPostDataCMS(data);
            }
        };

        fetchBlogData();
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
                <h1 className="blog-intro__title">{BlogPostDataCMS?.mainTitle}<strong>{BlogPostDataCMS?.mainTitleStrong}</strong> </h1>
                <p className="blog-intro__description">{BlogPostDataCMS?.welcomeMenssage}</p>
                <div className="blog-intro__img">
                    {BlogPostDataCMS?.img.src && (
                        <Image
                            src={BlogPostDataCMS?.img.src}
                            alt={BlogPostDataCMS?.img.alt}
                            fill={false}
                            width={472}
                            height={852}
                        />
                    )}
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