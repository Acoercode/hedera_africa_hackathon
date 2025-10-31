import React from "react";
import {
  Box,
  Typography,
  Card,
  Alert,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  School as SchoolIcon,
  LibraryBooks as LibraryBooksIcon,
  Science as ScienceIcon,
  Article as ArticleIcon,
} from "@mui/icons-material";
import { ResearchFeed } from "./ResearchFeed";
import { PubMedFeed } from "./PubMedFeed";
import { useUser } from "../contexts/UserContext";

interface ResourcesTabProps {
  condition?: string;
  clinvarResults?: any[];
  researchArticles?: any[];
  africanPopulationData?: any[];
  onGenerateClinVarInsights?: () => void;
  clinvarLoading?: boolean;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  condition,
  clinvarResults = [],
  researchArticles = [],
  africanPopulationData = [],
  onGenerateClinVarInsights,
  clinvarLoading = false,
}) => {
  const { genomicData } = useUser();

  // Use condition from props or from genomicData
  const userCondition = condition || genomicData?.condition;

  const hasData =
    userCondition && (researchArticles.length > 0 || clinvarResults.length > 0);

  return (
    <Box>
      {/* Header */}
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
        <LibraryBooksIcon sx={{ fontSize: 32, color: "#3F37C9", mr: 2 }} />
        <Box>
          <Typography variant="h5" color="#0d0d0d" sx={{ fontWeight: "bold" }}>
            Research Resources
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Discover the latest research related to your condition
          </Typography>
        </Box>
      </Box>

      {!userCondition ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Research resources will appear here once your condition information
            is available. Please ensure your genomic data has been synced and
            your condition is recorded.
          </Typography>
        </Alert>
      ) : (
        <>
          <Card
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: "#f5f5f5",
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <SchoolIcon sx={{ color: "#3F37C9", mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                Researching: {userCondition}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              We're automatically finding the latest research papers and
              clinical data related to your condition from ResearchHub, PubMed,
              and ClinVar.
            </Typography>
          </Card>

          {/* ResearchHub Section - At the top */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <LibraryBooksIcon
                sx={{ color: "#3F37C9", mr: 1, fontSize: 24 }}
              />
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#0d0d0d" }}
              >
                ResearchHub Papers
              </Typography>
            </Box>
            <ResearchFeed condition={userCondition} maxResults={10} />
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* PubMed Articles Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ArticleIcon sx={{ color: "#1976d2", mr: 1, fontSize: 24 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#0d0d0d" }}
              >
                PubMed Research Articles
              </Typography>
            </Box>
            {!hasData && !clinvarLoading && (
              <Alert
                severity="info"
                sx={{ mb: 2 }}
                action={
                  onGenerateClinVarInsights ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={onGenerateClinVarInsights}
                      disabled={clinvarLoading}
                      startIcon={
                        clinvarLoading ? (
                          <CircularProgress size={16} />
                        ) : (
                          <ScienceIcon />
                        )
                      }
                    >
                      {clinvarLoading ? "Analyzing..." : "Generate Insights"}
                    </Button>
                  ) : null
                }
              >
                <Typography variant="body2">
                  Click "Generate Insights" to fetch PubMed articles and ClinVar
                  data related to your genetic variants.
                </Typography>
              </Alert>
            )}
            {clinvarLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 2 }}
                >
                  Fetching research articles and clinical data...
                </Typography>
              </Box>
            )}
            {researchArticles.length > 0 && (
              <PubMedFeed researchArticles={researchArticles} maxResults={10} />
            )}
            {!clinvarLoading && researchArticles.length === 0 && hasData && (
              <Alert severity="info">
                <Typography variant="body2">
                  No PubMed articles found for your condition yet. Try
                  generating insights to search for relevant research.
                </Typography>
              </Alert>
            )}
          </Box>

          {/* ClinVar Variants Section */}
          {clinvarResults.length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <ScienceIcon sx={{ color: "#2E7D32", mr: 1, fontSize: 24 }} />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "#0d0d0d" }}
                  >
                    ClinVar Genetic Variants
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 2 }}
                  >
                    ({clinvarResults.length} variants found)
                  </Typography>
                </Box>
                <Card sx={{ p: 2, borderRadius: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Your genomic data has been analyzed and matched against
                    ClinVar, the public archive of genetic variants and their
                    relationships to human health.
                  </Typography>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      {clinvarResults.length} genetic variant
                      {clinvarResults.length !== 1 ? "s" : ""} found in your
                      data. View the full assessment on your Profile tab to see
                      detailed clinical significance, pathogenicity, and disease
                      associations.
                    </Typography>
                  </Alert>
                </Card>
              </Box>
            </>
          )}

          {/* African Population Data Section */}
          {africanPopulationData.length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <SchoolIcon sx={{ color: "#FF9800", mr: 1, fontSize: 24 }} />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "#0d0d0d" }}
                  >
                    African Population Data
                  </Typography>
                </Box>
                <Card sx={{ p: 2, borderRadius: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Population-specific data relevant to African populations for
                    the diseases associated with your genetic variants.
                  </Typography>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      {africanPopulationData.length} disease
                      {africanPopulationData.length !== 1 ? "s" : ""} with
                      African population data found. This information can help
                      provide context for genetic findings specific to African
                      ancestry populations.
                    </Typography>
                  </Alert>
                </Card>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
};
