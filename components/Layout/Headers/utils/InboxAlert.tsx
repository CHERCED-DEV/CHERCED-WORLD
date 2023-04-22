import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Mail from '../../../../public/assets/icons/Mail.svg';
import { Login } from './Login/Login';
import { Modal } from '../../../../utils/portals/modalPortal';
import { usePortalProvider } from '../../../../utils/providers/modalProvider';

interface InBoxAlertConfig {
    unReadCount: number;
}

export function InboxAlert({ unReadCount }: InBoxAlertConfig) {
    const { modalSwitch, setModalSwitch } = usePortalProvider();

    return (
        <>
            {unReadCount > 0 ? (
                <button onClick={() => { setModalSwitch(!modalSwitch) }} className="inboxAlert">
                    <span className="inboxAlert_counter">{unReadCount}</span>
                    <Image src={Mail} alt={'inbox notification'} width={24} height={24} />
                </button>
            ) : null},
            {!!modalSwitch && (
                <Modal>
                    <Login />
                </Modal>
            )}
        </>
    );
}