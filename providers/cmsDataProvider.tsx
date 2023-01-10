import React from 'react';
import { getCMSData } from './requests/homeCB';
import { CmsDataContextProviderProps, CmsDataConfig } from '../pages/api/customCMS/interfaces';

const CmsDataContext = React.createContext<{
	CmsData: CmsDataConfig;
	loading: boolean;
}>({} as any);

export const CmsDataContextProvider = ({ children }: CmsDataContextProviderProps) => {

	const [CmsData, setCmsData] = React.useState<CmsDataConfig>({} as any);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		let mounted = true;
		getCMSData().then((data: CmsDataConfig) => {
			if (mounted) {
				setCmsData(data);
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
				CmsData,
				loading,
			}}
		>
			{children}
		</CmsDataContext.Provider>
	)
}

export function useCmsDataHome(): {
	CmsData: CmsDataConfig;
	loading: boolean;
} {
	const context = React.useContext(CmsDataContext);
	return context;
}