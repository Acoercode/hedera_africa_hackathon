import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  Link,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Stack,
} from "@mui/material";
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { ReactComponent as ChatIcon } from "../assets/ai_icon_color.svg";
import { ReactComponent as BenefitsIcon } from "../assets/benefits_icon.svg";
import { ReactComponent as ConsentIcon } from "../assets/consent_icon.svg";
import { ReactComponent as DataIcon } from "../assets/data_icon.svg";
import { ReactComponent as AllActivityIcon } from "../assets/all_activity_icon.svg";

interface Activity {
  activityId: string;
  activityName: string;
  activityDescription: string;
  activityType: string;
  transactionId: string;
  timestamp: string;
  metadata?: any;
}

interface ActivityTabProps {
  walletInterface: any;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ walletInterface }) => {
  const { accountId } = useWalletInterface();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (accountId) {
      loadActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedTab]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real activities from the API
      const response = await fetch(
        `${process.env.REACT_APP_API_ROOT}/activities/user/${accountId}?limit=50`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setActivities(data.activities);
      } else {
        throw new Error(data.message || "Failed to load activities");
      }
    } catch (err) {
      setError("Failed to load activities");
      console.error("Error loading activities:", err);

      // Fallback to empty array if API fails
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "consent":
        return "#37C9A4";
      case "data":
        return "#3F37C9";
      case "incentive":
        return "#FDAA2B";
      case "ai":
        return "#3782C9";
      default:
        return "#3F37C9";
    }
  };

  const filteredActivities =
    selectedTab === 0
      ? activities
      : activities.filter((activity) => {
          const types = ["consent", "data", "incentive", "ai"];
          return activity.activityType === types[selectedTab - 1];
        });

  if (!accountId) {
    return (
      <Card sx={{ p: 3, textAlign: "center" }}>
        <HistoryIcon sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
          Wallet Not Connected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please connect your wallet to view activity history
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", color: "text.primary" }}
        >
          Activity & History
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={loadActivities}
            disabled={loading}
            title="Refresh activities"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Activity Filter Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={2.4}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Card
              onClick={() => {
                setSelectedTab(0);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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
                  selectedTab === 0
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <AllActivityIcon style={{ height: 30 }} />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: selectedTab === 0 ? "#3F37C9" : "inherit",
                fontWeight: selectedTab === 0 ? "bold" : "normal",
                textAlign: "center",
              }}
            >
              All Activities
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={2.4}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Card
              onClick={() => {
                setSelectedTab(1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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
                  selectedTab === 1
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <ConsentIcon style={{ height: 32 }} />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: selectedTab === 1 ? "#3F37C9" : "inherit",
                fontWeight: selectedTab === 1 ? "bold" : "normal",
                textAlign: "center",
              }}
            >
              Consent
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={2.4}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Card
              onClick={() => {
                setSelectedTab(2);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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
                  selectedTab === 2
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <DataIcon style={{ height: 32 }} />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: selectedTab === 2 ? "#3F37C9" : "inherit",
                fontWeight: selectedTab === 2 ? "bold" : "normal",
                textAlign: "center",
              }}
            >
              Data
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={2.4}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Card
              onClick={() => {
                setSelectedTab(3);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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
                  selectedTab === 3
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <BenefitsIcon style={{ height: 32 }} />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: selectedTab === 3 ? "#3F37C9" : "inherit",
                fontWeight: selectedTab === 3 ? "bold" : "normal",
                textAlign: "center",
              }}
            >
              Incentives
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={2.4}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Card
              onClick={() => {
                setSelectedTab(4);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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
                  selectedTab === 4
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <ChatIcon style={{ height: 36 }} />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: selectedTab === 4 ? "#3F37C9" : "inherit",
                fontWeight: selectedTab === 4 ? "bold" : "normal",
                textAlign: "center",
              }}
            >
              AI
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      {/* Activity Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6}>
          <Card sx={{ p: 2, textAlign: "center", borderRadius: 4 }}>
            <Typography
              variant="h4"
              color="primary.main"
              sx={{ fontWeight: "bold" }}
            >
              {activities.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Activities
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6}>
          <Card sx={{ p: 2, textAlign: "center", borderRadius: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "#37C9A4" }}
            >
              {activities.filter((a) => a.activityType === "consent").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Consent Events
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6}>
          <Card sx={{ p: 2, textAlign: "center", borderRadius: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "#FDAA2B" }}
            >
              {activities.filter((a) => a.activityType === "incentive").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Incentives Earned
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6}>
          <Card sx={{ p: 2, textAlign: "center", borderRadius: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "#3782C9" }}
            >
              {activities.filter((a) => a.activityType === "ai").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI Analyses
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Activity List */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
            Recent Activities
          </Typography>
          {filteredActivities.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No activities found for the selected filter.
            </Typography>
          ) : (
            <List>
              {filteredActivities.map((activity, index) => (
                <React.Fragment key={activity.activityId}>
                  <ListItem>
                    <ListItemText
                      primary={activity.activityDescription.replaceAll(
                        "_",
                        " ",
                      )}
                      secondary={
                        <Stack>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.timestamp).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            TX ID:{" "}
                            <Link
                              href={`https://hashscan.io/testnet/transaction/${activity.transactionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {activity.transactionId.split("@")[1]}
                            </Link>
                          </Typography>
                        </Stack>
                      }
                    />
                    <Box sx={{ textAlign: "right" }}>
                      <Chip
                        label={activity.activityType.toUpperCase()}
                        size="small"
                        sx={{
                          fontSize: 10,
                          backgroundColor: `${getActivityTypeColor(activity.activityType)}50`,
                          border: `1px solid ${getActivityTypeColor(activity.activityType)}`,
                          color: `#0E1133`,
                        }}
                      />
                    </Box>
                  </ListItem>
                  {index < filteredActivities.length - 1 && (
                    <Box
                      sx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        mx: 2,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ActivityTab;
