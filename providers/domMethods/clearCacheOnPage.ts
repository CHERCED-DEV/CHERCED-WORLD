import { useRouter } from "next/router";
import { useEffect } from "react";

interface ClearCacheOnPageChange {
  clearCacheOnPageChange: () => void;
}

export function useClearCacheOnPageChange(): ClearCacheOnPageChange {
  const router = useRouter();

  const handleRouteChange = () => {
    window.location.reload();
  };

  useEffect(() => {
    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, []);

  return {
    clearCacheOnPageChange: handleRouteChange,
  };
}
