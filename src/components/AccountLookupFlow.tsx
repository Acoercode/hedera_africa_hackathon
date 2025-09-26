import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { apiService } from "../services/api";
import DataSyncConsentDialog from "./DataSyncConsentDialog";
import { HEDERA_CONFIG } from "../config/constants";

interface AccountLookupFlowProps {
  accountId: string;
  onAccountFound: (userData: any) => void;
  onBackToWallet: () => void;
  walletInterface: any;
}

const AccountLookupFlow: React.FC<AccountLookupFlowProps> = ({
  accountId,
  onAccountFound,
  onBackToWallet,
  walletInterface,
}) => {
  const [step, setStep] = useState<"search" | "verify" | "success">("search");
  const [iHopeId, setIHopeId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showDataSyncConsent, setShowDataSyncConsent] = useState(false);
  const [dataSyncLoading, setDataSyncLoading] = useState(false);

  const handleSearchAccount = async () => {
    if (!iHopeId.trim()) {
      setError("Please enter your iHope ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Search for user by iHope ID
      const response = await apiService.searchUserByIHopeId(iHopeId.trim());

      if (response.found) {
        setUserData(response.user);
        setStep("verify");
      } else {
        setError(
          "No account found with that iHope ID. Please check and try again.",
        );
      }
    } catch (err) {
      setError("Failed to search for account. Please try again.");
      console.error("Error searching for account:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = async () => {
    if (!dateOfBirth) {
      setError("Please select your date of birth");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verify date of birth and create user account
      const response = await apiService.verifyAndCreateUser({
        iHopeId: userData.iHopeId,
        dateOfBirth: dateOfBirth.toISOString().split("T")[0],
        hederaAccountId: accountId,
      });

      if (response.success) {
        // Show data sync consent dialog instead of proceeding directly
        setShowDataSyncConsent(true);
      } else {
        setError("Date of birth does not match our records. Please try again.");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      console.error("Error verifying account:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDataSyncConsent = async () => {
    try {
      setDataSyncLoading(true);
      setError(null);

      if (!walletInterface) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first.",
        );
      }

      // Use native HTS NFT flow for data sync consent (same as ConsentManagement)
      const { TokenId } = await import("@hashgraph/sdk");
      const dataSyncTokenId = TokenId.fromString(
        HEDERA_CONFIG.DATA_SYNC_NFT_TOKEN_ID,
      );

      // Step 1: User signs token association transaction
      const associationTransactionId =
        await walletInterface.associateToken(dataSyncTokenId);

      if (!associationTransactionId) {
        throw new Error("Token association failed or was rejected.");
      }

      // Step 2: Backend mints and transfers the NFT
      const dataSyncResponse = await fetch(
        "http://localhost:5000/api/consent/data-sync",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accountId }),
        },
      );

      if (!dataSyncResponse.ok) {
        const errorText = await dataSyncResponse.text();
        throw new Error(`Backend error: ${errorText}`);
      }

      // Proceed to main app
      setShowDataSyncConsent(false);
      setStep("success");
      setTimeout(() => {
        onAccountFound(userData);
      }, 1000);
    } catch (error: any) {
      console.error("Error signing data sync transaction:", error);
      setError(
        error.message ||
          "Failed to create data sync consent. Please try again.",
      );
    } finally {
      setDataSyncLoading(false);
    }
  };

  const handleDataSyncDecline = () => {
    // User declined data sync, proceed to main app anyway
    setShowDataSyncConsent(false);
    setStep("success");
    setTimeout(() => {
      onAccountFound(userData);
    }, 1000);
  };

  const handleBackToSearch = () => {
    setStep("search");
    setDateOfBirth(null);
    setError(null);
  };

  const renderSearchStep = () => (
    <Card
      sx={{
        maxWidth: 500,
        width: "100%",
        borderRadius: 3,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <PersonIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", mb: 1, color: "text.primary" }}
          >
            Welcome!
          </Typography>
          <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
            Connect your data to get started.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", mb: 2, color: "text.primary" }}
          >
            Enter Your iHope ID
          </Typography>
          <TextField
            fullWidth
            placeholder="Example: iH-123456"
            value={iHopeId}
            onChange={(e) => setIHopeId(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSearchAccount}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <SearchIcon />
            }
            sx={{
              py: 2,
              fontSize: "1.1rem",
              fontWeight: "bold",
              borderRadius: 2,
            }}
          >
            {loading ? "Searching..." : "Search iHope ID"}
          </Button>
        </Box>

        {/* Back to Wallet */}
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="text"
            onClick={onBackToWallet}
            sx={{ color: "text.secondary" }}
          >
            ← Back to Wallet Connection
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderVerifyStep = () => (
    <Card
      sx={{
        maxWidth: 500,
        width: "100%",
        borderRadius: 3,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <CheckIcon sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", mb: 1, color: "text.primary" }}
          >
            We Found Your Records
          </Typography>
          <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
            Verify your date of birth to continue.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* User Info */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: "grey.50", borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            iHope ID: {userData?.iHopeId}
          </Typography>
        </Box>

        {/* Date of Birth Verification */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", mb: 2, color: "text.primary" }}
          >
            Verify Date of Birth
          </Typography>
          <TextField
            fullWidth
            type="date"
            value={dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setDateOfBirth(e.target.value ? new Date(e.target.value) : null)
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <CalendarIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleVerifyAccount}
            disabled={loading || !dateOfBirth}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            sx={{
              py: 2,
              mt: 3,
              fontSize: "1.1rem",
              fontWeight: "bold",
              borderRadius: 2,
            }}
          >
            {loading ? "Verifying..." : "Submit and Sync Data"}
          </Button>
        </Box>

        {/* Back to Search */}
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="text"
            onClick={handleBackToSearch}
            sx={{ color: "text.secondary" }}
          >
            ← Back to Search
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card
      sx={{
        maxWidth: 500,
        width: "100%",
        borderRadius: 3,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      }}
    >
      <CardContent sx={{ p: 4, textAlign: "center" }}>
        <CheckIcon sx={{ fontSize: 80, color: "success.main", mb: 3 }} />
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", mb: 2, color: "text.primary" }}
        >
          Account Connected!
        </Typography>
        <Typography variant="h6" sx={{ color: "text.secondary", mb: 3 }}>
          Your iHope account has been successfully linked to your Hedera wallet.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Redirecting to your dashboard...
        </Typography>
        <CircularProgress sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        p: 2,
      }}
    >
      {step === "search" && renderSearchStep()}
      {step === "verify" && renderVerifyStep()}
      {step === "success" && renderSuccessStep()}

      {/* Data Sync Consent Dialog */}
      <DataSyncConsentDialog
        open={showDataSyncConsent}
        onClose={() => setShowDataSyncConsent(false)}
        onConsent={handleDataSyncConsent}
        onDecline={handleDataSyncDecline}
        loading={dataSyncLoading}
        userData={userData}
      />
    </Box>
  );
};

export default AccountLookupFlow;
