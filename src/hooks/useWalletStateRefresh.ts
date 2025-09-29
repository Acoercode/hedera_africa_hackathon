import { useCallback, useContext, useRef } from "react";
import { WalletConnectContext } from "../contexts/WalletConnectContext";
import { useUser } from "../contexts/UserContext";

export const useWalletStateRefresh = () => {
  const walletConnectContext = useContext(WalletConnectContext);
  const { refetchUser } = useUser();
  const lastRefreshTime = useRef<number>(0);

  const refreshWalletState = useCallback(async () => {
    try {
      // Prevent too frequent refreshes (throttle to once per 5 seconds)
      const now = Date.now();
      if (now - lastRefreshTime.current < 5000) {
        console.log("Skipping refresh - too recent");
        return;
      }
      lastRefreshTime.current = now;

      // For WalletConnect/HashPack, we rely on the existing sync mechanism
      // The WalletConnectClient should handle reconnection automatically
      // We just need to refresh user data when the app becomes active

      // Refresh user data if we have an account
      if (walletConnectContext.accountId) {
        console.log(
          "Refreshing user data for account:",
          walletConnectContext.accountId,
        );
        await refetchUser();
      }
    } catch (error) {
      console.error("Error refreshing wallet state:", error);
    }
  }, [walletConnectContext.accountId]); // Remove refetchUser from dependencies

  return { refreshWalletState };
};
