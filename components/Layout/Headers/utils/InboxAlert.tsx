import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Mail from '../../../../public/assets/icons/Mail.svg';



export function InboxAlert() {
    const [unReadCount, setUnReadCount] = useState<number>(0);
    const router = useRouter();

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await fetch(`/api/sockets/newMessage`);
                const data = await response.json();
                setUnReadCount(data.notification);
            } catch (error) {
                console.error(error);
            }
        };
        if (router.asPath === "/inbox") {
            fetchUnreadCount();
        } else {
            fetchUnreadCount();
        }
        
    }, [router.asPath]);

    return (
        <>
            {unReadCount > 0 ? (
                <Link href="/inbox">
                    <div className="inboxAlert">
                        <span className="inboxAlert_counter">{unReadCount}</span>
                        <Image src={Mail} alt={'inbox notification'} width={24} height={24} />
                    </div>
                </Link>
            ) : null}
        </>
    );
}