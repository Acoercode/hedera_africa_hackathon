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
    <Box
      sx={{
        p: { xs: 1, sm: 2 },
        maxWidth: "800px",
        mx: "auto",
        minHeight: "100vh",
        backgroundColor: { xs: "#f8f9fa", sm: "transparent" },
      }}
    >
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

      {/* Simple Status Overview - Mobile Optimized */}
      {simplifiedSummary && clinvarResults.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2 },
                mb: { xs: 1.5, sm: 2 },
                flexDirection: { xs: "row", sm: "row" },
                textAlign: "left",
              }}
            >
              {simplifiedSummary.hasHighRisk ? (
                <WarningIcon
                  sx={{
                    color: "#f44336",
                    fontSize: { xs: 24, sm: 32 },
                    flexShrink: 0,
                  }}
                />
              ) : (
                <CheckCircleIcon
                  sx={{
                    color: "#4caf50",
                    fontSize: { xs: 24, sm: 32 },
                    flexShrink: 0,
                  }}
                />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    fontSize: { xs: "1.25rem", sm: "1.75rem" },
                    lineHeight: 1.2,
                    mb: 0.5,
                  }}
                >
                  {simplifiedSummary.hasHighRisk
                    ? "Action Needed"
                    : "All Clear"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: "0.8rem", sm: "1rem" },
                    lineHeight: 1.3,
                  }}
                >
                  {simplifiedSummary.hasHighRisk
                    ? `${simplifiedSummary.highPriorityCount} genetic finding${simplifiedSummary.highPriorityCount > 1 ? "s" : ""} need${simplifiedSummary.highPriorityCount === 1 ? "s" : ""} attention`
                    : "No high-risk genetic findings detected"}
                </Typography>
              </Box>
            </Box>

            {/* Mobile-friendly statistics */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: { xs: 1.5, sm: 2 },
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1, sm: 0 },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  color: "text.secondary",
                }}
              >
                {simplifiedSummary.totalVariants} variants analyzed
              </Typography>
              {simplifiedSummary.hasHighRisk && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                    color: "#f44336",
                  }}
                >
                  {simplifiedSummary.highPriorityCount} important findings
                </Typography>
              )}
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

      {/* Main Conditions (Only show top 3) - Mobile Optimized */}
      {simplifiedSummary?.mainConditions.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: { xs: 1.5, sm: 2 },
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              <LocalHospitalIcon
                sx={{ color: "primary.main", fontSize: { xs: 18, sm: 24 } }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.25rem" },
                    lineHeight: 1.2,
                  }}
                >
                  Conditions to Discuss with Your Doctor
                </Box>
              </Box>
            </Typography>
            <Stack spacing={1.5}>
              {simplifiedSummary?.mainConditions.map(
                (condition: string, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      p: { xs: 1.25, sm: 2 },
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                      backgroundColor: { xs: "#fafafa", sm: "transparent" },
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: "bold",
                        mb: 0.75,
                        fontSize: { xs: "0.9rem", sm: "1.1rem" },
                        lineHeight: 1.3,
                      }}
                    >
                      {condition}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        lineHeight: 1.4,
                      }}
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

      {/* Simple Recommendations - Mobile Optimized */}
      {simplifiedSummary?.recommendations.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: { xs: 1.5, sm: 2 },
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              <InfoIcon
                sx={{ color: "primary.main", fontSize: { xs: 18, sm: 24 } }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.25rem" },
                    lineHeight: 1.2,
                  }}
                >
                  What You Should Do Next
                </Box>
              </Box>
            </Typography>
            <Stack spacing={1.25}>
              {simplifiedSummary?.recommendations.map(
                (recommendation: string, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      p: { xs: 1, sm: 0 },
                      backgroundColor: { xs: "#f8f9fa", sm: "transparent" },
                      borderRadius: { xs: 1, sm: 0 },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "primary.main",
                        fontWeight: "bold",
                        minWidth: "18px",
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}.
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        lineHeight: 1.4,
                      }}
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

      {/* Simple Research Section - Mobile Optimized */}
      {researchArticles && researchArticles.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mb: { xs: 1.5, sm: 2 },
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              <ScienceIcon
                sx={{ color: "primary.main", fontSize: { xs: 18, sm: 24 } }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.25rem" },
                    lineHeight: 1.2,
                  }}
                >
                  Latest Research
                </Box>
              </Box>
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                lineHeight: 1.3,
              }}
            >
              Here are some recent studies that might be relevant to your
              genetic findings:
            </Typography>
            <Stack spacing={1.5}>
              {researchArticles
                ?.slice(0, 2)
                .map((article: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      p: { xs: 1.25, sm: 2 },
                      border: "1px solid #e0e0e0",
                      borderRadius: 2,
                      backgroundColor: { xs: "#fafafa", sm: "transparent" },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: "bold",
                        mb: 0.75,
                        fontSize: { xs: "0.85rem", sm: "1rem" },
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
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
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
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        minHeight: { xs: "32px", sm: "36px" },
                        px: { xs: 1.5, sm: 2 },
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

      {/* Simple Disclaimer - Mobile Optimized */}
      <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            lineHeight: 1.4,
          }}
        >
          <strong>Remember:</strong> This assessment is based on your genetic
          data and should not replace professional medical advice. Always
          consult with your healthcare provider about any concerns.
        </Typography>
      </Alert>
    </Box>
  );
};
