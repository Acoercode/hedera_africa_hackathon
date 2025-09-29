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
import { HEDERA_CONFIG } from "../config/constants";

interface ConsentManagementProps {
  walletInterface: any;
  autoOpenDataSyncConsent?: boolean;
  onDataSyncConsentOpened?: () => void;
  onConsentCreated?: () => void;
}

const ConsentManagement: React.FC<ConsentManagementProps> = ({
  walletInterface,
  autoOpenDataSyncConsent,
  onDataSyncConsentOpened,
  onConsentCreated,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  useEffect(() => {
    if (autoOpenDataSyncConsent && onDataSyncConsentOpened) {
      const dataSyncConsent = predefinedConsentTypes.find(
        (consent) => consent.consentType === "data_sync",
      );
      if (dataSyncConsent) {
        setSelectedConsent(dataSyncConsent);
        setShowConsentDialog(true);
        onDataSyncConsentOpened();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenDataSyncConsent, onDataSyncConsentOpened]);

  const predefinedConsentTypes = [
    {
      consentId: "data-sync",
      consentType: "data_sync",
      name: "Data Synchronization",
      description:
        "Enable data synchronization of your genomic data into the RDZ platform",
      detailedDescription:
        "This consent allows your genomic data to be synchronized across research platforms and enables you to participate in ongoing and future research studies. You will receive updates about research findings related to your genomic profile.",
      dataTypes: [
        "whole_genome",
        "exome",
        "targeted_panel",
        "rna_seq",
        "methylation",
      ],
      purposes: [
        "data_synchronization",
        "platform_integration",
        "research_notifications",
      ],
      defaultStatus: "pending",
      nftTokenId: null,
      nftSerialNumber: null,
      nftTransactionId: null,
    },
    {
      consentId: "genomic-research",
      consentType: "genomic_analysis",
      name: "Medical Research Participation",
      description:
        "Allow approved studies to use your genomic data for medical research and drug development.",
      detailedDescription:
        "This consent allows researchers to use your genomic data to advance medical knowledge, develop new treatments, and understand genetic diseases. Your data will be anonymized and used only for legitimate research purposes.",
      dataTypes: [
        "anonymized_variants",
        "gene_level_summaries",
        "phenotype_tags",
        "de_identified_demographics",
        "aggregate_stats",
      ],
      purposes: [
        "irb_approved_studies",
        "genetic_association",
        "drug_biomarker_discovery",
        "population_genomics",
        "method_validation",
      ],
      defaultStatus: "pending",
      nftTokenId: null,
      nftSerialNumber: null,
      nftTransactionId: null,
    },
    {
      consentId: "genomic-passport",
      consentType: "genomic_passport",
      name: "RDZ Passport",
      description:
        "Create your RDZ Health Passport NFT proving ownership of your genomic data, without sharing data.",
      detailedDescription:
        "This creates your unique RDZ Passport NFT that serves as proof of ownership of your genomic data. Your RDZ Passport acts as an identity badge that proves you have genomic data stored and controlled off-chain. The NFT does not contain your actual genomic data, just cryptographic proof of ownership.",
      dataTypes: ["genomic_passport", "ownership_proof", "data_hash"],
      purposes: [
        "data_ownership_proof",
        "identity_verification",
        "access_control",
      ],
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
        `${process.env.REACT_APP_API_ROOT}/consent?patientId=${accountId}&includeRevoked=true`,
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
          // Found existing consent
        }

        const mergedConsent = {
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

        return mergedConsent;
      });

      setConsents(mergedConsents);
    } catch (err) {
      setError("Something went wrong, try again");
      console.error("Error loading consents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentToggle = async (consent: Consent, newStatus: boolean) => {
    if (newStatus) {
      if (consent.consentStatus === "revoked") {
        setSelectedConsent({
          ...consent,
          consentId: `${consent.consentId}-${Date.now()}`,
          consentStatus: "pending",
        });
        setShowConsentDialog(true);
      } else {
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

      if (selectedConsent.consentType === "genomic_passport") {
        const passportResult = await signGenomicPassportTransaction();
        await logPassportActivity(selectedConsent, "created");

        const incentiveInfo = passportResult.incentive
          ? ` You earned ${passportResult.incentive.amount} RDZ incentive tokens!`
          : "";
        setSuccess(
          `Genomic passport NFT ${passportResult.passport.consentNFTTokenId}#${passportResult.passport.consentNFTSerialNumber} created successfully.${incentiveInfo}`,
        );

        await loadConsents();

        if (onConsentCreated) {
          onConsentCreated();
        }

        return;
      } else if (selectedConsent.consentType === "data_sync") {
        const dataSyncResult = await signDataSyncTransaction();
        await logConsentActivity(selectedConsent, "created");

        let incentiveInfo = "";
        if (dataSyncResult.data.incentive) {
          if (dataSyncResult.data.incentive.success) {
            incentiveInfo = ` You earned ${dataSyncResult.data.incentive.amount} RDZ incentive tokens!`;
          } else if (dataSyncResult.data.incentive.requiresAssociation) {
            incentiveInfo = `\n\nTo earn ${dataSyncResult.data.incentive.amount} RDZ tokens:\n1. Go to the Wallet tab\n2. Click 'Associate with RDZ Token'\n3. Sign the transaction in your wallet\n4. Return here to receive your tokens!`;
          }
        }
        setSuccess(
          `Data sync consent NFT ${dataSyncResult.data.consentNFTTokenId}#${dataSyncResult.data.consentNFTSerialNumber} created successfully.${incentiveInfo}`,
        );

        await loadConsents();

        if (onConsentCreated) {
          onConsentCreated();
        }

        return;
      }

      const mintResult = await signTransactionWithWallet();
      await logConsentActivity(selectedConsent, "granted");

      const incentiveInfo = mintResult.incentive
        ? ` You earned ${mintResult.incentive.amount} RDZ incentive tokens!`
        : "";
      setSuccess(
        `Consent enabled and NFT ${mintResult.consentNFTTokenId}#${mintResult.consentNFTSerialNumber} issued.${incentiveInfo}`,
      );

      await loadConsents();
    } catch (err: any) {
      setError("Something went wrong, try again");
      console.error("Consent enable error:", err);
    } finally {
      setProcessing(null);
      setSelectedConsent(null);
    }
  };

  const signGenomicPassportTransaction = async () => {
    try {
      const activeWalletInterface = walletInterface;

      if (!activeWalletInterface) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first.",
        );
      }

      const { TokenId } = await import("@hashgraph/sdk");
      const passportTokenId = TokenId.fromString(
        HEDERA_CONFIG.PASSPORT_NFT_TOKEN_ID,
      );

      const associationTransactionId =
        await activeWalletInterface.associateToken(passportTokenId);

      if (!associationTransactionId) {
        throw new Error("Token association failed or was rejected.");
      }

      const passportResponse = await fetch(
        `${process.env.REACT_APP_API_ROOT}/consent/genomic-passport`,
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

      return passportResult;
    } catch (error) {
      console.error("Error signing genomic passport transaction:", error);
      throw error;
    }
  };

  const signDataSyncTransaction = async () => {
    try {
      const activeWalletInterface = walletInterface;

      if (!activeWalletInterface) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first.",
        );
      }

      const { TokenId } = await import("@hashgraph/sdk");
      const dataSyncTokenId = TokenId.fromString(
        HEDERA_CONFIG.DATA_SYNC_NFT_TOKEN_ID,
      );

      const associationTransactionId =
        await activeWalletInterface.associateToken(dataSyncTokenId);

      if (!associationTransactionId) {
        throw new Error("Token association failed or was rejected.");
      }

      const dataSyncResponse = await fetch(
        `${process.env.REACT_APP_API_ROOT}/consent/data-sync`,
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

      const dataSyncResult = await dataSyncResponse.json();

      return dataSyncResult;
    } catch (error) {
      console.error("Error signing data sync transaction:", error);
      throw error;
    }
  };

  const signTransactionWithWallet = async () => {
    try {
      const activeWalletInterface = walletInterface;

      if (!activeWalletInterface) {
        throw new Error(
          "Wallet not connected. Please connect your wallet first.",
        );
      }

      const { TokenId } = await import("@hashgraph/sdk");
      const consentTokenId = TokenId.fromString(
        HEDERA_CONFIG.RESEARCH_CONSENT_NFT_TOKEN_ID,
      );

      const associationTransactionId =
        await activeWalletInterface.associateToken(consentTokenId);

      if (!associationTransactionId) {
        throw new Error("Token association failed");
      }

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
        `${process.env.REACT_APP_API_ROOT}/consent/mint-and-transfer`,
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
      const response = await fetch(
        `${process.env.REACT_APP_API_ROOT}/consent/${consent.consentId}/revoke`,
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

      if (consent.consentType === "genomic_passport") {
        await logPassportActivity(consent, "revoked");
      } else {
        await logConsentActivity(consent, "revoked");
      }

      await loadConsents();

      setSuccess(
        `Consent for "${predefinedConsentTypes.find((ct) => ct.consentType === consent.consentType)?.name || consent.consentType}" has been revoked successfully.`,
      );

      if (onConsentCreated) {
        onConsentCreated();
      }
    } catch (error) {
      console.error("Error revoking consent:", error);
      setError("Something went wrong, try again");
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

      await fetch(`${process.env.REACT_APP_API_ROOT}/activities/create`, {
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
        activityType: "data",
        metadata: {
          passportId: passport.consentId,
          passportType: passport.consentType,
          action: action,
          purpose: "genomic_data_ownership_proof",
        },
      };

      await fetch(`${process.env.REACT_APP_API_ROOT}/activities/create`, {
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
          sx={{
            fontWeight: "bold",
            mb: 1,
            color: "#0E1133",
            fontSize: "1.3rem",
          }}
        >
          Data Sharing & Consent
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#666666",
            fontSize: "0.9rem",
          }}
        >
          Manage who can use your data. Turn sharing on or off; each change is
          saved on Hedera with a Consent NFT in your wallet.
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
              <Card
                sx={{
                  p: 2,
                  borderRadius: 4,
                  boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.06)",
                  border: "1px solid #e8e8e8",
                  backgroundColor: "#ffffff",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box sx={{ flex: 1, pr: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 0.5,
                        color: "#3F37C9",
                        fontWeight: "bold",
                        fontSize: "1rem",
                      }}
                    >
                      {predefinedConsentTypes.find(
                        (ct) => ct.consentType === consent.consentType,
                      )?.name ||
                        consent.consentType.replace("_", " ").toUpperCase()}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, lineHeight: 1.4, fontSize: "0.85rem" }}
                    >
                      {predefinedConsentTypes.find(
                        (ct) => ct.consentType === consent.consentType,
                      )?.description ||
                        "Manage your consent for this data type"}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        icon={getConsentStatusIcon(consent.consentStatus)}
                        label={consent.consentStatus.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor:
                            consent.consentStatus === "granted"
                              ? "#37C9A430"
                              : consent.consentStatus === "pending"
                                ? "#FDAA2B30"
                                : "#ff6b6b30",
                          border: `1px solid ${
                            consent.consentStatus === "granted"
                              ? "#37C9A4"
                              : consent.consentStatus === "pending"
                                ? "#FDAA2B"
                                : "#ff6b6b"
                          }`,
                          color: "#0E1133",
                          fontWeight: "500",
                          borderRadius: 2,
                          fontSize: "0.65rem",
                          height: "20px",
                        }}
                      />
                    </Box>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={consent.consentStatus === "granted"}
                        onChange={(e) =>
                          handleConsentToggle(consent, e.target.checked)
                        }
                        disabled={processing === consent.consentId}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#37C9A4",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
                              backgroundColor: "#37C9A4",
                            },
                        }}
                      />
                    }
                    label=""
                    labelPlacement="start"
                  />
                </Box>

                {/* NFT Information */}
                {consent.consentNFTTokenId && (
                  <Box
                    sx={{
                      p: 1.5,
                      mb: 1.5,
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <NFTIcon sx={{ fontSize: "1rem", color: "#3F37C9" }} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          color: "#0E1133",
                          fontSize: "0.75rem",
                        }}
                      >
                        {consent.consentType === "genomic_passport"
                          ? "RDZ Passport NFT"
                          : "Consent NFT"}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      Token: {consent.consentNFTTokenId} • Serial:{" "}
                      {consent.consentNFTSerialNumber}
                    </Typography>
                  </Box>
                )}

                {/* Data Types and Purposes */}
                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #f0f0f0" }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "600",
                          mb: 1,
                          color: "#666666",
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Data Types
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {consent.dataTypes.map((type, index) => (
                          <Chip
                            key={index}
                            label={type
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                            size="small"
                            sx={{
                              backgroundColor: "#3F37C920",
                              border: "1px solid #3F37C9",
                              color: "#0E1133",
                              borderRadius: 2,
                              fontWeight: "400",
                              fontSize: "0.65rem",
                              height: "22px",
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "600",
                          mb: 1,
                          color: "#666666",
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Purposes
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {consent.purposes.map((purpose, index) => (
                          <Chip
                            key={index}
                            label={purpose
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                            size="small"
                            sx={{
                              backgroundColor: "#37C9A420",
                              border: "1px solid #37C9A4",
                              color: "#0E1133",
                              borderRadius: 2,
                              fontWeight: "400",
                              fontSize: "0.65rem",
                              height: "22px",
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Show validity period if consent is granted */}
                {consent.consentStatus === "granted" && consent.validUntil && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #f0f0f0" }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: "600",
                            mb: 0.5,
                            color: "#666666",
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                          }}
                        >
                          Valid Until
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          {new Date(consent.validUntil).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: "600",
                            mb: 0.5,
                            color: "#666666",
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                          }}
                        >
                          Consent Hash
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.7rem",
                            wordBreak: "break-all",
                          }}
                        >
                          {consent.consentHash
                            ? `${consent.consentHash.substring(0, 12)}...`
                            : "Not available"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Show revocation info if consent is revoked */}
                {consent.consentStatus === "revoked" && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #f0f0f0" }}>
                    <Alert severity="info" sx={{ mb: 1.5, py: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                        <strong>Consent Revoked:</strong> This consent has been
                        permanently revoked. You can create a new consent by
                        toggling the switch above.
                      </Typography>
                    </Alert>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: "600",
                            mb: 0.5,
                            color: "#666666",
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                          }}
                        >
                          Revoked At
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          {consent.revokedAt
                            ? new Date(consent.revokedAt).toLocaleDateString()
                            : "Unknown"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: "600",
                            mb: 0.5,
                            color: "#666666",
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                          }}
                        >
                          Reason
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.8rem" }}
                        >
                          {consent.revocationReason ||
                            "User requested revocation"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

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
                    {HEDERA_CONFIG.PASSPORT_NFT_TOKEN_ID}) to create your
                    genomic passport.
                    <br />
                    <br />
                    <strong>🎁 Incentive Reward:</strong> You will earn 200 RDZ
                    incentive tokens for creating your genomic passport!
                    <br />
                    <br />
                    <strong>💡 Note:</strong> To receive incentive tokens, you
                    must first associate your wallet with the RDZ token
                    (0.0.6894102). If not associated, you'll receive
                    instructions after passport creation.
                  </Typography>
                </Alert>
              ) : selectedConsent?.consentType === "data_sync" ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Data Synchronization Consent:</strong> This will
                    create a Data Sync Consent NFT that enables your genomic
                    data to be synchronized across research platforms. This
                    allows you to participate in ongoing and future research
                    studies and receive updates about research findings related
                    to your genomic profile.
                    <br />
                    <br />
                    <strong>Wallet Signing Required:</strong> You will need to
                    sign a "Data Sync Token Association" transaction (Token ID:
                    {HEDERA_CONFIG.DATA_SYNC_NFT_TOKEN_ID}) to enable data
                    synchronization.
                    <br />
                    <br />
                    <strong>🎁 Incentive Reward:</strong> You will earn 100 RDZ
                    incentive tokens for enabling data synchronization!
                    <br />
                    <br />
                    <strong>💡 Note:</strong> To receive incentive tokens, you
                    must first associate your wallet with the RDZ token
                    (0.0.6894102). If not associated, you'll receive
                    instructions after consent creation.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    By accepting this consent, you will sign a transaction on
                    the Hedera blockchain that represents your consent. This
                    provides a permanent, auditable record of your agreement.
                    Your wallet will open to sign the transaction.
                    <br />
                    <br />
                    <strong>🎁 Incentive Reward:</strong> You will earn 150 RDZ
                    incentive tokens for participating in medical research!
                    <br />
                    <br />
                    <strong>💡 Note:</strong> To receive incentive tokens, you
                    must first associate your wallet with the RDZ token
                    (0.0.6894102). If not associated, you'll receive
                    instructions after consent creation.
                  </Typography>
                </Alert>
              )}

              {processing === selectedConsent?.consentId && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Please check your wallet!</strong> A transaction has
                    been sent to your connected wallet.
                    {selectedConsent?.consentType === "genomic_passport"
                      ? `The transaction will show "RDZ Passport Creation" (Token ID: ${HEDERA_CONFIG.PASSPORT_NFT_TOKEN_ID}) for your genomic passport. Please approve to complete the passport creation process.`
                      : selectedConsent?.consentType === "data_sync"
                        ? `The transaction will show "Data Sync Token Association" (Token ID: ${HEDERA_CONFIG.DATA_SYNC_NFT_TOKEN_ID}) for data synchronization. Please approve to complete the data sync consent process.`
                        : `The transaction will show "RDZ Consent" (Token ID: ${HEDERA_CONFIG.RESEARCH_CONSENT_NFT_TOKEN_ID}) for the consent NFT. Please approve to complete the consent process.`}
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
                : selectedConsent?.consentType === "data_sync"
                  ? "Creating Data Sync Consent..."
                  : "Creating Consent NFT..."
              : selectedConsent?.consentType === "genomic_passport"
                ? "Create RDZ Passport NFT"
                : selectedConsent?.consentType === "data_sync"
                  ? "Enable Data Synchronization"
                  : selectedConsent?.consentId?.includes("-")
                    ? "Enable Medical Research Consent"
                    : "Accept & Create Consent NFT"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsentManagement;
