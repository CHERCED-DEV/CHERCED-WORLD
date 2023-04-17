import { useState, useContext, createContext, useCallback, useEffect } from 'react';
import { ContextProviderProps } from '../../pages/api/customCMS/interfaces';

const PortalContext = createContext<{
    modalSwitch: boolean;
    setModalSwitch: React.Dispatch<React.SetStateAction<boolean>>;
    actualInbox: number;
    mountMessages: () => Promise<void>;
}>({
    modalSwitch: false,
    setModalSwitch: () => { },
    actualInbox: 0,
    mountMessages: async () => {},
});

export const PortalContextProvider = ({ children }: ContextProviderProps) => {
    const [modalSwitch, setModalSwitch] = useState<boolean>(false);
    const [actualInbox, setActualInbox] = useState<number>(0)

    const mountMessages = async () => {
        const req = await fetch('/api/contactMe');
        const inbox = await req.json();
        setActualInbox(inbox.length)
    };

    return (
        <PortalContext.Provider
            value={{
                modalSwitch,
                setModalSwitch,
                actualInbox,
                
                mountMessages
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