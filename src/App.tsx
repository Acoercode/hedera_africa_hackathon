import React, { useState, useContext } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material";
import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";
import RdzHealthApp from "./components/RdzHealthApp";
import AuthPage from "./components/AuthPage";
import { theme } from "./theme";
import { WalletConnectContext } from "./contexts/WalletConnectContext";
import { MetamaskContext } from "./contexts/MetamaskContext";
import { UserProvider } from "./contexts/UserContext";
import "./App.css";

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const walletConnectContext = useContext(WalletConnectContext);
  const metamaskContext = useContext(MetamaskContext);

  // Get the current account ID from either wallet context
  const currentAccountId =
    walletConnectContext.accountId || metamaskContext.metamaskAccountAddress;

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    walletConnectContext.setAccountId("");
    walletConnectContext.setIsConnected(false);
    metamaskContext.setMetamaskAccountAddress("");

    setIsAuthenticated(false);
  };

  return (
    <>
      <CssBaseline />
      {isAuthenticated ? (
        <UserProvider accountId={currentAccountId}>
          <RdzHealthApp onLogout={handleLogout} />
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
