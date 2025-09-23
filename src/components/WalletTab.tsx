import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Token as TokenIcon,
  Image as NFTIcon,
  History as HistoryIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import {
  apiService,
  NFT,
  Transaction,
  IncentiveBalance,
} from "../services/api";

const WalletTab: React.FC = () => {
  const { walletInterface, accountId } = useWalletInterface();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data when wallet connects
  useEffect(() => {
    if (walletInterface && accountId) {
      loadUserData();
    }
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

      // For now, use mock data since we don't have a full patient setup
      // In a real app, you'd load actual NFTs and transactions from the API
      const mockNFTs: NFT[] = [
        {
          tokenId: "0.0.6882253",
          serialNumber: "1",
          type: "consent",
          name: "Genomic Analysis Consent",
          description: "Consent for whole genome analysis and research",
          transactionId: "0.0.5223762@1758516343.958531342",
        },
      ];

      const mockTransactions: Transaction[] = [
        {
          id: "1",
          type: "consent_created",
          description: "Consent NFT created",
          timestamp: "2024-01-15T10:30:00Z",
          transactionId: "0.0.5223762@1758516343.958531342",
        },
        {
          id: "2",
          type: "token_received",
          amount: 100,
          description: "Received 100 GDI tokens for consent",
          timestamp: "2024-01-15T10:31:00Z",
          transactionId: "0.0.5223762@1758516344.123456789",
        },
      ];

      setNfts(mockNFTs);
      setTransactions(mockTransactions);
      setLoading(false);
    } catch (err) {
      setError("Failed to load wallet data");
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "consent_created":
        return <CheckIcon color="success" />;
      case "data_uploaded":
        return <NFTIcon color="primary" />;
      case "token_received":
        return <TokenIcon color="warning" />;
      default:
        return <HistoryIcon />;
    }
  };

  const getNFTIcon = (type: string) => {
    return type === "consent" ? (
      <CheckIcon color="success" />
    ) : (
      <NFTIcon color="primary" />
    );
  };

  // This component assumes wallet is already connected (handled by AuthPage)
  if (!walletInterface || !accountId) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
          Wallet
        </Typography>

        <Card sx={{ p: 3, textAlign: "center" }}>
          <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
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
      <Card sx={{ p: 2, mb: 2 }}>
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
          <Chip label="Connected" color="success" />
        </Box>
      </Card>

      {/* GDI Token Balance */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          GDI Token Balance
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h4" color="primary">
            {loading ? <CircularProgress size={32} /> : `${tokenBalance} GDI`}
          </Typography>
          <Button variant="outlined" size="small">
            View on Explorer
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Genomic Data Incentive tokens earned from data sharing
        </Typography>
      </Card>

      {/* My NFTs */}
      <Card sx={{ p: 2, mb: 2 }}>
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
              <React.Fragment key={nft.tokenId}>
                <ListItem>
                  <ListItemIcon>{getNFTIcon(nft.type)}</ListItemIcon>
                  <ListItemText
                    primary={nft.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {nft.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Token ID: {nft.tokenId} | Serial: {nft.serialNumber}
                        </Typography>
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

      {/* Transaction History */}
      <Card sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Transactions
        </Typography>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length > 0 ? (
          <List>
            {transactions.map((tx, index) => (
              <React.Fragment key={tx.id}>
                <ListItem>
                  <ListItemIcon>{getTransactionIcon(tx.type)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body1">
                          {tx.description}
                        </Typography>
                        {tx.amount && (
                          <Chip
                            label={`+${tx.amount} GDI`}
                            color="success"
                            size="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(tx.timestamp).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < transactions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", p: 2 }}
          >
            No transactions yet
          </Typography>
        )}
      </Card>
    </Box>
  );
};

export default WalletTab;
