import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Alert,
  Button,
  CircularProgress,
  Stack,
  Divider,
  Tooltip,
  LinearProgress,
  Paper,
  AlertColor,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Science as ScienceIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  LocalHospital as HospitalIcon,
  School as EducationIcon,
  FamilyRestroom as FamilyIcon,
  TrendingUp as TrendingIcon,
  Help as HelpIcon,
  OpenInNew as OpenInNewIcon,
  Article as ArticleIcon,
  Link as LinkIcon,
  Psychology as PsychologyIcon,
  Biotech as BiotechIcon,
  Public as PublicIcon,
} from "@mui/icons-material";

interface ClinVarResult {
  variantId: string;
  clinicalSignificance: string;
  reviewStatus: string;
  geneSymbol: string;
  variantName: string;
  diseaseName: string;
  omimId: string | null;
  evidenceLevel: string;
  lastUpdated: string;
  submitters: string[];
  searchQuery?: string;
  searchType?: string;
  searchSource?: string;
  isFallback?: boolean;
}

interface ClinVarInsightsSummary {
  totalVariants: number;
  pathogenicVariants: number;
  likelyPathogenicVariants: number;
  vusVariants: number;
  benignVariants: number;
  expertPanelReviewed: number;
  africanRelevantVariants: number;
  highPriorityVariants: ClinVarResult[];
  diseaseAssociations: string[];
  recommendations: string[];
  hasMatchingDiagnosis?: boolean;
  existingDiagnosis?: string;
}

interface AfricanPopulationData {
  disease: string;
  prevalence: number;
  countries: string[];
  riskFactors: string[];
  recommendations: string[];
}

interface ResearchArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  abstract: string;
  keywords: string[];
  meshTerms: string[];
  url: string;
  relevanceScore: number;
  searchQuery?: string;
  searchType?: string;
  searchPriority?: string;
  isFallback?: boolean;
}

// User-Friendly Risk Assessment Summary Component
export const RiskAssessmentSummary: React.FC<{
  summary: ClinVarInsightsSummary | null;
  onGenerateInsights?: () => void;
  loading?: boolean;
}> = ({ summary, onGenerateInsights, loading = false }) => {
  const getRiskLevel = () => {
    if (!summary) return "UNKNOWN";
    if (summary.pathogenicVariants > 0) return "HIGH";
    if (summary.likelyPathogenicVariants > 0) return "MODERATE";
    if (summary.vusVariants > 0) return "UNCERTAIN";
    return "LOW";
  };

  const getRiskInfo = (level: string) => {
    switch (level) {
      case "HIGH":
        return {
          color: "error",
          icon: <WarningIcon />,
          title: "High Risk",
          description: "Important genetic findings detected",
          action: "See a doctor soon",
          bgColor: "#ffebee",
        };
      case "MODERATE":
        return {
          color: "warning",
          icon: <InfoIcon />,
          title: "Moderate Risk",
          description: "Some genetic concerns found",
          action: "Consider genetic counseling",
          bgColor: "#fff3e0",
        };
      case "UNCERTAIN":
        return {
          color: "info",
          icon: <HelpIcon />,
          title: "Uncertain Results",
          description: "More research needed",
          action: "Monitor and follow up",
          bgColor: "#e3f2fd",
        };
      case "LOW":
        return {
          color: "success",
          icon: <CheckCircleIcon />,
          title: "Low Risk",
          description: "No major genetic concerns",
          action: "Continue regular checkups",
          bgColor: "#e8f5e8",
        };
      default:
        return {
          color: "default",
          icon: <ScienceIcon />,
          title: "Not Analyzed",
          description: "Your genetic data needs analysis",
          action: "Get your assessment",
          bgColor: "#f5f5f5",
        };
    }
  };

  const riskLevel = getRiskLevel();
  const riskInfo = getRiskInfo(riskLevel);

  return (
    <Card sx={{ mb: 2, borderRadius: 3, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "50%",
                backgroundColor: riskInfo.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {riskInfo.icon}
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: `${riskInfo.color}.main` }}
              >
                {riskInfo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {riskInfo.description}
              </Typography>
            </Box>
          </Box>
          {onGenerateInsights && (
            <Button
              variant="contained"
              size="large"
              onClick={onGenerateInsights}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <ScienceIcon />
              }
              sx={{
                backgroundColor: "#2E7D32",
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              {loading ? "Analyzing Your DNA..." : "Get My Health Report"}
            </Button>
          )}
        </Box>

        {!summary && !loading && (
          <Paper
            sx={{ p: 3, backgroundColor: "#f8f9fa", borderRadius: 2, mb: 2 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <EducationIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Ready to Learn About Your Health?
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              We can analyze your genetic data to help you understand your
              health risks and what you can do about them.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Get My Health Report" to start your personalized genetic
              health analysis.
            </Typography>
          </Paper>
        )}

        {summary && (
          <>
            {/* Main Risk Display */}
            <Paper
              sx={{
                p: 3,
                backgroundColor: riskInfo.bgColor,
                borderRadius: 2,
                mb: 3,
                border: `2px solid ${riskInfo.color === "error" ? "#f44336" : riskInfo.color === "warning" ? "#ff9800" : riskInfo.color === "info" ? "#2196f3" : "#4caf50"}`,
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                {riskInfo.icon}
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  What This Means for You
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {riskInfo.action}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  riskLevel === "HIGH"
                    ? 90
                    : riskLevel === "MODERATE"
                      ? 60
                      : riskLevel === "UNCERTAIN"
                        ? 40
                        : 10
                }
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(0,0,0,0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      riskInfo.color === "error"
                        ? "#f44336"
                        : riskInfo.color === "warning"
                          ? "#ff9800"
                          : riskInfo.color === "info"
                            ? "#2196f3"
                            : "#4caf50",
                  },
                }}
              />
            </Paper>

            {/* Simple Stats Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    borderRadius: 2,
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography
                    variant="h4"
                    color="error"
                    sx={{ fontWeight: "bold" }}
                  >
                    {(summary.pathogenicVariants || 0) +
                      (summary.likelyPathogenicVariants || 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    Important Findings
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Need attention
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    borderRadius: 2,
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography
                    variant="h4"
                    color="info.main"
                    sx={{ fontWeight: "bold" }}
                  >
                    {summary.vusVariants || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    Uncertain Results
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    More research needed
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    borderRadius: 2,
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography
                    variant="h4"
                    color="success.main"
                    sx={{ fontWeight: "bold" }}
                  >
                    {summary.africanRelevantVariants || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    African-Specific
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Relevant to your background
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    borderRadius: 2,
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography
                    variant="h4"
                    color="primary.main"
                    sx={{ fontWeight: "bold" }}
                  >
                    {summary.expertPanelReviewed || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    Expert Reviewed
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    High confidence
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Simple Recommendations */}
            {summary.recommendations && summary.recommendations.length > 0 && (
              <Alert
                severity={
                  riskLevel === "HIGH"
                    ? "error"
                    : riskLevel === "MODERATE"
                      ? "warning"
                      : "info"
                }
                sx={{ borderRadius: 2 }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <HospitalIcon />
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    What You Should Do Next:
                  </Typography>
                </Box>
                {summary.recommendations.slice(0, 3).map((rec, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    {index + 1}.{" "}
                    {rec
                      .replace(
                        /Immediate medical consultation recommended for variant.*?- /,
                        "See a doctor about ",
                      )
                      .replace(
                        /Consult with a genetic counselor for variant.*?- /,
                        "Talk to a genetic counselor about ",
                      )}
                  </Typography>
                ))}
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Compact Assessment Notification Component
export const AssessmentNotification: React.FC<{
  summary: ClinVarInsightsSummary | null;
  onViewAssessment?: () => void;
  onGenerateInsights?: () => void;
  loading?: boolean;
  existingDiagnosis?: string;
}> = ({
  summary,
  onViewAssessment,
  onGenerateInsights,
  loading = false,
  existingDiagnosis,
}) => {
  // If no assessment exists, show a compact informative panel with Get Started button
  if (!summary) {
    return (
      <Paper
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          backgroundColor: "#f8f9fa",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: "50%",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: 1,
            }}
          >
            <ScienceIcon sx={{ color: "#2E7D32", fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "bold",
                fontSize: "0.9rem",
                color: "#2D3748",
                mb: 0.25,
              }}
            >
              Genetic Assessment Available
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: "0.75rem",
              }}
            >
              Get your personalized health report
            </Typography>
          </Box>
          {onGenerateInsights ? (
            <Button
              variant="contained"
              size="small"
              onClick={onGenerateInsights}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={16} /> : <ScienceIcon />
              }
              sx={{
                backgroundColor: "#2E7D32",
                borderRadius: 2,
                px: 2,
                py: 0.5,
                fontSize: "0.8rem",
                fontWeight: "bold",
                textTransform: "none",
                minWidth: "auto",
                "&:hover": {
                  backgroundColor: "#1B5E20",
                },
              }}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={onViewAssessment}
              startIcon={<ScienceIcon />}
              sx={{
                borderColor: "#2E7D32",
                color: "#2E7D32",
                borderRadius: 2,
                px: 2,
                py: 0.5,
                fontSize: "0.8rem",
                fontWeight: "bold",
                textTransform: "none",
                minWidth: "auto",
                "&:hover": {
                  borderColor: "#1B5E20",
                  backgroundColor: "#f1f8e9",
                },
              }}
            >
              View
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  // If assessment exists, show a compact notification
  const getRiskLevel = () => {
    if (summary.pathogenicVariants > 0) return "HIGH";
    if (summary.likelyPathogenicVariants > 0) return "MODERATE";
    if (summary.vusVariants > 0) return "UNCERTAIN";
    return "LOW";
  };

  const riskLevel = getRiskLevel();
  const hasExistingDiagnosis =
    existingDiagnosis && summary?.hasMatchingDiagnosis;
  const highPriorityCount =
    summary.pathogenicVariants + summary.likelyPathogenicVariants;

  const getRiskInfo = (level: string) => {
    switch (level) {
      case "HIGH":
        return {
          color: hasExistingDiagnosis ? "#4caf50" : "#f44336",
          bgColor: hasExistingDiagnosis ? "#e8f5e8" : "#ffebee",
          icon: hasExistingDiagnosis ? <CheckCircleIcon /> : <WarningIcon />,
          title: hasExistingDiagnosis ? "Genetic Confirmation" : "High Risk",
        };
      case "MODERATE":
        return {
          color: "#ff9800",
          bgColor: "#fff3e0",
          icon: <InfoIcon />,
          title: "Moderate Risk",
        };
      case "UNCERTAIN":
        return {
          color: "#2196f3",
          bgColor: "#e3f2fd",
          icon: <HelpIcon />,
          title: "Uncertain Results",
        };
      case "LOW":
        return {
          color: "#4caf50",
          bgColor: "#e8f5e8",
          icon: <CheckCircleIcon />,
          title: "Low Risk",
        };
      default:
        return {
          color: "#9e9e9e",
          bgColor: "#f5f5f5",
          icon: <ScienceIcon />,
          title: "Assessment Complete",
        };
    }
  };

  const riskInfo = getRiskInfo(riskLevel);

  return (
    <Paper
      sx={{
        p: 1.5,
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${riskInfo.color}`,
        backgroundColor: riskInfo.bgColor,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: 2,
        },
      }}
      onClick={onViewAssessment}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            p: 0.75,
            borderRadius: "50%",
            backgroundColor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: 1,
          }}
        >
          {riskInfo.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: riskInfo.color,
            }}
          >
            {riskInfo.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: "0.75rem",
            }}
          >
            {summary.totalVariants} variants • {highPriorityCount} findings
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: riskInfo.color,
            fontWeight: "bold",
            fontSize: "0.75rem",
          }}
        >
          View →
        </Typography>
      </Box>
    </Paper>
  );
};

// Detailed Evidence Component with Links
export const DetailedEvidence: React.FC<{
  clinvarResults: ClinVarResult[];
}> = ({ clinvarResults }) => {
  const getClinVarUrl = (variantId: string) => {
    return `https://www.ncbi.nlm.nih.gov/clinvar/variation/${variantId.replace("VCV", "")}/`;
  };

  const getOMIMUrl = (omimId: string) => {
    return `https://www.omim.org/entry/${omimId}`;
  };

  const getGeneUrl = (geneSymbol: string) => {
    return `https://www.ncbi.nlm.nih.gov/gene/?term=${geneSymbol}`;
  };

  const getEvidenceLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "success";
      case "moderate":
        return "warning";
      case "low":
        return "error";
      default:
        return "default";
    }
  };

  const getReviewStatusColor = (status: string) => {
    if (
      status.includes("Expert Panel") ||
      status.includes("Practice Guideline")
    )
      return "success";
    if (status.includes("Multiple Submitters")) return "warning";
    return "default";
  };

  if (clinvarResults.length === 0) {
    return (
      <Card sx={{ mb: 2, borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <ArticleIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Scientific Evidence
            </Typography>
          </Box>
          <Alert severity="info">
            No detailed evidence available. Run a genetic analysis to see
            scientific evidence for your variants.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2, borderRadius: 3, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: "50%",
              backgroundColor: "#e3f2fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArticleIcon color="primary" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Scientific Evidence & Sources
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Explore the research behind your genetic findings
            </Typography>
          </Box>
        </Box>

        <Stack spacing={3}>
          {clinvarResults.map((result, index) => (
            <Paper
              key={index}
              sx={{ p: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                    {result.geneSymbol} - {result.variantName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {result.diseaseName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip
                    label={result.clinicalSignificance}
                    color={
                      result.clinicalSignificance === "Pathogenic"
                        ? "error"
                        : result.clinicalSignificance === "Likely Pathogenic"
                          ? "warning"
                          : "info"
                    }
                    size="small"
                  />
                  <Chip
                    label={result.evidenceLevel}
                    color={getEvidenceLevelColor(result.evidenceLevel)}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Evidence Quality Indicators */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  Evidence Quality:
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Chip
                    icon={<PsychologyIcon />}
                    label={result.reviewStatus}
                    color={getReviewStatusColor(result.reviewStatus)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<ArticleIcon />}
                    label={`${result.submitters.length} source${result.submitters.length > 1 ? "s" : ""}`}
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<LinkIcon />}
                    label={`Updated: ${new Date(result.lastUpdated).toLocaleDateString()}`}
                    color="default"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* External Links */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  Explore the Research:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNewIcon />}
                    href={getClinVarUrl(result.variantId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ borderRadius: 2 }}
                  >
                    View in ClinVar
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNewIcon />}
                    href={getGeneUrl(result.geneSymbol)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ borderRadius: 2 }}
                  >
                    Gene Information
                  </Button>
                  {result.omimId && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<OpenInNewIcon />}
                      href={getOMIMUrl(result.omimId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ borderRadius: 2 }}
                    >
                      Disease Database
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Detailed Information */}
              <Accordion
                sx={{ boxShadow: "none", border: "1px solid #e0e0e0" }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    Technical Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Variant ID:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "monospace",
                          backgroundColor: "#f5f5f5",
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        {result.variantId}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Review Status:
                      </Typography>
                      <Typography variant="body2">
                        {result.reviewStatus}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Evidence Level:
                      </Typography>
                      <Typography variant="body2">
                        {result.evidenceLevel}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Contributing Organizations:
                      </Typography>
                      <Typography variant="body2">
                        {result.submitters.join(", ")}
                      </Typography>
                    </Box>
                    {result.isFallback && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          This data represents typical findings for this
                          condition. For real-time data, visit the ClinVar
                          database directly using the links above.
                        </Typography>
                      </Alert>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Paper>
          ))}
        </Stack>

        {/* Educational Footer */}
        <Paper
          sx={{ p: 2, mt: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <EducationIcon color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              Understanding Your Results
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • <strong>ClinVar</strong> is the world's largest database of
            genetic variants and their clinical significance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • <strong>Evidence Level</strong> indicates how confident scientists
            are about the variant's effects
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • <strong>Review Status</strong> shows how many expert groups have
            evaluated this variant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Always discuss these findings with a healthcare provider for
            personalized medical advice
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
};

// User-Friendly Health Concerns Component
export const AssociatedRisks: React.FC<{
  clinvarResults: ClinVarResult[];
  africanPopulationData: AfricanPopulationData[];
}> = ({ clinvarResults, africanPopulationData }) => {
  const highPriorityVariants = clinvarResults.filter(
    (result) =>
      result.clinicalSignificance === "Pathogenic" ||
      result.clinicalSignificance === "Likely Pathogenic",
  );

  const getRiskLevel = (significance: string) => {
    switch (significance) {
      case "Pathogenic":
        return { level: "High", color: "error", icon: <WarningIcon /> };
      case "Likely Pathogenic":
        return { level: "Moderate", color: "warning", icon: <InfoIcon /> };
      default:
        return { level: "Low", color: "info", icon: <HelpIcon /> };
    }
  };

  return (
    <Card sx={{ mb: 2, borderRadius: 3, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: "50%",
              backgroundColor: "#fff3e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WarningIcon color="warning" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Your Health Concerns
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Important genetic findings that may affect your health
            </Typography>
          </Box>
        </Box>

        {highPriorityVariants.length === 0 &&
        africanPopulationData.length === 0 ? (
          <Paper sx={{ p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <CheckCircleIcon color="success" />
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "success.main" }}
              >
                Good News!
              </Typography>
            </Box>
            <Typography variant="body1">
              No major genetic health concerns were found in your analysis. Keep
              up with regular health checkups!
            </Typography>
          </Paper>
        ) : (
          <>
            {highPriorityVariants.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <TrendingIcon color="primary" />
                  Important Health Findings
                </Typography>
                <Stack spacing={2}>
                  {highPriorityVariants.map((result, index) => {
                    const riskInfo = getRiskLevel(result.clinicalSignificance);
                    return (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `2px solid ${riskInfo.color === "error" ? "#f44336" : "#ff9800"}`,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 1,
                          }}
                        >
                          {riskInfo.icon}
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            {result.diseaseName}
                          </Typography>
                          <Chip
                            label={riskInfo.level + " Risk"}
                            size="small"
                            sx={{ fontWeight: "bold", color: riskInfo.color }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          <strong>Gene:</strong> {result.geneSymbol} •{" "}
                          <strong>Confidence:</strong> {result.evidenceLevel}
                        </Typography>
                        <Alert
                          severity={riskInfo.color as AlertColor}
                          sx={{ borderRadius: 1 }}
                        >
                          <Typography variant="body2">
                            {result.clinicalSignificance === "Pathogenic"
                              ? "This finding requires immediate medical attention. Please see a doctor soon."
                              : "This finding suggests you should consider genetic counseling and regular monitoring."}
                          </Typography>
                        </Alert>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {africanPopulationData.length > 0 && (
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <FamilyIcon color="primary" />
                  African Population Health Context
                </Typography>
                <Stack spacing={2}>
                  {africanPopulationData.map((data, index) => (
                    <Paper
                      key={index}
                      sx={{ p: 2, borderRadius: 2, backgroundColor: "#f0f8ff" }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        {data.disease}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Prevalence in African populations:</strong>{" "}
                        {data.prevalence}% in {data.countries.join(", ")}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>What you can do:</strong>{" "}
                        {data.recommendations.join(", ")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        This information helps you understand how common this
                        condition is in people with similar genetic backgrounds.
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Clinical Evidence Component
export const ClinicalEvidence: React.FC<{
  clinvarResults: ClinVarResult[];
}> = ({ clinvarResults }) => {
  const expertPanelReviewed = clinvarResults.filter(
    (result) => result.reviewStatus === "Expert Panel",
  );

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
        >
          <InfoIcon color="info" />
          Clinical Evidence
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, backgroundColor: "#e3f2fd", borderRadius: 2 }}>
              <Typography variant="h6" color="info.main">
                {expertPanelReviewed.length}
              </Typography>
              <Typography variant="body2">
                Expert Panel Reviewed Variants
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, backgroundColor: "#f3e5f5", borderRadius: 2 }}>
              <Typography variant="h6" color="secondary.main">
                {clinvarResults.length}
              </Typography>
              <Typography variant="body2">Total Variants Analyzed</Typography>
            </Box>
          </Grid>
        </Grid>

        {expertPanelReviewed.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Expert Panel Reviewed Variants:
            </Typography>
            {expertPanelReviewed.map((result, index) => (
              <Box
                key={index}
                sx={{
                  mb: 1,
                  p: 1,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {result.variantId} - {result.geneSymbol}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {result.clinicalSignificance} • {result.evidenceLevel}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Clinical Trials Component
export const ClinicalTrials: React.FC<{
  diseaseAssociations: string[];
}> = ({ diseaseAssociations }) => {
  // Mock clinical trials data - in production, this would come from a clinical trials API
  const mockTrials = [
    {
      id: "NCT12345678",
      title: "Sickle Cell Disease Gene Therapy Study",
      phase: "Phase II",
      status: "Recruiting",
      locations: ["Nigeria", "Ghana", "Kenya"],
      conditions: ["Sickle Cell Disease"],
      description:
        "Investigating gene therapy approaches for sickle cell disease in African populations.",
    },
    {
      id: "NCT87654321",
      title: "MTHFR Deficiency Treatment Trial",
      phase: "Phase III",
      status: "Active",
      locations: ["South Africa", "Nigeria"],
      conditions: ["MTHFR Deficiency"],
      description:
        "Evaluating folate supplementation strategies for MTHFR deficiency.",
    },
  ];

  const relevantTrials = mockTrials.filter((trial) =>
    trial.conditions.some((condition) =>
      diseaseAssociations.some(
        (disease) =>
          disease.toLowerCase().includes(condition.toLowerCase()) ||
          condition.toLowerCase().includes(disease.toLowerCase()),
      ),
    ),
  );

  if (relevantTrials.length === 0) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
          >
            <ScienceIcon color="primary" />
            Clinical Trials
          </Typography>
          <Alert severity="info">
            No relevant clinical trials found for your genetic profile.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
        >
          <ScienceIcon color="primary" />
          Relevant Clinical Trials
        </Typography>

        {relevantTrials.map((trial, index) => (
          <Accordion key={index} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  width: "100%",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {trial.title}
                </Typography>
                <Chip label={trial.phase} color="primary" size="small" />
                <Chip
                  label={trial.status}
                  color={trial.status === "Recruiting" ? "success" : "info"}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Trial ID:</strong> {trial.id}
                </Typography>
                <Typography variant="body2">
                  <strong>Description:</strong> {trial.description}
                </Typography>
                <Typography variant="body2">
                  <strong>Locations:</strong> {trial.locations.join(", ")}
                </Typography>
                <Typography variant="body2">
                  <strong>Conditions:</strong> {trial.conditions.join(", ")}
                </Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
};

// Family Planning Component
export const FamilyPlanning: React.FC<{
  clinvarResults: ClinVarResult[];
}> = ({ clinvarResults }) => {
  const inheritedConditions = clinvarResults.filter(
    (result) =>
      result.clinicalSignificance === "Pathogenic" ||
      result.clinicalSignificance === "Likely Pathogenic",
  );

  if (inheritedConditions.length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
        >
          <InfoIcon color="info" />
          Family Planning Considerations
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Your genetic profile includes variants that may be inherited by your
            children. Consider genetic counseling for family planning decisions.
          </Typography>
        </Alert>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Potentially Inheritable Conditions:
        </Typography>
        {inheritedConditions.map((result, index) => (
          <Box
            key={index}
            sx={{ mb: 1, p: 1, backgroundColor: "#f5f5f5", borderRadius: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {result.variantId} - {result.geneSymbol}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {result.diseaseName}
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary">
          <strong>Recommendations:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          • Consult with a genetic counselor before family planning
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          • Consider carrier screening for your partner
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          • Discuss prenatal testing options with your healthcare provider
        </Typography>
      </CardContent>
    </Card>
  );
};

// Latest Research Articles Component
export const LatestResearch: React.FC<{
  researchArticles: ResearchArticle[];
}> = ({ researchArticles }) => {
  if (!researchArticles || researchArticles.length === 0) {
    return (
      <Card sx={{ mb: 2, borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <ArticleIcon sx={{ color: "#1976d2", fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Latest Research
            </Typography>
          </Box>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              No recent research articles found for this condition. Check back
              later for updates.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 8) return "#4caf50"; // Green
    if (score >= 6) return "#ff9800"; // Orange
    if (score >= 4) return "#ff5722"; // Red-orange
    return "#9e9e9e"; // Gray
  };

  const getSearchTypeIcon = (type?: string) => {
    switch (type) {
      case "treatment":
        return <HospitalIcon />;
      case "clinical_trial":
        return <ScienceIcon />;
      case "gene_therapy":
        return <BiotechIcon />;
      case "latest_research":
        return <TrendingIcon />;
      case "population_study":
        return <PublicIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  return (
    <Card sx={{ mb: 2, borderRadius: 3, boxShadow: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <ArticleIcon sx={{ color: "#1976d2", fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Latest Research
          </Typography>
          <Chip
            label={`${researchArticles.length} articles`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Stack spacing={3}>
          {researchArticles.slice(0, 5).map((article, index) => (
            <Paper
              key={article.pmid}
              sx={{ p: 3, borderRadius: 2, border: "1px solid #e0e0e0" }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", mb: 1, lineHeight: 1.3 }}
                  >
                    {article.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    <strong>Authors:</strong>{" "}
                    {article.authors.slice(0, 3).join(", ")}
                    {article.authors.length > 3 && " et al."}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    <strong>Journal:</strong> {article.journal} •{" "}
                    <strong>Published:</strong> {article.pubDate}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    ml: 2,
                  }}
                >
                  <Chip
                    icon={getSearchTypeIcon(article.searchType)}
                    label={article.searchType?.replace("_", " ") || "Research"}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: getRelevanceColor(
                        article.relevanceScore,
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                    }}
                  >
                    {article.relevanceScore}/10
                  </Box>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.5 }}>
                {article.abstract.length > 300
                  ? `${article.abstract.substring(0, 300)}...`
                  : article.abstract}
              </Typography>

              {article.keywords && article.keywords.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: "bold", display: "block", mb: 1 }}
                  >
                    Keywords:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {article.keywords.slice(0, 5).map((keyword, idx) => (
                      <Chip
                        key={idx}
                        label={keyword}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ borderRadius: 2 }}
                >
                  Read Full Article
                </Button>
                <Typography variant="caption" color="text.secondary">
                  PMID: {article.pmid}
                </Typography>
                {article.isFallback && (
                  <Chip
                    label="Fallback Data"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
            </Paper>
          ))}
        </Stack>

        {researchArticles.length > 5 && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            <Typography variant="body2">
              Showing top 5 most relevant articles.{" "}
              {researchArticles.length - 5} more articles available.
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>About Research Articles:</strong> These articles are sourced
            from PubMed, the world's largest biomedical literature database.
            They represent the latest peer-reviewed research relevant to your
            genetic findings. Always consult with healthcare professionals
            before making medical decisions based on research findings.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
