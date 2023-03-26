import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useClearCacheOnPageChange } from '../domMethods/clearCacheOnPage';
import { pageClassDynamicBody } from '../domMethods/pageClassDynamicBody';
import { ContextProviderProps } from '../../pages/api/customCMS/interfaces';
import { CmsDataConfig } from '../../pages/api/customCMS/interfaces';

interface cmsDataProviderProps extends ContextProviderProps {
    CmsData: CmsDataConfig;
}

const CmsDataContext = createContext<{
    staticDataSite: Partial<CmsDataConfig>;
    handleSubMenu: boolean;
    sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
    pageClass: string;
}>({
    staticDataSite: {},
    handleSubMenu: false,
    sethandleSubMenu: () => { },
    pageClass: '',
});


export const CmsDataProvider: React.FC<cmsDataProviderProps> = ({ children, CmsData }) => {
    const router = useRouter();
    const id = router.asPath;
    const [handleSubMenu, sethandleSubMenu] = useState<boolean>(false);
    const [pageClassValue, setPageClassValue] = useState<string>('');
    const [staticDataSite, setStaticDataSite] = useState<Partial<CmsDataConfig>>({});


    const mountData = useCallback(() => {
        setStaticDataSite(CmsData);
    },[CmsData])

    useEffect(()=> {
        mountData()
    }, [mountData]);

    useEffect(() => {
        setPageClassValue(pageClassDynamicBody(id));
        sethandleSubMenu(false);
    }, [id]);

    useClearCacheOnPageChange();

    return (
        <CmsDataContext.Provider
            value={{
                staticDataSite,
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
    staticDataSite: Partial<CmsDataConfig>;
    handleSubMenu: boolean;
    sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
    pageClass: string;
} & ReturnType<typeof useClearCacheOnPageChange> => {
    const context = useContext(CmsDataContext);
    return { ...context, ...useClearCacheOnPageChange() };
};