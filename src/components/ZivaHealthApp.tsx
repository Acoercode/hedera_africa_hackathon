import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  Grid,
  Card,
  CardContent,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  IconButton,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  Share as ShareIcon,
  Apple as AppleIcon,
  Chat as ChatIcon,
  AccountBalanceWallet as WalletIcon,
  Science as ScienceIcon,
  Science as GeneticsIcon,
  FamilyRestroom as FamilyIcon,
  CardGiftcard as BenefitsIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useWalletInterface } from '../services/wallets/useWalletInterface';
import WalletTab from './WalletTab';

interface ZivaHealthAppProps {
  onLogout: () => void;
}

const ZivaHealthApp: React.FC<ZivaHealthAppProps> = ({ onLogout }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { walletInterface } = useWalletInterface();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Disconnect wallet if connected
      if (walletInterface && typeof walletInterface.disconnect === 'function') {
        await walletInterface.disconnect();
        console.log('Wallet disconnected successfully');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setShowLogoutDialog(false);
      onLogout();
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const renderMainContent = () => {
    switch (currentTab) {
      case 0: // My Profile
        return <ProfileTab walletInterface={walletInterface} />;
      case 1: // Data Sharing
        return <DataSharingTab walletInterface={walletInterface} />;
      case 2: // Activity
        return <ActivityTab walletInterface={walletInterface} />;
      case 3: // Chat
        return <ChatTab walletInterface={walletInterface} />;
      case 4: // Wallet
        return <WalletTab />;
      default:
        return <ProfileTab walletInterface={walletInterface} />;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'white', color: '#1976d2', mr: 2 }}>
              <ScienceIcon />
            </Avatar>
            <Typography variant="h6" component="div">
              Ziva Health
            </Typography>
          </Box>
          <IconButton 
            color="inherit" 
            onClick={handleLogoutClick}
            title="Logout"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 2 }}>
        {renderMainContent()}
      </Box>

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          value={currentTab}
          onChange={handleTabChange}
          showLabels
        >
          <BottomNavigationAction 
            label="My Profile" 
            icon={<PersonIcon />} 
          />
          <BottomNavigationAction 
            label="Data Sharing" 
            icon={<ShareIcon />} 
          />
          <BottomNavigationAction 
            label="Activity" 
            icon={<AppleIcon />} 
          />
          <BottomNavigationAction 
            label="Chat" 
            icon={<ChatIcon />} 
          />
          <BottomNavigationAction 
            label="Wallet" 
            icon={<WalletIcon />} 
          />
        </BottomNavigation>
      </Paper>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={showLogoutDialog}
        onClose={handleLogoutCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to logout? This will disconnect your wallet and return you to the login screen.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Profile Tab Component
const ProfileTab: React.FC<{ walletInterface: any }> = ({ walletInterface }) => (
  <Box>
    {/* User Profile Section */}
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, backgroundColor: 'white', borderRadius: 2 }}>
      <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
        <PersonIcon />
      </Avatar>
      <Box>
        <Typography variant="h6">Hello Tariro!</Typography>
        <Typography variant="body2" color="text.secondary">+ Lorem Ipsum</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <StarIcon sx={{ color: '#ffc107', mr: 0.5, fontSize: 16 }} />
          <Typography variant="body2" color="text.secondary">Benefits Active</Typography>
        </Box>
      </Box>
    </Box>

    {/* Main Features Grid */}
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
      Lorem Ipsum Dolor
    </Typography>
    
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6}>
        <Card sx={{ textAlign: 'center', p: 2, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <GeneticsIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
          <Typography variant="body2">Genetics Overview</Typography>
        </Card>
      </Grid>
      <Grid item xs={6}>
        <Card sx={{ textAlign: 'center', p: 2, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <FamilyIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
          <Typography variant="body2">Family History</Typography>
        </Card>
      </Grid>
      <Grid item xs={6}>
        <Card sx={{ textAlign: 'center', p: 2, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <BenefitsIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
          <Typography variant="body2">My Benefits</Typography>
        </Card>
      </Grid>
      <Grid item xs={6}>
        <Card sx={{ textAlign: 'center', p: 2, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <TimelineIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
          <Typography variant="body2">Timeline/Contacts</Typography>
        </Card>
      </Grid>
    </Grid>

    {/* Content Area */}
    <Card sx={{ minHeight: 200, p: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
        Dynamic content area for profile information
      </Typography>
    </Card>
  </Box>
);

// Data Sharing Tab Component
const DataSharingTab: React.FC<{ walletInterface: any }> = ({ walletInterface }) => (
  <Box>
    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
      Data Sharing
    </Typography>
    
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>My Consent NFTs</Typography>
      <Typography variant="body2" color="text.secondary">
        View and manage your consent NFTs for genomic data sharing
      </Typography>
    </Card>

    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Genomic Data NFTs</Typography>
      <Typography variant="body2" color="text.secondary">
        Your genomic data stored as NFTs on the blockchain
      </Typography>
    </Card>

    <Card sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Access Logs</Typography>
      <Typography variant="body2" color="text.secondary">
        Track who has accessed your data and when
      </Typography>
    </Card>
  </Box>
);

// Activity Tab Component
const ActivityTab: React.FC<{ walletInterface: any }> = ({ walletInterface }) => (
  <Box>
    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
      Activity
    </Typography>
    
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
      <Typography variant="body2" color="text.secondary">
        Your recent health and data activities
      </Typography>
    </Card>
  </Box>
);

// Chat Tab Component
const ChatTab: React.FC<{ walletInterface: any }> = ({ walletInterface }) => (
  <Box>
    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
      Chat
    </Typography>
    
    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>AI Health Assistant</Typography>
      <Typography variant="body2" color="text.secondary">
        Chat with our AI assistant about your genomic data
      </Typography>
    </Card>
  </Box>
);


export default ZivaHealthApp;
