import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  Grid,
  Card,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
} from "@mui/material";
import {
  Person as PersonIcon,
  Star as StarIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { useUser } from "../contexts/UserContext";
import WalletTab from "./WalletTab";
import ConsentManagement from "./ConsentManagement";
import ActivityTab from "./ActivityTab";
import rdzLogo from "../assets/RDZ Health.png";
import { ReactComponent as ProfileIcon } from "../assets/profile_icon_color.svg";
import { ReactComponent as DataSharingIcon } from "../assets/data_icon_color.svg";
import { ReactComponent as ActivityIcon } from "../assets/activity_icon_color.svg";
import { ReactComponent as ChatIcon } from "../assets/ai_icon_color.svg";
import { ReactComponent as WalletIcon } from "../assets/wallet_icon_color.svg";
import { ReactComponent as ProfileIconGray } from "../assets/profile_icon_gray.svg";
import { ReactComponent as DataSharingIconGray } from "../assets/data_icon_gray.svg";
import { ReactComponent as ActivityIconGray } from "../assets/activity_icon_gray.svg";
import { ReactComponent as ChatIconGray } from "../assets/ai_icon_gray.svg";
import { ReactComponent as WalletIconGray } from "../assets/wallet_icon_gray.svg";
import { ReactComponent as OverviewIcon } from "../assets/overview_icon.svg";
import { ReactComponent as FamilyIcon } from "../assets/family_icon.svg";
import { ReactComponent as BenefitsIcon } from "../assets/benefits_icon.svg";

interface ZivaHealthAppProps {
  onLogout: () => void;
}

const ZivaHealthApp: React.FC<ZivaHealthAppProps> = ({ onLogout }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [currentProfileCard, setCurrentProfileCard] = useState(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { walletInterface } = useWalletInterface();
  const {
    user,
    genomicData,
    loading: userLoading,
    error: userError,
  } = useUser();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleProfileCardClick = (cardIndex: number) => {
    setCurrentProfileCard(cardIndex);
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Disconnect wallet if connected
      if (walletInterface && typeof walletInterface.disconnect === "function") {
        await walletInterface.disconnect();
        console.log("Wallet disconnected successfully");
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
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
        return (
          <ProfileTab
            walletInterface={walletInterface}
            currentProfileCard={currentProfileCard}
            onProfileCardClick={handleProfileCardClick}
            user={user}
            genomicData={genomicData}
            userLoading={userLoading}
            userError={userError}
          />
        );
      case 1: // Data Sharing
        return <DataSharingTab walletInterface={walletInterface} />;
      case 2: // Activity
        return <ActivityTab walletInterface={walletInterface} />;
      case 3: // Chat
        return <ChatTab walletInterface={walletInterface} />;
      case 4: // Wallet
        return <WalletTab />;
      default:
        return (
          <ProfileTab
            walletInterface={walletInterface}
            currentProfileCard={currentProfileCard}
            onProfileCardClick={handleProfileCardClick}
            user={user}
            genomicData={genomicData}
            userLoading={userLoading}
            userError={userError}
          />
        );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        display: "flex",
        flexDirection: "column",
        marginBottom: 8,
      }}
    >
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <img src={rdzLogo} alt="RDZ Health" width={180} height={"100%"} />
          </Box>
          <IconButton
            onClick={handleLogoutClick}
            title="Logout"
            sx={{ color: "text.primary" }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 2 }}>{renderMainContent()}</Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          value={currentTab}
          onChange={handleTabChange}
          showLabels
          sx={{
            "& .MuiBottomNavigationAction-root": {
              minWidth: "auto",
              padding: "6px 8px",
            },
            "& .MuiBottomNavigationAction-label": {
              fontSize: "0.75rem",
              marginTop: "4px",
            },
          }}
        >
          <BottomNavigationAction
            label="Profile"
            icon={
              currentTab === 0 ? (
                <ProfileIcon style={{ width: 24, height: 24 }} />
              ) : (
                <ProfileIconGray style={{ width: 24, height: 24 }} />
              )
            }
          />
          <BottomNavigationAction
            label="Data"
            icon={
              currentTab === 1 ? (
                <DataSharingIcon style={{ width: 24, height: 24 }} />
              ) : (
                <DataSharingIconGray style={{ width: 24, height: 24 }} />
              )
            }
          />
          <BottomNavigationAction
            label="Activity"
            icon={
              currentTab === 2 ? (
                <ActivityIcon style={{ width: 24, height: 24 }} />
              ) : (
                <ActivityIconGray style={{ width: 24, height: 24 }} />
              )
            }
          />
          <BottomNavigationAction
            label="Chat"
            icon={
              currentTab === 3 ? (
                <ChatIcon style={{ width: 24, height: 24 }} />
              ) : (
                <ChatIconGray style={{ width: 24, height: 24 }} />
              )
            }
          />
          <BottomNavigationAction
            label="Wallet"
            icon={
              currentTab === 4 ? (
                <WalletIcon style={{ width: 24, height: 24 }} />
              ) : (
                <WalletIconGray style={{ width: 24, height: 24 }} />
              )
            }
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
            Are you sure you want to logout? This will disconnect your wallet
            and return you to the login screen.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            color="error"
            variant="contained"
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Profile Tab Component
const ProfileTab: React.FC<{
  walletInterface: any;
  currentProfileCard: number;
  onProfileCardClick: (cardIndex: number) => void;
  user: any;
  genomicData: any;
  userLoading: boolean;
  userError: string | null;
}> = ({
  walletInterface,
  currentProfileCard,
  onProfileCardClick,
  user,
  genomicData,
  userLoading,
  userError,
}) => {
  if (userLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <Typography>Loading user data...</Typography>
      </Box>
    );
  }

  if (userError) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <Typography color="error">
          Error loading user data: {userError}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
          p: 2,
          backgroundColor: "white",
          borderRadius: 2,
        }}
      >
        <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
          <PersonIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" color="#0d0d0d">
            Hello{" "}
            {user
              ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
              : "User"}
            !
          </Typography>
          <Typography variant="body2" color="#0d0d0d">
            iHope ID: {user?.iHopeId || "Loading..."}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <StarIcon sx={{ color: "#ffc107", mr: 0.5, fontSize: 16 }} />
            <Typography variant="body2" color="#0d0d0d">
              Benefits Active
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Features Grid */}
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: "bold", color: "#0d0d0d" }}
      >
        My Health Profile
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Card
              onClick={() => onProfileCardClick(0)}
              sx={{
                textAlign: "center",
                p: 2,
                height: 120,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 2,
                width: "100%",
                mb: 1,
                cursor: "pointer",
                border:
                  currentProfileCard === 0
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <OverviewIcon />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: currentProfileCard === 0 ? "#3F37C9" : "inherit",
                fontWeight: currentProfileCard === 0 ? "bold" : "normal",
              }}
            >
              Patient Overview
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={4}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Card
              onClick={() => onProfileCardClick(1)}
              sx={{
                textAlign: "center",
                p: 2,
                height: 120,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 2,
                width: "100%",
                mb: 1,
                cursor: "pointer",
                border:
                  currentProfileCard === 1
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <FamilyIcon />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: currentProfileCard === 1 ? "#3F37C9" : "inherit",
                fontWeight: currentProfileCard === 1 ? "bold" : "normal",
              }}
            >
              Family History
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={4}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Card
              onClick={() => onProfileCardClick(2)}
              sx={{
                textAlign: "center",
                p: 2,
                height: 120,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 2,
                width: "100%",
                mb: 1,
                cursor: "pointer",
                border:
                  currentProfileCard === 2
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <BenefitsIcon />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: currentProfileCard === 2 ? "#3F37C9" : "inherit",
                fontWeight: currentProfileCard === 2 ? "bold" : "normal",
              }}
            >
              My Benefits
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      {/* Content Area */}
      <Card sx={{ minHeight: 200, p: 2 }}>
        {currentProfileCard === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#3F37C9" }}>
              Patient Overview
            </Typography>
            {genomicData ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Condition:</strong> {genomicData.condition}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Clinical Status:</strong> {genomicData.clinicalStatus}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Health Status:</strong> {genomicData.healthStatus}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Findings:</strong> {genomicData.findings}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Date of First Diagnosis:</strong>{" "}
                  {new Date(
                    genomicData.dateOfFirstDiagnosis,
                  ).toLocaleDateString()}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Loading patient data...
              </Typography>
            )}
          </Box>
        )}
        {currentProfileCard === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#3F37C9" }}>
              Family History
            </Typography>
            {genomicData ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Family Members:</strong> {genomicData.familyMembers}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Mode of Inheritance:</strong>{" "}
                  {genomicData.modeOfInheritance}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Inherited From:</strong> {genomicData.inheritedFrom}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Next of Kin:</strong>{" "}
                  {genomicData.nextOfKinContactDetails}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Loading family history...
              </Typography>
            )}
          </Box>
        )}
        {currentProfileCard === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#3F37C9" }}>
              My Benefits
            </Typography>
            {genomicData ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Receives Benefits:</strong>{" "}
                  {genomicData.receivesBenefits}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Medical Fees:</strong> ${genomicData.medicalFees}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Medication:</strong> ${genomicData.medication}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Lab Services:</strong> ${genomicData.labServices}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Food Pack:</strong> ${genomicData.foodPack}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Loading benefits information...
              </Typography>
            )}
          </Box>
        )}
      </Card>
    </Box>
  );
};

// Data Sharing Tab Component
const DataSharingTab: React.FC<{ walletInterface: any }> = ({
  walletInterface,
}) => (
  <Box>
    {/* Consent Management */}
    <ConsentManagement walletInterface={walletInterface} />
  </Box>
);

// Chat Tab Component
const ChatTab: React.FC<{ walletInterface: any }> = ({ walletInterface }) => (
  <Box>
    <Typography
      variant="h5"
      sx={{ mb: 3, fontWeight: "bold", color: "#0d0d0d" }}
    >
      Chat
    </Typography>

    <Card sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        AI Health Assistant
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Chat with our AI assistant about your genomic data
      </Typography>
    </Card>
  </Box>
);

export default ZivaHealthApp;
