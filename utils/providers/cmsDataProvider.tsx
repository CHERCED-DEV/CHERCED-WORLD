import React from 'react';
import { useRouter } from 'next/router';
import { getCMSData } from './requests/homeCB';
import { useClearCacheOnPageChange } from '../domMethods/clearCacheOnPage';
import { pageClassDynamicBody } from '../domMethods/pageClassDynamicBody';
import { ContextProviderProps, CmsDataConfig } from '../../pages/api/customCMS/interfaces';

const CmsDataContext = React.createContext<{
  handleSubMenu: boolean;
  sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
  pageClass: string;
}>({} as any);

export const CmsDataProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const router = useRouter();
  const id = router.asPath;
  const [handleSubMenu, sethandleSubMenu] = React.useState<boolean>(false);
  const [pageClassValue, setPageClassValue] = React.useState<string>('');

  React.useEffect(() => {
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
  const context = React.useContext(CmsDataContext);
  return { ...context, ...useClearCacheOnPageChange() };
};