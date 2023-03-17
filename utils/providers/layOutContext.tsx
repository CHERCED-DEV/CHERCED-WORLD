import { useContext, createContext } from "react";
import { ContextProviderProps } from "../../pages/api/customCMS/interfaces";
import { StarterApp } from "../../components/Layout/Spiners&Loaders/StarterApp";
import { PageLoader } from "../../components/Layout/Spiners&Loaders/PageLoader";
import { Header } from "../../components/Layout/Headers/Header";
import { HeaderBackTo } from "../../components/Layout/Headers/HeaderBackTo";
import { Footer } from "../../components/Layout/Footers/Footer";

const LayoutContext = createContext<{
    header: JSX.Element,
    HeaderBackTo: JSX.Element,
    footer: JSX.Element,
    starterApp: JSX.Element,
    pageLoader: JSX.Element,

}>({
    header: <Header />,
    HeaderBackTo: <HeaderBackTo />,
    footer: <Footer />,
    starterApp: <StarterApp />,
    pageLoader: <PageLoader />,
});

export const LayoutContextProvider = ({ children }: ContextProviderProps) => {
    return (
        <LayoutContext.Provider
            value={{
                header: <Header />,
                HeaderBackTo: <HeaderBackTo />,
                footer: <Footer />,
                starterApp: <StarterApp />,
                pageLoader: <PageLoader />,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
};

export function useLayoutProvider() {
    const context = useContext(LayoutContext);
    return context
}