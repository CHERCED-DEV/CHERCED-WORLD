import { useState, useContext, createContext, useCallback, useEffect } from 'react';
import { ContextProviderProps } from '../../pages/api/customCMS/interfaces';

const PortalContext = createContext<{
    session: boolean;
    setSession: React.Dispatch<React.SetStateAction<boolean>>;
    modalSwitch: boolean;
    setModalSwitch: React.Dispatch<React.SetStateAction<boolean>>;
    unReadCount: number;
    fetchUnreadCount: () => Promise<void>;
}>({
    session: false,
    setSession: () => { },
    modalSwitch: false,
    setModalSwitch: () => { },
    unReadCount: 0,
    fetchUnreadCount: async () => { },
});

export const PortalContextProvider = ({ children }: ContextProviderProps) => {
    const [modalSwitch, setModalSwitch] = useState<boolean>(false);
    const [unReadCount, setUnReadCount] = useState<number>(0);
    const [session, setSession] = useState<boolean>(false);

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(`/api/sockets/newMessage`);
            const data = await response.json();
            setUnReadCount(data.notification);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <PortalContext.Provider
            value={{
                session,
                setSession,
                modalSwitch,
                setModalSwitch,
                unReadCount,
                fetchUnreadCount
            }}
        >
            {children}
        </PortalContext.Provider>
    )
}

export function usePortalProvider() {
    const context = useContext(PortalContext)
    return context
}