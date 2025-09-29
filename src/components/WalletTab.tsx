import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import { Image as NFTIcon } from "@mui/icons-material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { apiService, NFT } from "../services/api";
import TokenAssociationDialog from "./TokenAssociationDialog";

const WalletTab: React.FC = () => {
  const { walletInterface, accountId } = useWalletInterface();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incentiveAssociationInfo, setIncentiveAssociationInfo] =
    useState<any>(null);
  const [associationDialogOpen, setAssociationDialogOpen] = useState(false);
  const [associating] = useState(false);

  // Load user data when wallet connects
  useEffect(() => {
    if (walletInterface && accountId) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletInterface, accountId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load incentive balance
      try {
        const balance = await apiService.getIncentiveBalance(
          accountId as string,
        );
        setTokenBalance(balance.balance);
      } catch (err) {
        console.log("Could not load incentive balance:", err);
        setTokenBalance(0);
      }

      // Load incentive association info
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_ROOT}/incentives/association-info/${accountId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setIncentiveAssociationInfo(data);
        }
      } catch (err) {
        console.log("Could not load incentive association info:", err);
      }

      // Load real consent and passport NFTs
      try {
        const consentsResponse = await fetch(
          `${process.env.REACT_APP_API_ROOT}/consent?patientId=${accountId}&includeRevoked=true`,
        );
        if (consentsResponse.ok) {
          const consentsData = await consentsResponse.json();
          const realNFTs: NFT[] = consentsData.consents
            .filter(
              (consent: any) =>
                consent.consentNFTTokenId && consent.consentNFTSerialNumber,
            )
            .map((consent: any) => ({
              tokenId: consent.consentNFTTokenId,
              serialNumber: consent.consentNFTSerialNumber,
              type:
                consent.consentType === "genomic_passport"
                  ? "passport"
                  : "consent",
              name:
                consent.consentType === "genomic_passport"
                  ? "RDZ Passport"
                  : "Consent NFT",
              description:
                consent.consentType === "genomic_passport"
                  ? "Genomic data ownership proof"
                  : `Consent for ${consent.consentType.replace("_", " ")}`,
              transactionId: consent.consentNFTTransactionId,
              status: consent.consentStatus,
              validFrom: consent.validFrom,
              validUntil: consent.validUntil,
              revokedAt: consent.revokedAt,
              revocationReason: consent.revocationReason,
            }));
          setNfts(realNFTs);
        }
      } catch (err) {
        console.log("Could not load NFTs:", err);
        setNfts([]);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load wallet data");
      setLoading(false);
    }
  };

  // This component assumes wallet is already connected (handled by AuthPage)
  if (!walletInterface || !accountId) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
          Wallet
        </Typography>

        <Card sx={{ p: 3, textAlign: "center", borderRadius: 4 }}>
          <NFTIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Wallet Not Connected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please connect your wallet from the authentication page
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{ mb: 3, fontWeight: "bold", color: "#0d0d0d" }}
      >
        Wallet
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Wallet Status */}
      <Card sx={{ p: 2, mb: 2, borderRadius: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Hedera Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {accountId}
            </Typography>
          </Box>
          <Chip
            label="Connected"
            sx={{
              backgroundColor: "#37C9A450",
              border: "1px solid #37C9A4",
              color: "#0E1133",
              borderRadius: 3,
              fontWeight: "500",
              fontSize: "0.7rem",
              height: "24px",
              width: "100px",
            }}
          />
        </Box>
      </Card>

      {/* RDZ Token Balance */}
      <Card sx={{ p: 2, mb: 2, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          RDZ Token Balance
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h4" color="primary">
            {loading ? <CircularProgress size={32} /> : `${tokenBalance} RDZ`}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          RDZ tokens earned from actions in the application
        </Typography>

        {/* Association Status and Button */}
        {incentiveAssociationInfo && (
          <Box sx={{ mt: 2 }}>
            {incentiveAssociationInfo.associationRequired ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Association Required:</strong> To receive RDZ
                  incentive tokens, you must associate your wallet with the RDZ
                  token.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => setAssociationDialogOpen(true)}
                  disabled={associating}
                >
                  {associating ? (
                    <CircularProgress size={16} />
                  ) : (
                    "Associate with RDZ Token"
                  )}
                </Button>
              </Alert>
            ) : (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Associated:</strong> Your wallet is associated with
                  RDZ token. You can receive incentive tokens!
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </Card>

      {/* My NFTs */}
      <Card sx={{ p: 2, mb: 2, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          My NFTs ({nfts.length})
        </Typography>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress />
          </Box>
        ) : nfts.length > 0 ? (
          <List>
            {nfts.map((nft, index) => (
              <React.Fragment key={`${nft.tokenId}-${nft.serialNumber}`}>
                <ListItem>
                  {/* <ListItemIcon>{getNFTIcon(nft.type)}</ListItemIcon> */}
                  <ListItemText
                    primary={
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Typography variant="body1">{nft.name}</Typography>
                          <Chip
                            label={
                              nft.status === "granted"
                                ? "Active"
                                : nft.status === "revoked"
                                  ? "Revoked"
                                  : nft.status
                            }
                            sx={{
                              backgroundColor:
                                nft.status === "granted"
                                  ? "#37C9A450"
                                  : nft.status === "revoked"
                                    ? "#C9373950"
                                    : "#0E113350",
                              border: `1px solid ${
                                nft.status === "granted"
                                  ? "#37C9A4"
                                  : nft.status === "revoked"
                                    ? "#C93739"
                                    : "#0E1133"
                              }`,
                              color: "#0E1133",
                              borderRadius: 3,
                              fontWeight: "400",
                              fontSize: "0.7rem",
                              height: "24px",
                              width: "100px",
                            }}
                            size="small"
                          />
                        </Stack>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {nft.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Token ID: {nft.tokenId} | Serial: {nft.serialNumber}
                        </Typography>
                        {nft.validFrom && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Valid:{" "}
                            {new Date(nft.validFrom).toLocaleDateString()}
                            {nft.validUntil &&
                              ` - ${new Date(nft.validUntil).toLocaleDateString()}`}
                          </Typography>
                        )}
                        {nft.revokedAt && (
                          <Typography
                            variant="caption"
                            color="error"
                            display="block"
                          >
                            Revoked:{" "}
                            {new Date(nft.revokedAt).toLocaleDateString()}
                            {nft.revocationReason &&
                              ` - ${nft.revocationReason}`}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < nfts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", p: 2 }}
          >
            No NFTs found. Create consent to mint your first NFT!
          </Typography>
        )}
      </Card>

      {/* Info Card */}
      <Card
        sx={{
          p: 2,
          mb: 2,
          bgcolor: "info.light",
          color: "info.contrastText",
          borderRadius: 4,
        }}
      >
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          💡 <strong>Tip:</strong> View your complete transaction history and
          activity log in the <strong>Activity</strong> tab
        </Typography>
      </Card>

      {/* Refresh Button */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button
          variant="outlined"
          onClick={loadUserData}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? "Refreshing..." : "Refresh Wallet Data"}
        </Button>
      </Box>

      {/* Token Association Dialog */}
      {accountId && (
        <TokenAssociationDialog
          open={associationDialogOpen}
          onClose={() => setAssociationDialogOpen(false)}
          accountId={accountId}
          tokenId={incentiveAssociationInfo?.tokenId || "0.0.6905402"}
          onAssociationComplete={() => {
            // Reload association info after completion
            loadUserData();
          }}
        />
      )}
    </Box>
  );
};

export default WalletTab;
