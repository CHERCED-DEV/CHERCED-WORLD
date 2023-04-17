import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import Mail from '../../../../public/assets/icons/Mail.svg'
import { usePortalProvider } from '../../../../utils/providers/modalProvider';

export function InboxAlert() {
    const { actualInbox, mountMessages } = usePortalProvider();
    const [inboxInitial, setInboxInitial] = useState<number>(0)
    const [counter, setCounter] = useState<number>(0)

    const initialMessages = async () => {
        const req = await fetch('/api/contactMe');
        const inbox = await req.json();
        setInboxInitial(inbox.length)
    };

    useEffect(() => {
        initialMessages()
    }, [])

    useEffect(() => {
        
        if (inboxInitial < actualInbox) {
            setCounter(actualInbox - inboxInitial);
        }
    }, [actualInbox])

    return (
        <>
            {
                counter > 0 ? (<div className='inboxAlert'>
                    {counter > 0 ? <span className='inboxAlert_counter'>{counter}</span> : null}
                    <Image
                        src={Mail}
                        alt={"inbox notification"}
                        width={24}
                        height={24}
                    />
                </div>) : null
            }
        </>
    )
}
