import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { PageLoader } from '../../components/atoms/Spiners&Loaders/PageLoader';
import { BlogCmsConfig } from '../api/blog/blogData/blog.interface';
import { PostConfig } from '../api/blog/posts/post.interface';
import { Header } from '../../components/molecules/Headers/Header';
import { Footer } from '../../components/molecules/Footers/Footer';


export default function BlogIntro() {

    const [showStarterPage, setShowStarterPage] = useState<boolean>(true);
    const [BlogPostDataCMS, setBlogPostDataCMS] = useState<BlogCmsConfig>();
    const [postData, setPostData] = useState<PostConfig>();

    useEffect(() => {
        const timerId = setTimeout(() => {
            setShowStarterPage(!showStarterPage);
        }, 3500);

        // Return a function to clear the timer before the component is unmounted.
        return () => {
            clearTimeout(timerId);
        }
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
                <title>Create Next App</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {

                showStarterPage ? (<PageLoader />) : (<body className='BLOG-PAGE'>
                    <Header />
                    <section>
                        <h1>{BlogPostDataCMS?.mainTitle}<strong>{BlogPostDataCMS?.mainTitleStrong}</strong> </h1>
                        <p>{BlogPostDataCMS?.welcomeMenssage}</p>
                        <img
                            src={BlogPostDataCMS?.img.src}
                            alt={BlogPostDataCMS?.img.alt}
                            loading={BlogPostDataCMS?.img.loading}
                        />
                    </section>
                    <section>
                        <ul>
                            <li>
                                <img
                                    src={BlogPostDataCMS?.img.src}
                                    alt={BlogPostDataCMS?.img.alt}
                                    loading={BlogPostDataCMS?.img.loading}
                                />
                                <h1></h1>
                            </li>
                        </ul>
                    </section>
                    <Footer />
                </body>
                )
            }
        </>
    )
}