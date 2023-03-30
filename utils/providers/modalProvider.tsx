import { useState, useContext, createContext } from 'react';
import { ContextProviderProps } from '../../pages/api/customCMS/interfaces';

const PortalContext = createContext<{
    modalSwitch: boolean;
    setModalSwitch: React.Dispatch<React.SetStateAction<boolean>>;
}>({
    modalSwitch: false,
    setModalSwitch: () => { },
});

export const PortalContextProvider = ({ children }: ContextProviderProps) => {
    const [modalSwitch, setModalSwitch] = useState<boolean>(false);

    return (
        <PortalContext.Provider
            value={{
                modalSwitch,
                setModalSwitch
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