import React from 'react';
import { getHomeData } from './requests/homeCB';
import { CmsDataContextProviderProps } from '../pages/api/customCMS/INTERFACES';
import { HomeData } from '../pages/api/customCMS/INTERFACES';

const CmsDataContext = React.createContext<{
  homeData: HomeData;
  loading: boolean;
}>({} as any);

export const CmsDataContextProvider = ({ children }: CmsDataContextProviderProps) => {

  const [homeData, sethomeData] = React.useState<HomeData>({} as any);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    getHomeData().then((data: HomeData) => {
      if (mounted) {
        console.log("oe" + data)
        sethomeData(data);
      }
    })
    return () => {
      setLoading(false);
      mounted = false;
    };
  }, []);

  return (
    <CmsDataContext.Provider
      value={{
        homeData,
        loading,
      }}
    >
      {children}
    </CmsDataContext.Provider>
  )
}

export function useCmsDataHome(): {
  homeData: HomeData;
  loading: boolean;
} {
  const context = React.useContext(CmsDataContext);
  return context;
}