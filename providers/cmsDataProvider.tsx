import React from 'react';
import { useRouter } from 'next/router';
import { getCMSData } from './requests/homeCB';
import { useClearCacheOnPageChange } from './domMethods/clearCacheOnPage';
import { pageClassDynamicBody } from './domMethods/pageClassDynamicBody';
import { CmsDataContextProviderProps, CmsDataConfig } from '../pages/api/customCMS/interfaces';

const CmsDataContext = React.createContext<{
	CmsData: CmsDataConfig;
	handleSubMenu: boolean;
	sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
	pageClass: string
}>({} as any);

export const CmsDataContextProvider = ({ children }: CmsDataContextProviderProps) => {
	const router = useRouter();
	const id = router.asPath
	const [CmsData, setCmsData] = React.useState<CmsDataConfig>({} as any);
	const [handleSubMenu, sethandleSubMenu] = React.useState<boolean>(false);
	const [pageClassValue, setPageClassValue] = React.useState<string>('');

	React.useEffect(() => {
		let mounted = true;
		getCMSData().then((data: CmsDataConfig) => {
			if (mounted) {
				setCmsData(data);
			}
		})
		return () => {
			mounted = false;
		};
	}, []);

	React.useEffect(() => {
		setPageClassValue(pageClassDynamicBody(id));
        sethandleSubMenu(false);
	  }, [id]);
      
	useClearCacheOnPageChange();

	return (
		<CmsDataContext.Provider
			value={{
				CmsData,
				handleSubMenu,
				sethandleSubMenu,
				pageClass: pageClassValue,
			}}
		>
			{children}
		</CmsDataContext.Provider>
	)
}

export function useCmsDataHome(): {
	CmsData: CmsDataConfig;
	handleSubMenu: boolean;
	sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
	pageClass: string
} & ReturnType<typeof useClearCacheOnPageChange> {
	const context = React.useContext(CmsDataContext);
	return { ...context, ...useClearCacheOnPageChange() };
}