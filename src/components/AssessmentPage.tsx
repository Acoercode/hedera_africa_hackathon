import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Stack,
  Divider,
  Alert,
  Chip,
  Grid,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Science as ScienceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  LocalHospital as LocalHospitalIcon,
} from "@mui/icons-material";
import {
  RiskAssessmentSummary,
  ClinicalEvidence,
  FamilyPlanning,
  DetailedEvidence,
  LatestResearch,
} from "./ClinVarComponents";

interface AssessmentPageProps {
  clinvarSummary: any;
  clinvarResults: any[];
  africanPopulationData: any[];
  researchArticles: any[];
  onGenerateClinVarInsights?: () => void;
  clinvarLoading?: boolean;
  onBack?: () => void;
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({
  clinvarSummary,
  clinvarResults,
  africanPopulationData,
  researchArticles,
  onGenerateClinVarInsights,
  clinvarLoading = false,
  onBack,
}) => {
  // Simplify the data to show only what matters
  const getSimplifiedSummary = () => {
    if (!clinvarSummary) return null;

    const highPriorityCount =
      clinvarSummary.pathogenicVariants +
      clinvarSummary.likelyPathogenicVariants;
    const totalVariants = clinvarSummary.totalVariants;

    return {
      highPriorityCount,
      totalVariants,
      hasHighRisk: highPriorityCount > 0,
      mainConditions: clinvarSummary.diseaseAssociations?.slice(0, 3) || [],
      recommendations: clinvarSummary.recommendations?.slice(0, 3) || [],
    };
  };

  const simplifiedSummary = getSimplifiedSummary();

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: "800px", mx: "auto" }}>
      {/* Header - Mobile Friendly */}
      <Box sx={{ mb: 4 }}>
        {/* Back Button Row */}
        {onBack && (
          <Box sx={{ mb: 2 }}>
            <IconButton
              onClick={onBack}
              sx={{
                color: "primary.main",
                p: 1,
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>
        )}

        {/* Title Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: "50%",
              backgroundColor: "#e3f2fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ScienceIcon color="primary" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "1.75rem", sm: "2.125rem" },
                lineHeight: 1.2,
              }}
            >
              Your Genetic Health Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Simple, clear insights about your genetic data
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Loading State */}
      {clinvarLoading && (
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Box
              sx={{
                p: 2,
                borderRadius: "50%",
                backgroundColor: "#e3f2fd",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <CircularProgress size={40} color="primary" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
              Analyzing Your Genetic Data
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're searching ClinVar database and latest research to provide
              you with personalized insights...
            </Typography>

            {/* Loading Skeleton */}
            <Stack spacing={2} sx={{ maxWidth: "400px", mx: "auto" }}>
              <Skeleton
                variant="rectangular"
                height={60}
                sx={{ borderRadius: 2 }}
              />
              <Skeleton
                variant="rectangular"
                height={60}
                sx={{ borderRadius: 2 }}
              />
              <Skeleton
                variant="rectangular"
                height={60}
                sx={{ borderRadius: 2 }}
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {clinvarResults.length === 0 && !clinvarLoading && (
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Box
              sx={{
                p: 2,
                borderRadius: "50%",
                backgroundColor: "#f5f5f5",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <ScienceIcon sx={{ fontSize: 40, color: "text.secondary" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
              No Assessment Available
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Run a genetic analysis to get your personalized health assessment
            </Typography>
            {onGenerateClinVarInsights && (
              <Button
                variant="contained"
                size="large"
                onClick={onGenerateClinVarInsights}
                disabled={clinvarLoading}
                startIcon={<ScienceIcon />}
                sx={{
                  backgroundColor: "#2E7D32",
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                }}
              >
                Start My Assessment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Simple Status Overview */}
      {simplifiedSummary && clinvarResults.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
                flexDirection: { xs: "column", sm: "row" },
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              {simplifiedSummary.hasHighRisk ? (
                <WarningIcon
                  sx={{ color: "#f44336", fontSize: { xs: 28, sm: 32 } }}
                />
              ) : (
                <CheckCircleIcon
                  sx={{ color: "#4caf50", fontSize: { xs: 28, sm: 32 } }}
                />
              )}
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    fontSize: { xs: "1.5rem", sm: "1.75rem" },
                  }}
                >
                  {simplifiedSummary.hasHighRisk
                    ? "Action Needed"
                    : "All Clear"}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                >
                  {simplifiedSummary.hasHighRisk
                    ? `${simplifiedSummary.highPriorityCount} genetic finding${simplifiedSummary.highPriorityCount > 1 ? "s" : ""} need${simplifiedSummary.highPriorityCount === 1 ? "s" : ""} attention`
                    : "No high-risk genetic findings detected"}
                </Typography>
              </Box>
            </Box>

            {simplifiedSummary?.hasHighRisk && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> These findings don't mean you will
                  definitely develop these conditions. They indicate an
                  increased risk that you should discuss with your healthcare
                  provider.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Conditions (Only show top 3) */}
      {simplifiedSummary?.mainConditions.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              <LocalHospitalIcon
                sx={{ color: "primary.main", fontSize: { xs: 20, sm: 24 } }}
              />
              Conditions to Discuss with Your Doctor
            </Typography>
            <Stack spacing={2}>
              {simplifiedSummary?.mainConditions.map(
                (condition: string, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: "bold",
                        mb: 1,
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                      }}
                    >
                      {condition}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.85rem", sm: "0.875rem" } }}
                    >
                      Your genetic data shows an increased risk for this
                      condition. Talk to your doctor about screening and
                      prevention options.
                    </Typography>
                  </Box>
                ),
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Simple Recommendations */}
      {simplifiedSummary?.recommendations.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              <InfoIcon
                sx={{ color: "primary.main", fontSize: { xs: 20, sm: 24 } }}
              />
              What You Should Do Next
            </Typography>
            <Stack spacing={1}>
              {simplifiedSummary?.recommendations.map(
                (recommendation: string, index: number) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "primary.main",
                        fontWeight: "bold",
                        minWidth: "20px",
                        fontSize: { xs: "0.85rem", sm: "0.875rem" },
                      }}
                    >
                      {index + 1}.
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: "0.85rem", sm: "0.875rem" } }}
                    >
                      {recommendation}
                    </Typography>
                  </Box>
                ),
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Simple Research Section */}
      {researchArticles && researchArticles.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              <ScienceIcon
                sx={{ color: "primary.main", fontSize: { xs: 20, sm: 24 } }}
              />
              Latest Research
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                fontSize: { xs: "0.85rem", sm: "0.875rem" },
              }}
            >
              Here are some recent studies that might be relevant to your
              genetic findings:
            </Typography>
            <Stack spacing={2}>
              {researchArticles
                ?.slice(0, 2)
                .map((article: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: "bold",
                        mb: 1,
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        lineHeight: 1.3,
                      }}
                    >
                      {article.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        mb: 1,
                        fontSize: { xs: "0.75rem", sm: "0.75rem" },
                      }}
                    >
                      {article.journal} • {article.pubDate}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      href={article.url}
                      target="_blank"
                      sx={{
                        textTransform: "none",
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      Read Study
                    </Button>
                  </Box>
                ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Simple Disclaimer */}
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography
          variant="body2"
          sx={{ fontSize: { xs: "0.85rem", sm: "0.875rem" } }}
        >
          <strong>Remember:</strong> This assessment is based on your genetic
          data and should not replace professional medical advice. Always
          consult with your healthcare provider about any concerns.
        </Typography>
      </Alert>
    </Box>
  );
};
