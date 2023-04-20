import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Mail from '../../../../public/assets/icons/Mail.svg';

interface InBoxAlertConfig {
    unReadCount: number;
}

export function InboxAlert({unReadCount}:InBoxAlertConfig) {
     

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