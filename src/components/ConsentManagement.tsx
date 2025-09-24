import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Image as NFTIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { Consent } from "../services/api";

interface ConsentManagementProps {
  walletInterface: any;
}

const ConsentManagement: React.FC<ConsentManagementProps> = ({
  walletInterface,
}) => {
  const { accountId } = useWalletInterface();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<any>(null);

  useEffect(() => {
    if (accountId) {
      loadConsents();
    }
  }, [accountId]);

  // Predefined consent types that users can enable/disable
  const predefinedConsentTypes = [
    {
      consentId: "genomic-research",
      consentType: "genomic_analysis", // Use valid enum value
      name: "Medical Research Participation",
      description:
        "Share genomic data for medical research and drug development",
      detailedDescription:
        "This consent allows researchers to use your genomic data to advance medical knowledge, develop new treatments, and understand genetic diseases. Your data will be anonymized and used only for legitimate research purposes.",
      dataTypes: ["whole_genome", "exome", "targeted_panel"], // Use valid enum values
      purposes: ["research", "drug_development", "population_studies"], // Use valid enum values
      defaultStatus: "pending",
      nftTokenId: null,
      nftSerialNumber: null,
      nftTransactionId: null,
    },
    {
      consentId: "genomic-passport",
      consentType: "genomic_passport", // New genomic passport type
      name: "RDZ Passport",
      description:
        "Create your RDZ Passport NFT proving ownership of your genomic data",
      detailedDescription:
        "This creates your unique RDZ Passport NFT that serves as proof of ownership of your genomic data. Your RDZ Passport acts as an identity badge that proves you have genomic data stored and controlled off-chain. The NFT does not contain your actual genomic data, just cryptographic proof of ownership.",
      dataTypes: ["genomic_passport"], // Use valid enum values
      purposes: ["data_ownership_proof"], // Use valid enum values
      defaultStatus: "pending",
      nftTokenId: null,
      nftSerialNumber: null,
      nftTransactionId: null,
    },
  ];

  const loadConsents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch consents for the logged-in user (including revoked ones)
      const response = await fetch(
        `http://localhost:5000/api/consent?patientId=${accountId}&includeRevoked=true`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const fetchedConsents = data.consents || [];

      // Merge with predefined types, prioritizing fetched status
      const mergedConsents = predefinedConsentTypes.map((predefined) => {
        const existing = fetchedConsents.find(
          (c: any) => c.consentType === predefined.consentType,
        );

        if (existing) {
          console.log(
            `Found existing consent for ${predefined.consentType}:`,
            existing,
          );
        }

        return {
          ...predefined,
          patientId: accountId || "0.0.6881057", // Ensure patientId is set and not null
          consentStatus: existing
            ? existing.consentStatus
            : predefined.defaultStatus,
          consentNFTTokenId: existing
            ? existing.consentNFTTokenId
            : predefined.nftTokenId,
          consentNFTSerialNumber: existing
            ? existing.consentNFTSerialNumber
            : predefined.nftSerialNumber,
          consentNFTTransactionId: existing
            ? existing.consentNFTTransactionId
            : predefined.nftTransactionId,
          // Add additional fields from database
          consentId: existing ? existing.consentId : predefined.consentId,
          validFrom: existing ? existing.validFrom : new Date().toISOString(),
          validUntil: existing
            ? existing.validUntil
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          consentHash: existing ? existing.consentHash : undefined,
          revokedAt: existing ? existing.revokedAt : undefined,
          revocationReason: existing ? existing.revocationReason : undefined,
          revokedBy: existing ? existing.revokedBy : undefined,
          revocationTransactionId: existing
            ? existing.revocationTransactionId
            : undefined,
          isActive: existing ? existing.isActive : true,
          updatedAt: existing ? existing.updatedAt : undefined,
        };
      });

      setConsents(mergedConsents);
    } catch (err) {
      setError("Failed to load consents");
      console.error("Error loading consents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentToggle = async (consent: Consent, newStatus: boolean) => {
    if (newStatus) {
      // Check if this is a revoked consent that needs re-enabling
      if (consent.consentStatus === "revoked") {
        // For revoked consents, we create a new consent instead of reactivating
        setSelectedConsent({
          ...consent,
          consentId: `${consent.consentId}-${Date.now()}`, // New unique ID
          consentStatus: "pending", // Reset status
        });
        setShowConsentDialog(true);
      } else {
        // Show consent dialog for enabling new consent
        setSelectedConsent(consent);
        setShowConsentDialog(true);
      }
    } else {
      // Directly disable consent
      await disableConsent(consent);
    }
  };

  const handleAcceptConsent = async () => {
    if (!selectedConsent) return;

    try {
      setProcessing(selectedConsent.consentId);
      setError(null);
      setSuccess(null);
      setShowConsentDialog(false);

      // Check if this is a genomic passport (requires wallet signing)
      if (selectedConsent.consentType === "genomic_passport") {
        // For genomic passport, user must sign the transaction
        const passportResult = await signGenomicPassportTransaction();

        console.log(
          "✅ Genomic passport NFT minted and transferred:",
          passportResult,
        );

        // Log activity as data type (genomic passport creation)
        await logPassportActivity(selectedConsent, "created");

        setSuccess(
          `RDZ Passport NFT ${passportResult.tokenIdStr}#${passportResult.serial} created successfully.`,
        );

        // Reload consents to reflect changes
        await loadConsents();
        return;
      }

      // Regular consent flow (requires wallet signing)
      // Step 1: Sign transaction with user wallet FIRST
      const mintResult = await signTransactionWithWallet();

      console.log("NFT minted and transferred:", mintResult);

      // Log activity
      await logConsentActivity(selectedConsent, "granted");

      setSuccess(
        `Consent enabled and NFT ${mintResult.tokenIdStr}#${mintResult.serial} issued.`,
      );

      // Reload consents to reflect changes
      await loadConsents();
    } catch (err: any) {
      setError(err.message || "Failed to enable consent. Please try again.");
      console.error("Consent enable error:", err);
    } finally {
      setProcessing(null);
      setSelectedConsent(null);
    }
  };

  const signGenomicPassportTransaction = async () => {
    try {
      console.log("🔐 Opening wallet to sign genomic passport transaction...");

      const activeWalletInterface = walletInterface;

      if (!activeWalletInterface) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first.",
        );
      }

      // Use native HTS NFT flow for RDZ Passport
      const { TokenId } = await import("@hashgraph/sdk");
      const passportTokenId = TokenId.fromString("0.0.6886170");

      console.log("📱 Wallet should now open for RDZ Passport creation...");
      console.log("📋 RDZ Passport creation details:", {
        tokenId: passportTokenId.toString(),
        purpose: "Create RDZ Passport - Genomic Data Ownership Proof",
        type: "genomic_passport",
        description:
          "Create your unique RDZ Passport NFT that proves ownership of your genomic data",
        action: "RDZ Passport Creation (Token Association Required)",
      });

      const associationTransactionId =
        await activeWalletInterface.associateToken(passportTokenId);

      if (!associationTransactionId) {
        throw new Error("Token association failed or was rejected.");
      }

      console.log("✅ Token association successful:", associationTransactionId);

      // Call backend to mint and transfer the genomic passport NFT
      const passportResponse = await fetch(
        "http://localhost:5000/api/consent/genomic-passport",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accountId }),
        },
      );

      if (!passportResponse.ok) {
        const errorText = await passportResponse.text();
        throw new Error(`Backend error: ${errorText}`);
      }

      const passportResult = await passportResponse.json();
      console.log(
        "✅ Genomic passport NFT minted and transferred:",
        passportResult,
      );

      return passportResult;
    } catch (error) {
      console.error("Error signing genomic passport transaction:", error);
      throw error;
    }
  };

  const signTransactionWithWallet = async () => {
    try {
      console.log("🔐 Opening wallet to sign consent contract transaction...");

      const activeWalletInterface = walletInterface;

      if (!activeWalletInterface) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first.",
        );
      }

      // Use native HTS NFT flow for consent
      const { TokenId } = await import("@hashgraph/sdk");
      const consentTokenId = TokenId.fromString("0.0.6886067");

      console.log("📱 Wallet should now open for token association...");
      console.log("📋 Token association details:", {
        tokenId: consentTokenId.toString(),
        purpose: "Associate with Consent NFT Collection",
        type: selectedConsent?.consentType,
        description: selectedConsent?.description,
        action: "Token Association (required before receiving NFTs)",
      });

      // Step 1: User associates with the Consent NFT token
      const associationTransactionId =
        await activeWalletInterface.associateToken(consentTokenId);

      if (!associationTransactionId) {
        throw new Error("Token association failed");
      }

      console.log("✅ Token association successful:", associationTransactionId);

      // Step 2: Backend mints NFT with consent metadata and transfers to user
      console.log(
        "🔄 Backend will now mint consent NFT and transfer to user...",
      );

      // Call backend to mint and transfer the NFT
      const body = {
        accountId, // receiver (user)
        consentId: selectedConsent.consentId,
        consentType: selectedConsent.consentType,
        dataTypes: selectedConsent.dataTypes,
        purposes: selectedConsent.purposes,
        validFrom: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      const mintResponse = await fetch(
        "http://localhost:5000/api/consent/mint-and-transfer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!mintResponse.ok) {
        const errorText = await mintResponse.text();
        throw new Error(`Backend error: ${errorText}`);
      }

      const mintResult = await mintResponse.json();
      console.log("✅ Consent NFT minted and transferred:", mintResult);

      // Return the mint result for the success message
      return mintResult;
    } catch (error) {
      console.error(
        "Failed to sign consent contract transaction with wallet:",
        error,
      );
      throw new Error(
        "Failed to sign consent contract transaction with wallet. Please try again.",
      );
    }
  };

  const disableConsent = async (consent: Consent) => {
    try {
      console.log("Revoking consent:", consent);

      // Call backend to revoke the consent
      const response = await fetch(
        `http://localhost:5000/api/consent/${consent.consentId}/revoke`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: "User requested revocation",
            revokedBy: accountId,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to revoke consent: ${errorText}`);
      }

      const result = await response.json();
      console.log("Consent revoked:", result);

      // Log activity (use appropriate type based on consent type)
      if (consent.consentType === "genomic_passport") {
        await logPassportActivity(consent, "revoked");
      } else {
        await logConsentActivity(consent, "revoked");
      }

      // Reload consents to reflect the change
      await loadConsents();

      setSuccess(
        `Consent for "${consent.consentType}" has been revoked successfully.`,
      );
    } catch (error) {
      console.error("Error revoking consent:", error);
      setError("Failed to revoke consent. Please try again.");
    }
  };

  const logConsentActivity = async (consent: any, action: string) => {
    try {
      const activityData = {
        userId: accountId,
        activityName: `consent_${action}`,
        activityDescription: `${action === "granted" ? "Granted" : "Revoked"} consent for genomic research`,
        activityType: "consent",
        metadata: {
          consentId: consent.consentId,
          consentType: consent.consentType,
          action: action,
        },
      };

      await fetch("http://localhost:5000/api/activities/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityData),
      });
    } catch (err) {
      console.error("Failed to log consent activity:", err);
    }
  };

  const logPassportActivity = async (passport: any, action: string) => {
    try {
      const getActionDescription = (action: string) => {
        switch (action) {
          case "created":
            return "Created RDZ Passport for genomic data ownership";
          case "revoked":
            return "Revoked RDZ Passport for genomic data ownership";
          default:
            return "Updated RDZ Passport for genomic data ownership";
        }
      };

      const activityData = {
        userId: accountId,
        activityName: `rdz_passport_${action}`,
        activityDescription: getActionDescription(action),
        activityType: "data", // Use 'data' type for genomic passport activities
        metadata: {
          passportId: passport.consentId,
          passportType: passport.consentType,
          action: action,
          purpose: "genomic_data_ownership_proof",
        },
      };

      await fetch("http://localhost:5000/api/activities/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityData),
      });
    } catch (err) {
      console.error("Failed to log passport activity:", err);
    }
  };

  const getConsentStatusColor = (status: string) => {
    switch (status) {
      case "granted":
        return "success";
      case "revoked":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getConsentStatusIcon = (status: string) => {
    switch (status) {
      case "granted":
        return <CheckIcon />;
      case "revoked":
        return <CancelIcon />;
      case "pending":
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (!accountId) {
    return (
      <Card sx={{ p: 3, textAlign: "center" }}>
        <WarningIcon sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
          Wallet Not Connected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please connect your wallet to manage consent NFTs
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", mb: 1, color: "text.primary" }}
        >
          Consent Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enable or disable predefined consent types for your genomic data
          sharing
        </Typography>
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Consent List */}
      {!loading && consents.length === 0 && (
        <Card sx={{ p: 3, textAlign: "center" }}>
          <SecurityIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
            No Consent Types Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consent types will be loaded when your wallet is connected
          </Typography>
        </Card>
      )}

      {/* Consent Cards */}
      {!loading && consents.length > 0 && (
        <Grid container spacing={2}>
          {consents.map((consent) => (
            <Grid item xs={12} key={consent.consentId}>
              <Card sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 1, color: "text.primary", fontWeight: "bold" }}
                    >
                      {predefinedConsentTypes.find(
                        (ct) => ct.consentId === consent.consentId,
                      )?.name ||
                        consent.consentType.replace("_", " ").toUpperCase()}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {predefinedConsentTypes.find(
                        (ct) => ct.consentId === consent.consentId,
                      )?.description ||
                        "Manage your consent for this data type"}
                    </Typography>
                    <Chip
                      icon={getConsentStatusIcon(consent.consentStatus)}
                      label={consent.consentStatus.toUpperCase()}
                      color={
                        getConsentStatusColor(consent.consentStatus) as any
                      }
                      size="small"
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={consent.consentStatus === "granted"}
                        onChange={(e) =>
                          handleConsentToggle(consent, e.target.checked)
                        }
                        disabled={processing === consent.consentId}
                        color={
                          consent.consentStatus === "revoked"
                            ? "warning"
                            : "success"
                        }
                      />
                    }
                    label={
                      consent.consentStatus === "granted"
                        ? "Enabled"
                        : consent.consentStatus === "revoked"
                          ? "Re-enable"
                          : "Disabled"
                    }
                    labelPlacement="start"
                  />
                </Box>

                {/* NFT Information */}
                {consent.consentNFTTokenId && (
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: "grey.50",
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <NFTIcon sx={{ mr: 1, color: "primary.main" }} />
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold", color: "text.primary" }}
                      >
                        {consent.consentType === "genomic_passport"
                          ? "RDZ Passport NFT"
                          : "Consent NFT"}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Token ID: {consent.consentNFTTokenId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Serial: {consent.consentNFTSerialNumber}
                    </Typography>
                  </Paper>
                )}

                {/* Consent Details */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", mb: 1, color: "text.primary" }}
                    >
                      Data Types
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {consent.dataTypes.map((type, index) => (
                        <Chip
                          key={index}
                          label={type.replace("_", " ")}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "primary.main",
                            color: "primary.main",
                            "&:hover": {
                              backgroundColor: "primary.light",
                              color: "white",
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", mb: 1, color: "text.primary" }}
                    >
                      Purposes
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {consent.purposes.map((purpose, index) => (
                        <Chip
                          key={index}
                          label={purpose.replace("_", " ")}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "secondary.main",
                            color: "secondary.main",
                            "&:hover": {
                              backgroundColor: "secondary.light",
                              color: "white",
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Show validity period if consent is granted */}
                  {consent.consentStatus === "granted" &&
                    consent.validUntil && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: "bold",
                              mb: 1,
                              color: "text.primary",
                            }}
                          >
                            Valid Until
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(consent.validUntil).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: "bold",
                              mb: 1,
                              color: "text.primary",
                            }}
                          >
                            Consent Hash
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                              wordBreak: "break-all",
                            }}
                          >
                            {consent.consentHash
                              ? `${consent.consentHash.substring(0, 16)}...`
                              : "Not available"}
                          </Typography>
                        </Grid>
                      </>
                    )}

                  {/* Show revocation info if consent is revoked */}
                  {consent.consentStatus === "revoked" && (
                    <>
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            <strong>Consent Revoked:</strong> This consent has
                            been permanently revoked. You can create a new
                            consent by toggling the switch above, which will
                            mint a new NFT while keeping this revocation record
                            for audit purposes.
                          </Typography>
                        </Alert>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: "bold",
                            mb: 1,
                            color: "error.main",
                          }}
                        >
                          Revoked At
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {consent.revokedAt
                            ? new Date(consent.revokedAt).toLocaleDateString()
                            : "Unknown"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: "bold",
                            mb: 1,
                            color: "error.main",
                          }}
                        >
                          Revocation Reason
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {consent.revocationReason ||
                            "User requested revocation"}
                        </Typography>
                      </Grid>
                      {consent.revocationTransactionId && (
                        <Grid item xs={12}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: "bold",
                              mb: 1,
                              color: "error.main",
                            }}
                          >
                            Revocation Transaction
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                              wordBreak: "break-all",
                            }}
                          >
                            {consent.revocationTransactionId}
                          </Typography>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>

                {/* Processing Indicator */}
                {processing === consent.consentId && (
                  <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                    <CircularProgress
                      size={16}
                      sx={{ mr: 1, color: "primary.main" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Processing...
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Consent Dialog */}
      <Dialog
        open={showConsentDialog}
        onClose={() => setShowConsentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h6" sx={{ color: "text.primary" }}>
              Consent Agreement
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedConsent && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
                {selectedConsent.name}
              </Typography>

              <Typography
                variant="body1"
                sx={{ mb: 3, color: "text.secondary" }}
              >
                {selectedConsent.detailedDescription}
              </Typography>

              <Typography
                variant="subtitle2"
                sx={{ mb: 1, color: "text.primary", fontWeight: "bold" }}
              >
                Data Types Covered:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                {selectedConsent.dataTypes.map(
                  (type: string, index: number) => (
                    <Chip
                      key={index}
                      label={type.replace("_", " ")}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ),
                )}
              </Box>

              <Typography
                variant="subtitle2"
                sx={{ mb: 1, color: "text.primary", fontWeight: "bold" }}
              >
                Purposes:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 3 }}>
                {selectedConsent.purposes.map(
                  (purpose: string, index: number) => (
                    <Chip
                      key={index}
                      label={purpose.replace("_", " ")}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  ),
                )}
              </Box>

              {selectedConsent?.consentType === "genomic_passport" ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>RDZ Passport Creation:</strong> This will create
                    your unique RDZ Passport NFT that serves as proof of
                    ownership of your genomic data. Your RDZ Passport acts as an
                    identity badge that proves you have genomic data stored and
                    controlled off-chain. The NFT does not contain your actual
                    genomic data, just cryptographic proof of ownership.
                    <br />
                    <br />
                    <strong>Wallet Signing Required:</strong> You will need to
                    sign a "RDZ Passport Creation" transaction (Token ID:
                    0.0.6886170) to create your genomic passport.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    By accepting this consent, you will sign a transaction on
                    the Hedera blockchain that represents your consent. This
                    provides a permanent, auditable record of your agreement.
                    Your wallet will open to sign the transaction.
                  </Typography>
                </Alert>
              )}

              {processing === selectedConsent?.consentId && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Please check your wallet!</strong> A transaction has
                    been sent to your connected wallet.
                    {selectedConsent?.consentType === "genomic_passport"
                      ? 'The transaction will show "RDZ Passport Creation" (Token ID: 0.0.6886170) for your genomic passport. Please approve to complete the passport creation process.'
                      : 'The transaction will show "RDZ Consent" (Token ID: 0.0.6886067) for the consent NFT. Please approve to complete the consent process.'}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConsentDialog(false)}
            disabled={processing === selectedConsent?.consentId}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcceptConsent}
            variant="contained"
            disabled={processing === selectedConsent?.consentId}
            startIcon={
              processing === selectedConsent?.consentId ? (
                <CircularProgress size={20} />
              ) : (
                <CheckIcon />
              )
            }
          >
            {processing === selectedConsent?.consentId
              ? selectedConsent?.consentType === "genomic_passport"
                ? "Creating RDZ Passport..."
                : "Creating Consent NFT..."
              : selectedConsent?.consentType === "genomic_passport"
                ? "Create RDZ Passport NFT"
                : selectedConsent?.consentId?.includes("-")
                  ? "Re-enable & Create New Consent NFT"
                  : "Accept & Create Consent NFT"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsentManagement;
