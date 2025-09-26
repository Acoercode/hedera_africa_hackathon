import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import { CheckCircle, Info } from "@mui/icons-material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";

interface TokenAssociationDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  tokenId: string;
  onAssociationComplete: () => void;
}

const TokenAssociationDialog: React.FC<TokenAssociationDialogProps> = ({
  open,
  onClose,
  accountId,
  tokenId,
  onAssociationComplete,
}) => {
  const { walletInterface } = useWalletInterface();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const steps = [
    {
      label: "Check Association Status",
      description: "Verify if your wallet is associated with RDZ token",
    },
    {
      label: "Sign Association Transaction",
      description: "Sign the association transaction in your wallet",
    },
    {
      label: "Complete",
      description:
        "Association complete - you can now receive incentive tokens!",
    },
  ];

  const handleStartAssociation = async () => {
    setLoading(true);
    setError(null);
    setStep(1);

    try {
      // Check if already associated
      const response = await fetch(
        `http://localhost:5000/api/incentives/association-info/${accountId}`,
      );
      const data = await response.json();

      if (data.success) {
        if (data.isAssociated) {
          setStep(2); // Already associated
          setLoading(false);
          return;
        }

        // User needs to associate - proceed to signing
        setLoading(false);
        setStep(1);
      } else {
        setError(data.message || "Failed to check association status");
        setStep(0);
      }
    } catch (err) {
      setError("Failed to check association status");
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSignAssociation = async () => {
    if (!walletInterface) {
      setError("Wallet not connected");
      return;
    }

    setSigning(true);
    setError(null);

    try {
      // Use the wallet interface's associateToken method (same as consent flows)
      const { TokenId } = await import("@hashgraph/sdk");
      const tokenIdObj = TokenId.fromString(tokenId);

      // Use the wallet interface's associateToken method
      const associationTransactionId =
        await walletInterface.associateToken(tokenIdObj);

      if (associationTransactionId) {
        setStep(2); // Success
        onAssociationComplete();
      } else {
        setError("Token association failed or was rejected");
      }
    } catch (err: any) {
      console.error("❌ Error signing RDZ token association:", err);
      setError(err.message || "Failed to sign association transaction");
    } finally {
      setSigning(false);
    }
  };

  const handleComplete = () => {
    onAssociationComplete();
    onClose();
    setStep(0);
    setError(null);
  };

  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              To receive RDZ incentive tokens, your wallet must be associated
              with the RDZ token.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Account:</strong> {accountId}
                <br />
                <strong>Token:</strong> {tokenId} (RDZ)
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This is a one-time setup that allows you to receive incentive
              tokens for:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Data Synchronization: 100 RDZ tokens</li>
              <li>Research Consent: 150 RDZ tokens</li>
              <li>Passport Creation: 200 RDZ tokens</li>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Click the button below to sign the association transaction in your
              wallet.
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Your wallet will open and ask you to sign a
                TokenAssociateTransaction. This allows you to receive RDZ
                incentive tokens.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              size="large"
              onClick={handleSignAssociation}
              disabled={signing || !walletInterface}
              startIcon={signing ? <CircularProgress size={20} /> : undefined}
              sx={{ width: "100%" }}
            >
              {signing ? "Signing..." : "Sign Association Transaction"}
            </Button>

            {!walletInterface && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Please connect your wallet first to sign the association
                  transaction.
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="h6" color="success.main">
                Association Complete!
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              Your wallet is now associated with the RDZ token. You can now
              receive incentive tokens for:
            </Typography>
            <Box component="ul" sx={{ mb: 2 }}>
              <li>Data Synchronization: 100 RDZ tokens</li>
              <li>Research Consent: 150 RDZ tokens</li>
              <li>Passport Creation: 200 RDZ tokens</li>
            </Box>
            <Alert severity="success">
              <Typography variant="body2">
                You're all set! Perform any consent action to automatically
                receive your incentive tokens.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Info color="primary" sx={{ mr: 1 }} />
          Associate with RDZ Token
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={step} orientation="vertical">
          {steps.map((stepItem, index) => (
            <Step key={stepItem.label}>
              <StepLabel>{stepItem.label}</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {stepItem.description}
                </Typography>
                {renderStepContent(index)}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading || signing}>
          Cancel
        </Button>
        {step === 0 && (
          <Button
            onClick={handleStartAssociation}
            variant="contained"
            disabled={loading}
          >
            Start Association
          </Button>
        )}
        {step === 2 && (
          <Button onClick={handleComplete} variant="contained" color="success">
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TokenAssociationDialog;
