import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Paper,
  IconButton,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Upload as UploadIcon,
  Star as StarIcon,
  Science as ScienceIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  MonetizationOn as IncentiveIcon,
} from "@mui/icons-material";
import { useWalletInterface } from "../services/wallets/useWalletInterface";

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "consent":
        return <CheckIcon color="success" />;
      case "data":
        return <UploadIcon color="primary" />;
      case "reward":
        return <StarIcon color="secondary" />;
      case "incentive":
        return <IncentiveIcon color="warning" />;
      case "ai":
        return <ScienceIcon color="info" />;
      default:
        return <HistoryIcon color="action" />;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "consent":
        return "success";
      case "data":
        return "primary";
      case "reward":
        return "secondary";
      case "incentive":
        return "warning";
      case "ai":
        return "info";
      default:
        return "default";
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

      {/* Activity Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Activities" />
          <Tab label="Consent" />
          <Tab label="Data" />
          <Tab label="Incentives" />
          <Tab label="AI" />
        </Tabs>
      </Paper>

      {/* Activity Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography
              variant="h4"
              color="success.main"
              sx={{ fontWeight: "bold" }}
            >
              {activities.filter((a) => a.activityType === "consent").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Consent Events
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography
              variant="h4"
              color="warning.main"
              sx={{ fontWeight: "bold" }}
            >
              {activities.filter((a) => a.activityType === "incentive").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Incentives Earned
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography
              variant="h4"
              color="info.main"
              sx={{ fontWeight: "bold" }}
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
      <Card>
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
                    <ListItemIcon>
                      {getActivityIcon(activity.activityType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.activityDescription}
                      secondary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 1,
                          }}
                        >
                          <Chip
                            label={activity.activityType}
                            size="small"
                            color={
                              getActivityTypeColor(activity.activityType) as any
                            }
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        TX:{" "}
                        {activity.transactionId.split("@")[1]?.substring(0, 8)}
                        ...
                      </Typography>
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
