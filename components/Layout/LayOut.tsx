import React, { ReactNode } from 'react';
import { Header } from './Headers/Header';
import { HeaderBackTo } from './Headers/HeaderBackTo';
import { Footer } from './Footers/Footer';
import { ContextProviderProps } from '../../pages/api/customCMS/interfaces';
import { useLocalStorageData } from '../../utils/hooks/getLocalStorageData';
import { LayOutConfig } from '../../pages/api/customCMS/interfaces';

interface LayoutPropsConfig {
    headerSimple: boolean;
    mainClass: string;
    children: ContextProviderProps | ReactNode | null;
}

export const LayOut: React.FC<LayoutPropsConfig> = ({ children, mainClass, headerSimple }) => {
    const [layOut] = useLocalStorageData<LayOutConfig>("CmsData", "layOut");

    return (
        <>
            {
                headerSimple ? (layOut ? <Header header={layOut.header} /> : null)
                    : (layOut ? <HeaderBackTo header={layOut.header} /> : null)
            }
            <main className={mainClass}>
                <>
                    {children}
                </>
            </main>
            {
                layOut ? <Footer footer={layOut.footer} /> : null
            }
        </>
    )
}
