import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { HEDERA_CONFIG } from "../config/constants";
import DataSyncConsentDialog from "./DataSyncConsentDialog";

interface DataSyncConsent {
  consentId: string;
  consentNFTTokenId: string;
  consentNFTSerialNumber: string;
  consentNFTTransactionId: string;
  consentHash: string;
  isActive: boolean;
  dbIsActive: boolean;
  nftValid: boolean;
  nftError?: string;
  validFrom: string;
  validUntil: string;
  mintedAt: string;
  revokedAt?: string;
  revocationReason?: string;
}

interface DataSyncManagementProps {
  accountId: string | null;
  userData?: {
    firstName: string;
    lastName: string;
    iHopeId: string;
  };
}

const DataSyncManagement: React.FC<DataSyncManagementProps> = ({
  accountId,
  userData,
}) => {
  const [consentStatus, setConsentStatus] = useState<
    "loading" | "active" | "inactive" | "error"
  >("loading");
  const [consentData, setConsentData] = useState<DataSyncConsent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);

  // Check data sync consent status
  const checkConsentStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:5000/api/consent/data-sync/status/${accountId}`,
      );
      const result = await response.json();

      if (result.success) {
        if (result.consent) {
          console.log("📊 Data sync consent found:", result.consent);
          setConsentData(result.consent);
          setConsentStatus(result.consent.isActive ? "active" : "inactive");
        } else {
          console.log("❌ No data sync consent found for account:", accountId);
          setConsentStatus("inactive");
        }
      } else {
        console.error("❌ Failed to check consent status:", result.message);
        setError(result.message || "Failed to check consent status");
        setConsentStatus("error");
      }
    } catch (err) {
      console.error("Error checking consent status:", err);
      setError("Failed to check consent status");
      setConsentStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Create data sync consent
  const createConsent = async () => {
    try {
      setConsentLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:5000/api/consent/data-sync",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId: accountId,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        console.log("✅ Data sync consent created:", result.data);
        setShowConsentDialog(false);
        await checkConsentStatus(); // Refresh status
      } else {
        throw new Error(result.message || "Failed to create data sync consent");
      }
    } catch (error) {
      console.error("Error creating data sync consent:", error);
      setError("Failed to create data sync consent. Please try again.");
    } finally {
      setConsentLoading(false);
    }
  };

  // Handle consent dialog actions
  const handleConsentAccept = async () => {
    await createConsent();
  };

  const handleConsentDecline = () => {
    setShowConsentDialog(false);
  };

  // Revoke data sync consent
  const revokeConsent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:5000/api/consent/data-sync/revoke/${accountId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: revokeReason || "User requested revocation",
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        console.log("✅ Data sync consent revoked:", result.data);
        setShowRevokeDialog(false);
        setRevokeReason("");
        await checkConsentStatus(); // Refresh status
      } else {
        throw new Error(result.message || "Failed to revoke data sync consent");
      }
    } catch (error) {
      console.error("Error revoking data sync consent:", error);
      setError("Failed to revoke data sync consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      setHasAutoPrompted(false); // Reset auto-prompt flag for new account
      checkConsentStatus();
    }
  }, [accountId]);

  // Auto-prompt for consent when no consent exists
  useEffect(() => {
    if (
      consentStatus === "inactive" &&
      !showConsentDialog &&
      !loading &&
      !hasAutoPrompted
    ) {
      // Only auto-prompt if we've finished loading, confirmed no consent exists, and haven't already prompted
      console.log("🔄 Auto-prompting for data sync consent - no consent found");
      setShowConsentDialog(true);
      setHasAutoPrompted(true);
    }
  }, [consentStatus, showConsentDialog, loading, hasAutoPrompted]);

  // Show message if no account ID
  if (!accountId) {
    return (
      <Box>
        <Typography
          variant="h5"
          sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
        >
          <SyncIcon color="primary" />
          Data Synchronization Management
        </Typography>
        <Alert severity="warning">
          <Typography variant="body2">
            Please connect your wallet to manage data synchronization settings.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const renderConsentStatus = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={20} />
          <Typography>Checking consent status...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (consentStatus === "active" && consentData) {
      return (
        <Box>
          <Alert
            severity={consentData.nftValid ? "success" : "warning"}
            sx={{ mb: 2 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <CheckIcon />
              <Typography variant="subtitle2">
                Data Sync Consent{" "}
                {consentData.nftValid ? "Active" : "Issue Detected"}
              </Typography>
            </Box>
            <Typography variant="body2">
              {consentData.nftValid
                ? "Your genomic data is being synchronized for research purposes."
                : "There may be an issue with your consent NFT. Please contact support if this persists."}
            </Typography>
            {!consentData.nftValid && consentData.nftError && (
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 1, color: "error.main" }}
              >
                Error: {consentData.nftError}
              </Typography>
            )}
          </Alert>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <SyncIcon color="primary" />
                Data Sync Details
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    NFT Token ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {consentData.consentNFTTokenId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Serial Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    #{consentData.consentNFTSerialNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    NFT Status
                  </Typography>
                  <Chip
                    label={
                      consentData.nftValid
                        ? "Valid on Hedera"
                        : "Invalid/Missing"
                    }
                    color={consentData.nftValid ? "success" : "error"}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Database Status
                  </Typography>
                  <Chip
                    label={consentData.dbIsActive ? "Active" : "Inactive"}
                    color={consentData.dbIsActive ? "success" : "default"}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Valid From
                  </Typography>
                  <Typography variant="body2">
                    {new Date(consentData.validFrom).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Valid Until
                  </Typography>
                  <Typography variant="body2">
                    {new Date(consentData.validUntil).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setShowRevokeDialog(true)}
                disabled={loading}
                fullWidth
              >
                Revoke Data Sync Consent
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    }

    if (consentStatus === "inactive") {
      return (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <SyncDisabledIcon />
              <Typography variant="subtitle2">Data Sync Not Active</Typography>
            </Box>
            <Typography variant="body2">
              Your genomic data is not being synchronized. Please review the
              consent dialog to enable data sync.
            </Typography>
          </Alert>

          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <SecurityIcon color="primary" />
                Data Synchronization Setup
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                A consent dialog will appear to help you set up data
                synchronization for your genomic data.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                If the dialog doesn't appear automatically, you can:
              </Typography>

              <Button
                variant="outlined"
                color="primary"
                startIcon={<SyncIcon />}
                onClick={() => setShowConsentDialog(true)}
                disabled={loading}
                fullWidth
              >
                Open Consent Dialog
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
      >
        <SyncIcon color="primary" />
        Data Synchronization Management
      </Typography>

      {renderConsentStatus()}

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={showRevokeDialog}
        onClose={() => setShowRevokeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon color="warning" />
          Revoke Data Sync Consent
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> Revoking data sync consent will stop
              synchronization of your genomic data and may affect your
              participation in ongoing research studies.
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for revoking your consent (optional):
          </Typography>

          <Box
            component="textarea"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="e.g., Privacy concerns, no longer interested in research participation..."
            sx={{
              width: "100%",
              minHeight: 80,
              p: 1,
              border: "1px solid #ccc",
              borderRadius: 1,
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: "0.875rem",
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setShowRevokeDialog(false)}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={revokeConsent}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} /> : <CancelIcon />
            }
          >
            {loading ? "Revoking..." : "Revoke Consent"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Sync Consent Dialog */}
      <DataSyncConsentDialog
        open={showConsentDialog}
        onClose={() => setShowConsentDialog(false)}
        onConsent={handleConsentAccept}
        onDecline={handleConsentDecline}
        loading={consentLoading}
        userData={userData}
      />
    </Box>
  );
};

export default DataSyncManagement;
