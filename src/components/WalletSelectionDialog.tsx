import { Button, Dialog, Stack, Typography, Box } from "@mui/material";
import { connectToMetamask } from "../services/wallets/metamask/metamaskClient";
import { openWalletConnectModal } from "../services/wallets/walletconnect/walletConnectClient";
import MetamaskLogo from "../assets/metamask-logo.svg";
import WalletConnectLogo from "../assets/walletconnect-logo.svg";


interface WalletSelectionDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onClose: (value: string) => void;
}

export const WalletSelectionDialog = (props: WalletSelectionDialogProps) => {
  const { onClose, open, setOpen } = props;

  return (
    <Dialog onClose={onClose} open={open} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
          Choose Your Wallet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Select your preferred wallet to connect to Ziva Health
        </Typography>
        
        <Stack gap={2}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              openWalletConnectModal()
              setOpen(false);
            }}
            sx={{ 
              py: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              justifyContent: 'flex-start'
            }}
          >
            <img
              src={WalletConnectLogo}
              alt='walletconnect logo'
              style={{
                width: 32,
                height: 32
              }}
            />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                WalletConnect
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Connect HashPack, Blade, and other Hedera wallets
              </Typography>
            </Box>
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              connectToMetamask();
              setOpen(false);
            }}
            sx={{ 
              py: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              justifyContent: 'flex-start'
            }}
          >
            <img
              src={MetamaskLogo}
              alt='metamask logo'
              style={{
                width: 32,
                height: 32
              }}
            />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                MetaMask
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Connect with MetaMask wallet
              </Typography>
            </Box>
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
