import React, { useEffect, useState } from 'react'
import { getInBoxData } from '../utils/providers/requests/homeCB';
import Head from 'next/head';


export default function SecretPage({ inbox }: SecretPageProps) {

    const [showTable, setShowTable] = useState(false);
    const [sorterData, setSorterData] = useState(inbox)

    const sortData = (req: string) => {
        switch (req) {
            case "name":
                const byName = sorterData.slice().sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
                setSorterData(byName);
                break;
            case "last":
                const byLast = sorterData.slice().sort((a, b) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                setSorterData(byLast);
                break;
            case "first":
                const byFirst = sorterData.slice().sort((a, b) => {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                });
                setSorterData(byFirst);
                break;
            default:
                console.log("method its not allowed");
                break;
        }
    };

    useEffect(() => { }, [

    ])

    const toggleTable = () => {
        setShowTable(!showTable);
    };

    return (
        <>
            <Head>
                <title>InBox Me | &lt;-CHERCED-WORLD-&gt;</title>
                <meta name="description" content="My Dms Page" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <h1 className='secret-page__title'>INBOX</h1>
            <nav className='secret-page__nav'>
                <ul className='secret-sorter__list'>
                    <li className='secret-sorter__item'>
                        <button className='button-table__action' onClick={() => sortData("name")}>
                            <label>Sort by name</label>
                        </button>
                    </li>
                    <li className='secret-sorter__item'>
                        <button className='button-table__action' onClick={() => sortData("last")}>
                            <label>Sort by last created</label>
                        </button>
                    </li>
                    <li className='secret-sorter__item'>
                        <button className='button-table__action' onClick={() => sortData("first")}>
                            <label>Sort by first created</label>
                        </button>
                    </li>
                </ul>
            </nav>
            <table className="table-styling">
                <thead>
                    <tr>
                        <th id='name' className='none'>Name</th>
                        <th id='email' className='none'>Email</th>
                        <th id='phone' className='none'>Phone</th>
                        <th id='message' className='none'>Message</th>
                        <th id='date' className='none'>Create At</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        sorterData?.map((message: SecretPageServerCallConfig, index: number) => {
                            const hidden = index >= 4 && !showTable ? "hideenT" : "null";
                            return (
                                <tr key={message._id}>
                                    <th id='name' className={hidden}>{message.name}</th>
                                    <th id='email' className={hidden}>{message.email}</th>
                                    <th id='phone' className={hidden}>{message.phone}</th>
                                    <th id='message' className={hidden}>{message.message}</th>
                                    <th id='date' className={hidden}>{new Date(message.createdAt).toUTCString().toLocaleString()}</th>
                                </tr>)
                        })
                    }
                </tbody>
            </table>
            {
                inbox.length > 4 && (
                    <button onClick={toggleTable} className='button-table__action'>
                        {showTable ? 'Show less' : 'Show more!'}
                    </button>
                )
            }
        </>
    )
}

interface SecretPageServerCallConfig {
    _id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}
interface SecretPageProps {
    inbox: SecretPageServerCallConfig[]
}

export async function getServerSideProps(): Promise<{ props: SecretPageProps }> {
    try {
        const inbox: SecretPageServerCallConfig[] = await getInBoxData();
        return {
            props: {
                inbox
            }
        }
    } catch (error) {
        console.error(error);
        return {
            props: {
                inbox: []
            }
        }
    }
}