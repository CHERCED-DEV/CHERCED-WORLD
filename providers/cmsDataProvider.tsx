import React from 'react';
import { getCMSData } from './requests/homeCB';
import { CmsDataContextProviderProps, CmsDataConfig } from '../pages/api/customCMS/interfaces';

const CmsDataContext = React.createContext<{
	CmsData: CmsDataConfig;
	handleSubMenu: boolean;
	sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>;
}>({} as any);

export const CmsDataContextProvider = ({ children }: CmsDataContextProviderProps) => {

	const [CmsData, setCmsData] = React.useState<CmsDataConfig>({} as any);
	const [handleSubMenu, sethandleSubMenu] = React.useState<any>(false);

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

	return (
		<CmsDataContext.Provider
			value={{
				CmsData,
				handleSubMenu,
				sethandleSubMenu,
			}}
		>
			{children}
		</CmsDataContext.Provider>
	)
}

export function useCmsDataHome(): {
	CmsData: CmsDataConfig;
	handleSubMenu: boolean;
	sethandleSubMenu: React.Dispatch<React.SetStateAction<boolean>>
} {
	const context = React.useContext(CmsDataContext);
	return context;
}