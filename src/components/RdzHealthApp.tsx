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
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { useUser } from "../contexts/UserContext";
import WalletTab from "./WalletTab";
import ConsentManagement from "./ConsentManagement";
import ActivityTab from "./ActivityTab";
import DataSyncManagement from "./DataSyncManagement";
import AITab from "./AITab";
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
import { ReactComponent as IHopeIdIcon } from "../assets/id_icon.svg";
import { ReactComponent as StarIcon } from "../assets/star_icon.svg";
import { AssessmentNotification } from "./ClinVarComponents";
import { AssessmentPage } from "./AssessmentPage";

interface RdzHealthAppProps {
  onLogout: () => void;
}

const RdzHealthApp: React.FC<RdzHealthAppProps> = ({ onLogout }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [currentProfileCard, setCurrentProfileCard] = useState(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [autoOpenDataSyncConsent, setAutoOpenDataSyncConsent] = useState(false);
  const { accountId, walletInterface } = useWalletInterface();
  const {
    user,
    genomicData,
    loading: userLoading,
    error: userError,
    refetchUser,
  } = useUser();

  // ClinVar state
  const [clinvarSummary, setClinvarSummary] = useState<any>(null);
  const [clinvarResults, setClinvarResults] = useState<any[]>([]);
  const [africanPopulationData, setAfricanPopulationData] = useState<any[]>([]);
  const [researchArticles, setResearchArticles] = useState<any[]>([]);
  const [clinvarLoading, setClinvarLoading] = useState(false);
  const [showAssessmentPage, setShowAssessmentPage] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Scroll to top when main tab changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentTab]);

  const handleProfileCardClick = (cardIndex: number) => {
    setCurrentProfileCard(cardIndex);
  };

  const handleConsentCreated = async () => {
    if (refetchUser) {
      await refetchUser();
    }
  };

  const generateClinVarInsights = async () => {
    if (!genomicData || !accountId) return;

    setClinvarLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ROOT}/ai/clinvar-insights`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            genomicData: genomicData,
            accountId: accountId,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setClinvarResults(data.clinvarResults || []);
        setClinvarSummary(data.insightsSummary || null);
        setAfricanPopulationData(data.africanPopulationData || []);
        setResearchArticles(data.researchArticles || []);
      }
    } catch (error) {
      console.error("Error generating ClinVar insights:", error);
    } finally {
      setClinvarLoading(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Disconnect wallet if connected
      if (walletInterface && typeof walletInterface.disconnect === "function") {
        await walletInterface.disconnect();
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
    // Show Assessment Page if requested
    if (showAssessmentPage) {
      return (
        <AssessmentPage
          clinvarSummary={clinvarSummary}
          clinvarResults={clinvarResults}
          africanPopulationData={africanPopulationData}
          researchArticles={researchArticles}
          onGenerateClinVarInsights={generateClinVarInsights}
          clinvarLoading={clinvarLoading}
          onBack={() => setShowAssessmentPage(false)}
        />
      );
    }

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
            onRequestDataSyncConsent={() => {
              setAutoOpenDataSyncConsent(true);
              setCurrentTab(1); // Switch to Data tab
            }}
            clinvarSummary={clinvarSummary}
            clinvarResults={clinvarResults}
            onGenerateClinVarInsights={generateClinVarInsights}
            clinvarLoading={clinvarLoading}
            onViewAssessment={() => setShowAssessmentPage(true)}
          />
        );
      case 1: // Data Sharing
        return (
          <DataSharingTab
            walletInterface={walletInterface}
            user={user}
            genomicData={genomicData}
            autoOpenDataSyncConsent={autoOpenDataSyncConsent}
            onDataSyncConsentOpened={() => setAutoOpenDataSyncConsent(false)}
            onRequestDataSyncConsent={() => {
              setAutoOpenDataSyncConsent(true);
              setCurrentTab(1); // Switch to Data tab
            }}
            onConsentCreated={handleConsentCreated}
            clinvarResults={clinvarResults}
            africanPopulationData={africanPopulationData}
            onGenerateClinVarInsights={generateClinVarInsights}
            clinvarLoading={clinvarLoading}
          />
        );
      case 2: // Activity
        return (
          <ActivityTab
            walletInterface={walletInterface}
            clinvarResults={clinvarResults}
            clinvarSummary={clinvarSummary}
          />
        );
      case 3: // AI
        return (
          <AITab
            clinvarResults={clinvarResults}
            clinvarSummary={clinvarSummary}
            africanPopulationData={africanPopulationData}
            onGenerateClinVarInsights={generateClinVarInsights}
            clinvarLoading={clinvarLoading}
          />
        );
      case 4: // Wallet
        return <WalletTab />;
      case 5: // Data Sync
        return (
          <DataSyncManagement
            accountId={accountId}
            userData={
              user
                ? {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    iHopeId: user.iHopeId,
                  }
                : undefined
            }
          />
        );
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
            onRequestDataSyncConsent={() => {
              setAutoOpenDataSyncConsent(true);
              setCurrentTab(1); // Switch to Data tab
            }}
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
            label="AI"
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
  onRequestDataSyncConsent: () => void;
  clinvarSummary?: any;
  clinvarResults?: any[];
  onGenerateClinVarInsights?: () => void;
  clinvarLoading?: boolean;
  onViewAssessment?: () => void;
}> = ({
  walletInterface,
  currentProfileCard,
  onProfileCardClick,
  user,
  genomicData,
  userLoading,
  userError,
  onRequestDataSyncConsent,
  clinvarSummary = null,
  clinvarResults = [],
  onGenerateClinVarInsights,
  clinvarLoading = false,
  onViewAssessment,
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
          borderRadius: 4,
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
          <Stack direction="row" alignItems="center" gap={1}>
            <IHopeIdIcon style={{ width: 24, height: 24 }} />
            <Typography variant="body2" color="#0d0d0d" sx={{ mr: 1 }}>
              {user?.iHopeId || "Loading..."}
            </Typography>
            <StarIcon style={{ width: 18, height: 18 }} />
            <Typography variant="body2" color="#0d0d0d">
              Benefits Active
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Main Features Grid */}
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: "bold", color: "#0d0d0d" }}
      >
        My Health Profile
      </Typography>

      {/* ClinVar Risk Assessment - Show on Patient Overview */}
      {currentProfileCard === 0 && genomicData && (
        <Box sx={{ mt: 3 }}>
          <AssessmentNotification
            summary={clinvarSummary}
            onViewAssessment={onViewAssessment}
            onGenerateInsights={onGenerateClinVarInsights}
            loading={clinvarLoading}
            existingDiagnosis={genomicData?.condition}
          />
        </Box>
      )}

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
                height: 88,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 4,
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
                height: 88,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 4,
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
                height: 88,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 4,
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
      <Box>
        {currentProfileCard === 0 && (
          <Grid container spacing={2}>
            {/* Patient Details Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, borderRadius: 4, height: "100%" }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "#3F37C9",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  Patient Details
                </Typography>
                {genomicData ? (
                  <Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Full Name
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.name} {genomicData.surname}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Date of Birth
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {new Date(genomicData.dob).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Sex
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.sex}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Ethnicity
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.ethnicity}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        iHOPE ID
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.ihopeId}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Contact
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.telephone}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Address
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.address}, {genomicData.city}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Patient details are not available.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mb: 1 }}
                    >
                      🔒 Data Access Restricted
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      To view your patient details, please consent to data
                      synchronization.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={onRequestDataSyncConsent}
                    >
                      Enable Data Access
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Diagnosis & Status Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, borderRadius: 4, height: "100%" }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "#3F37C9",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  Diagnosis & Status
                </Typography>
                {genomicData ? (
                  <Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Clinical Status
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.clinicalStatus}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Health Status
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.healthStatus}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Condition
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.condition || "Not specified"}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Date of First Diagnosis
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.dateOfFirstDiagnosis
                          ? new Date(
                              genomicData.dateOfFirstDiagnosis,
                            ).toLocaleDateString()
                          : "Not available"}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Findings
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.findings || "No findings reported"}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Referring Physician
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.referringPhysician || "Not specified"}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Diagnosis and status information is not available.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mb: 1 }}
                    >
                      🔒 Data Access Restricted
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      To view your diagnosis information, please consent to data
                      synchronization.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={onRequestDataSyncConsent}
                    >
                      Enable Data Access
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        )}

        {currentProfileCard === 1 && (
          <Grid container spacing={2}>
            {/* Family Information Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, borderRadius: 4, height: "100%" }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "#3F37C9",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  Family Information
                </Typography>
                {genomicData ? (
                  <Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Family Members
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.familyMembers}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Designation
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.designation}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Next of Kin
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.nextOfKinContactDetails}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Family information is not available.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mb: 1 }}
                    >
                      🔒 Data Access Restricted
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      To view your family information, please consent to data
                      synchronization.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={onRequestDataSyncConsent}
                    >
                      Enable Data Access
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Genetic Inheritance Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, borderRadius: 4, height: "100%" }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "#3F37C9",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  Genetic Inheritance
                </Typography>
                {genomicData ? (
                  <Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Mode of Inheritance
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.modeOfInheritance}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Inherited From
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.inheritedFrom}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Genetic Disorder Result
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.resultForGeneticDisorder}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Interpretation
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.interpretation}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Genetic inheritance information is not available.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mb: 1 }}
                    >
                      🔒 Data Access Restricted
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      To view your genetic information, please consent to data
                      synchronization.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={onRequestDataSyncConsent}
                    >
                      Enable Data Access
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        )}
        {currentProfileCard === 2 && (
          <Grid container spacing={2}>
            {/* Medical Benefits Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, borderRadius: 4, height: "100%" }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "#3F37C9",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  Medical Benefits
                </Typography>
                {genomicData ? (
                  <Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Receives Benefits
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        {genomicData.receivesBenefits}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Medical Fees
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        ${genomicData.medicalFees}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Medication
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        ${genomicData.medication}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Lab Services
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        ${genomicData.labServices}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Medical benefits information is not available.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mb: 1 }}
                    >
                      🔒 Data Access Restricted
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      To view your medical benefits, please consent to data
                      synchronization.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={onRequestDataSyncConsent}
                    >
                      Enable Data Access
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Support Services Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2, borderRadius: 4, height: "100%" }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "#3F37C9",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  Support Services
                </Typography>
                {genomicData ? (
                  <Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Food Pack
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        ${genomicData.foodPack}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Psychological Services
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        ${genomicData.psychologicalServices}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Transport
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        ${genomicData.transport}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        School Fees
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        ${genomicData.schoolFees}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          mb: 0.25,
                        }}
                      >
                        Chicken Project
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "500", fontSize: "0.9rem" }}
                      >
                        ${genomicData.chickenProject}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Support services information is not available.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mb: 1 }}
                    >
                      🔒 Data Access Restricted
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 2, display: "block" }}
                    >
                      To view your support services, please consent to data
                      synchronization.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={onRequestDataSyncConsent}
                    >
                      Enable Data Access
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

// Data Sharing Tab Component
const DataSharingTab: React.FC<{
  walletInterface: any;
  user: any;
  genomicData: any;
  autoOpenDataSyncConsent?: boolean;
  onDataSyncConsentOpened?: () => void;
  onRequestDataSyncConsent: () => void;
  onConsentCreated?: () => void;
  clinvarResults?: any[];
  africanPopulationData?: any[];
  onGenerateClinVarInsights?: () => void;
  clinvarLoading?: boolean;
}> = ({
  walletInterface,
  genomicData,
  autoOpenDataSyncConsent,
  onDataSyncConsentOpened,
  onRequestDataSyncConsent,
  onConsentCreated,
  clinvarResults = [],
  africanPopulationData = [],
  onGenerateClinVarInsights,
  clinvarLoading = false,
}) => {
  // Auto-open data sync consent dialog if requested
  React.useEffect(() => {
    if (autoOpenDataSyncConsent && onDataSyncConsentOpened) {
      // Trigger the consent dialog in ConsentManagement
      // This will be handled by the ConsentManagement component
      onDataSyncConsentOpened();
    }
  }, [autoOpenDataSyncConsent, onDataSyncConsentOpened]);

  return (
    <Box>
      {/* Data Sync Status Section */}
      {!genomicData && (
        <Card
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography
              variant="h6"
              sx={{ color: "#856404", fontWeight: "bold" }}
            >
              Data Access Restricted
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 2, color: "#856404" }}>
            Your genomic data is not accessible because you haven't consented to
            data synchronization.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: "#856404" }}>
            To enable data sharing and access your genomic information, please
            consent to data synchronization.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={onRequestDataSyncConsent}
            sx={{
              backgroundColor: "#3F37C9",
              "&:hover": { backgroundColor: "#2d2a9a" },
            }}
          >
            Enable Data Synchronization
          </Button>
        </Card>
      )}

      {/* Data Access Status */}
      {genomicData && (
        <Card
          sx={{
            p: 1.5,
            mb: 2,
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "#155724", fontWeight: "bold", fontSize: "0.9rem" }}
            >
              Data Access Enabled
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ color: "#155724", fontSize: "0.8rem" }}
          >
            Your genomic data is accessible and you can manage your consent
            preferences below.
          </Typography>
        </Card>
      )}

      {/* Consent Management */}
      <ConsentManagement
        walletInterface={walletInterface}
        autoOpenDataSyncConsent={autoOpenDataSyncConsent}
        onDataSyncConsentOpened={onDataSyncConsentOpened}
        onConsentCreated={onConsentCreated}
      />
    </Box>
  );
};

export default RdzHealthApp;
