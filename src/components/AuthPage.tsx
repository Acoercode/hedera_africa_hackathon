import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Button
} from '@mui/material';
import {
  Science as ScienceIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  CheckCircle as CheckIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import { useWalletInterface } from '../services/wallets/useWalletInterface';
import { WalletSelectionDialog } from './WalletSelectionDialog';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const { walletInterface, accountId } = useWalletInterface();
  const [error, setError] = useState<string | null>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);

  // Check if wallet is connected and trigger success
  React.useEffect(() => {
    if (walletInterface && accountId) {
      setError(null);
      // Small delay to show the success state
      setTimeout(() => {
        onAuthSuccess();
      }, 1000);
    }
  }, [walletInterface, accountId, onAuthSuccess]);

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored on the blockchain'
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: 'You Own Your Data',
      description: 'Full control over your genomic data and consent'
    },
    {
      icon: <WalletIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: 'Earn Tokens',
      description: 'Get rewarded with GDI tokens for data sharing'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      <Card sx={{ 
        maxWidth: 500, 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar sx={{ 
              bgcolor: '#1976d2', 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)'
            }}>
              <ScienceIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2',
              mb: 1
            }}>
              Ziva Health
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'text.secondary',
              mb: 2
            }}>
              Decentralized Genomic Data Mesh
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Connect your Hedera wallet to access your genomic data, manage consent, and earn rewards
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Connection Status */}
          {walletInterface && accountId ? (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                Wallet Connected!
              </Typography>
              <Chip 
                label={`Account: ${accountId}`} 
                color="success" 
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Redirecting to your dashboard...
              </Typography>
              <CircularProgress size={24} sx={{ mt: 2 }} />
            </Box>
          ) : (
            <>
              {/* Connect Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => setShowWalletDialog(true)}
                startIcon={<WalletIcon />}
                sx={{
                  py: 2,
                  mb: 3,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                  }
                }}
              >
                Connect Hedera Wallet
              </Button>

              {/* Features */}
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Why Choose Ziva Health?
                </Typography>
              </Divider>

              <Grid container spacing={2}>
                {features.map((feature, index) => (
                  <Grid item xs={12} key={index}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'grey.50',
                      '&:hover': {
                        backgroundColor: 'grey.100',
                        transition: 'background-color 0.2s'
                      }
                    }}>
                      <Box sx={{ mr: 2 }}>
                        {feature.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5, color: '#0d0d0d' }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="#0d0d0d">
                          {feature.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Powered by Hedera Hashgraph • Built for Healthcare Innovation
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Wallet Selection Dialog */}
      <WalletSelectionDialog
        open={showWalletDialog}
        setOpen={setShowWalletDialog}
        onClose={() => setShowWalletDialog(false)}
      />
    </Box>
  );
};

export default AuthPage;
