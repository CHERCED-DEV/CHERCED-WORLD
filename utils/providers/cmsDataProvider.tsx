import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useClearCacheOnPageChange } from '../domMethods/clearCacheOnPage';
import { pageClassDynamicBody } from '../domMethods/pageClassDynamicBody';
import { ContextProviderProps } from '../../pages/api/customCMS/interfaces';

const CmsDataContext = createContext<{
    handleSubMenu: boolean;
    sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
    pageClass: string;
}>({
    handleSubMenu: false,
    sethandleSubMenu: () => { },
    pageClass: '',
});


export const CmsDataProvider: React.FC<ContextProviderProps> = ({ children }) => {
    const router = useRouter();
    const id = router.asPath;
    const [handleSubMenu, sethandleSubMenu] = useState<boolean>(false);
    const [pageClassValue, setPageClassValue] = useState<string>('');

    useEffect(() => {
        setPageClassValue(pageClassDynamicBody(id));
        sethandleSubMenu(false);
    }, [id]);

    useClearCacheOnPageChange();

    return (
        <CmsDataContext.Provider
            value={{
                handleSubMenu,
                sethandleSubMenu,
                pageClass: pageClassValue,
            }}
        >
            {children}
        </CmsDataContext.Provider>
    );
};

export const UseCmsDataHome = (): {
    handleSubMenu: boolean;
    sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
    pageClass: string;
} & ReturnType<typeof useClearCacheOnPageChange> => {
    const context = useContext(CmsDataContext);
    return { ...context, ...useClearCacheOnPageChange() };
};