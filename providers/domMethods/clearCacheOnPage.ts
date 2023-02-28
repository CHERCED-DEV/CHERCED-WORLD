import { useRouter } from "next/router";
import { useEffect } from "react";
interface ClearCacheOnPageChange {
  clearCacheOnPageChange: () => void;
}

export function useClearCacheOnPageChange(): ClearCacheOnPageChange {
  const router = useRouter();

  const handleRouteChange = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  useEffect(() => {
    const handleRouteComplete = (url: string) => {
      if (typeof window !== "undefined" && url !== router.asPath) {
        handleRouteChange();
      }
    };

    router.events.on("routeChangeComplete", handleRouteComplete);

    return () => {
      router.events.off("routeChangeComplete", handleRouteComplete);
    };
  }, [router]);

  return {
    clearCacheOnPageChange: handleRouteChange,
  };
}
