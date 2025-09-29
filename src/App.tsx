import React, { useState, useContext } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material";
import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";
import RdzHealthApp from "./components/RdzHealthApp";
import AuthPage from "./components/AuthPage";
import { theme } from "./theme";
import { WalletConnectContext } from "./contexts/WalletConnectContext";
import { UserProvider } from "./contexts/UserContext";
import { useAppState } from "./hooks/useAppState";
import { useWalletStateRefresh } from "./hooks/useWalletStateRefresh";
import "./App.css";

// Component that handles app state management inside UserProvider context
const AuthenticatedApp: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { refreshWalletState } = useWalletStateRefresh();

  // Handle app state changes for mobile
  useAppState({
    onAppActive: () => {
      console.log("App became active - refreshing wallet state");
      refreshWalletState();
    },
    onAppInactive: () => {
      console.log("App became inactive");
    },
    onVisibilityChange: (isVisible) => {
      if (isVisible) {
        console.log("App became visible - refreshing wallet state");
        refreshWalletState();
      }
    },
  });

  return <RdzHealthApp onLogout={onLogout} />;
};

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const walletConnectContext = useContext(WalletConnectContext);

  // Get the current account ID from WalletConnect (HashPack)
  const currentAccountId = walletConnectContext.accountId;

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    walletConnectContext.setAccountId("");
    walletConnectContext.setIsConnected(false);
    setIsAuthenticated(false);
  };

  return (
    <>
      <CssBaseline />
      {isAuthenticated ? (
        <UserProvider accountId={currentAccountId}>
          <AuthenticatedApp onLogout={handleLogout} />
        </UserProvider>
      ) : (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AllWalletsProvider>
        <AppContent />
      </AllWalletsProvider>
    </ThemeProvider>
  );
}

export default App;
