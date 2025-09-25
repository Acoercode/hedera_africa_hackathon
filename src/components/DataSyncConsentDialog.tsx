import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Sync as SyncIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { HEDERA_CONFIG } from "../config/constants";

interface DataSyncConsentDialogProps {
  open: boolean;
  onClose: () => void;
  onConsent: () => Promise<void>;
  onDecline: () => void;
  loading?: boolean;
  userData?: {
    firstName: string;
    lastName: string;
    iHopeId: string;
  };
}

const DataSyncConsentDialog: React.FC<DataSyncConsentDialogProps> = ({
  open,
  onClose,
  onConsent,
  onDecline,
  loading = false,
  userData,
}) => {
  const [understood, setUnderstood] = useState(false);

  const handleConsent = async () => {
    if (understood) {
      await onConsent();
    }
  };

  const handleDecline = () => {
    setUnderstood(false);
    onDecline();
  };

  const handleClose = () => {
    setUnderstood(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <SyncIcon color="primary" />
        <Typography variant="h6">Data Synchronization Consent</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>
                Hello {userData?.firstName} {userData?.lastName}!
              </strong>
              <br />
              We've verified your identity (iHope ID: {userData?.iHopeId}) and
              would like to sync your genomic data for research purposes.
            </Typography>
          </Alert>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
          What is Data Synchronization?
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Data synchronization allows us to:
        </Typography>

        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>
            <Typography variant="body2">
              Keep your genomic data up-to-date across research platforms
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Ensure data consistency for ongoing research studies
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Provide you with the latest research findings related to your
              genomic profile
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Enable seamless participation in new research opportunities
            </Typography>
          </li>
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Important:</strong> This consent will create a Data Sync NFT
            (Token ID: {HEDERA_CONFIG.DATA_SYNC_NFT_TOKEN_ID}) that proves your
            consent for data synchronization. You can revoke this consent at any
            time.
          </Typography>
        </Alert>

        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 2 }}>
          <SecurityIcon color="primary" sx={{ mt: 0.5 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Your Data Privacy is Protected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Your personal information remains encrypted and secure
              <br />
              • Only anonymized data is synchronized
              <br />
              • You maintain full control over your data
              <br />• You can withdraw consent at any time
            </Typography>
          </Box>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              I understand the data synchronization process and consent to sync
              my genomic data for research purposes
            </Typography>
          }
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleDecline}
          variant="outlined"
          color="secondary"
          disabled={loading}
        >
          Reject - Do No Sync
        </Button>
        <Button
          onClick={handleConsent}
          variant="contained"
          color="primary"
          disabled={!understood || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <SyncIcon />}
        >
          {loading ? "Creating Data Sync Consent..." : "Accept - Link Data"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DataSyncConsentDialog;
