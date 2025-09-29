import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack,
} from "@mui/material";
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { useUser } from "../contexts/UserContext";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { ReactComponent as ChatIcon } from "../assets/ai_icon_color.svg";
import { ReactComponent as FHIRIcon } from "../assets/fhir_icon.svg";
import { ReactComponent as InsightsIcon } from "../assets/trends_icon.svg";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface FHIRData {
  patient?: any;
  observations?: any[];
  diagnosticReport?: any;
  procedures?: any[];
  summary?: string;
}

const AITab: React.FC = () => {
  const { genomicData } = useUser();
  const { accountId } = useWalletInterface();
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // FHIR state
  const [fhirData, setFhirData] = useState<FHIRData | null>(null);
  const [fhirLoading, setFhirLoading] = useState(false);
  const [fhirDialogOpen, setFhirDialogOpen] = useState(false);
  const [fhirBundle, setFhirBundle] = useState<string | null>(null);

  // Insights state
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Scroll to top when AI tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const handleChatSubmit = async () => {
    if (!currentQuestion.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: currentQuestion,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentQuestion("");
    setChatLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ROOT}/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: currentQuestion,
            genomicData: genomicData,
            chatHistory: chatMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            accountId: accountId,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);

        // Show incentive info if available
        if (data.incentive) {
          if (data.incentive.success) {
            setSuccess(
              `You earned ${data.incentive.amount} RDZ incentive tokens for starting a conversation!`,
            );
          } else if (data.incentive.requiresAssociation) {
            setSuccess(
              `🎁 To earn ${data.incentive.amount} RDZ tokens:\n1. Go to the Wallet tab\n2. Click 'Associate with RDZ Token'\n3. Sign the transaction in your wallet\n4. Return here to receive your tokens!`,
            );
          }
        }
      } else {
        setError(data.error || "Failed to get AI response");
      }
    } catch (err) {
      setError("Failed to connect to AI service");
      console.error("Chat error:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFHIRTranslation = async () => {
    if (!genomicData) {
      setError("No genomic data available for FHIR translation");
      return;
    }

    setFhirLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ROOT}/ai/translate-fhir`,
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
        setFhirData(data.fhirData);
        setFhirBundle(data.rawResponse);
        setFhirDialogOpen(true);

        // Show success message with incentive info
        let successMessage =
          "Genomic data successfully converted to FHIR format";
        if (data.incentive) {
          if (data.incentive.success) {
            successMessage += ` You earned ${data.incentive.amount} RDZ incentive tokens!`;
          } else if (data.incentive.requiresAssociation) {
            successMessage += `\n\n🎁 To earn ${data.incentive.amount} RDZ tokens:\n1. Go to the Wallet tab\n2. Click 'Associate with RDZ Token'\n3. Sign the transaction in your wallet\n4. Return here to receive your tokens!`;
          }
        }
        setSuccess(successMessage);
      } else {
        setError(data.error || "Failed to translate to FHIR");
      }
    } catch (err) {
      setError("Failed to connect to FHIR translation service");
      console.error("FHIR translation error:", err);
    } finally {
      setFhirLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!genomicData) {
      setError("No genomic data available for insights generation");
      return;
    }

    setInsightsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ROOT}/ai/generate-insights`,
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
        setInsights(data.insights);

        // Show success message with incentive info
        let successMessage = "Genomic insights generated successfully";
        if (data.incentive) {
          if (data.incentive.success) {
            successMessage += ` You earned ${data.incentive.amount} RDZ incentive tokens!`;
          } else if (data.incentive.requiresAssociation) {
            successMessage += `\n\n🎁 To earn ${data.incentive.amount} RDZ tokens:\n1. Go to the Wallet tab\n2. Click 'Associate with RDZ Token'\n3. Sign the transaction in your wallet\n4. Return here to receive your tokens!`;
          }
        }
        setSuccess(successMessage);
      } else {
        setError(data.error || "Failed to generate insights");
      }
    } catch (err) {
      setError("Failed to connect to insights service");
      console.error("Insights generation error:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard");
    setTimeout(() => setSuccess(null), 2000);
  };

  const downloadFHIRData = () => {
    if (!fhirBundle) return;

    const dataBlob = new Blob([fhirBundle], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fhir-bundle-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderChatTab = () => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Chat Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          mb: 2,
          backgroundColor: "#fafafa",
          borderRadius: 2,
          minHeight: 400,
          maxHeight: 500,
        }}
      >
        {chatMessages.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Box
              sx={{
                display: "inline-block",
                p: 2,
                mb: 3,
                backgroundColor: "#e3f2fd",
                borderRadius: 3,
                maxWidth: "80%",
                textAlign: "left",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#666666",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                Ask questions about your genetic findings, health implications,
                or any concerns you may have.
              </Typography>
            </Box>
          </Box>
        ) : (
          chatMessages.map((message) => (
            <Box
              key={message.id}
              sx={{
                mb: 2,
                display: "flex",
                justifyContent:
                  message.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  maxWidth: "85%",
                  borderRadius: 3,
                  backgroundColor:
                    message.role === "user" ? "#3F37C9" : "#e3f2fd",
                  color: message.role === "user" ? "white" : "#333333",
                  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
                  position: "relative",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  {message.content}
                </Typography>
              </Box>
            </Box>
          ))
        )}
        {chatLoading && (
          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
            <Box
              sx={{
                p: 2,
                maxWidth: "85%",
                borderRadius: 3,
                backgroundColor: "#e3f2fd",
                color: "#333333",
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={16} sx={{ color: "#3F37C9" }} />
              <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
                AI is thinking...
              </Typography>
            </Box>
          </Box>
        )}
        <div ref={chatEndRef} />
      </Box>

      {/* Chat Input */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-end",
          backgroundColor: "white",
          p: 1,
          borderRadius: 3,
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Ask about your genomic data..."
          value={currentQuestion}
          onChange={(e) => setCurrentQuestion(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleChatSubmit();
            }
          }}
          disabled={chatLoading}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: "#f8f9fa",
              "& fieldset": {
                border: "none",
              },
              "&:hover fieldset": {
                border: "none",
              },
              "&.Mui-focused fieldset": {
                border: "none",
              },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleChatSubmit}
          disabled={!currentQuestion.trim() || chatLoading}
          sx={{
            minWidth: "auto",
            px: 2,
            py: 1.5,
            borderRadius: 2,
            backgroundColor: "#3F37C9",
            "&:hover": {
              backgroundColor: "#2d2a9a",
            },
            "&:disabled": {
              backgroundColor: "#e0e0e0",
            },
          }}
        >
          <SendIcon />
        </Button>
      </Box>
    </Box>
  );

  const renderFHIRTab = () => (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Genomic Data to FHIR
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Transform your genomic data into standardized FHIR resources
            including Patient, Observation, DiagnosticReport, and Procedure
            resources.
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleFHIRTranslation}
              disabled={fhirLoading || !genomicData}
              startIcon={
                fhirLoading ? <CircularProgress size={20} /> : <FHIRIcon />
              }
            >
              {fhirLoading ? "Converting..." : "Convert to FHIR"}
            </Button>

            {fhirBundle && (
              <Button
                variant="outlined"
                onClick={() => setFhirDialogOpen(true)}
                startIcon={<FHIRIcon />}
              >
                View FHIR Bundle
              </Button>
            )}
          </Box>

          {fhirBundle && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                FHIR bundle created successfully! Click "View FHIR Bundle" to
                see the complete bundle or use the copy/download buttons.
              </Typography>
            </Alert>
          )}

          {!genomicData && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No genomic data available for FHIR translation
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* FHIR Dialog */}
      <Dialog
        open={fhirDialogOpen}
        onClose={() => setFhirDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FHIRIcon color="primary" />
            FHIR R4 Resources
          </Box>
        </DialogTitle>
        <DialogContent>
          {fhirBundle && (
            <Box>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Button
                  startIcon={<CopyIcon />}
                  onClick={() => copyToClipboard(fhirBundle)}
                  size="small"
                  variant="contained"
                >
                  Copy FHIR Bundle
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={downloadFHIRData}
                  size="small"
                  variant="outlined"
                >
                  Download Bundle
                </Button>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  This is the complete FHIR R4 bundle generated from your
                  genomic data. You can copy or download this bundle for use in
                  other healthcare systems.
                </Typography>
              </Alert>

              <Paper sx={{ p: 2, maxHeight: 500, overflow: "auto" }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  FHIR Bundle (JSON)
                </Typography>
                <pre
                  style={{
                    fontSize: "12px",
                    overflow: "auto",
                    backgroundColor: "#f5f5f5",
                    padding: "12px",
                    borderRadius: "4px",
                    border: "1px solid #e0e0e0",
                    margin: 0,
                  }}
                >
                  {fhirBundle}
                </pre>
              </Paper>

              {fhirData && fhirData.summary && (
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">AI Summary</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2">{fhirData.summary}</Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFhirDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderInsightsTab = () => (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Generate Comprehensive Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            AI will analyze your genomic data and provide insights on genetic
            findings, health risks, lifestyle recommendations, and questions for
            your healthcare provider.
          </Typography>

          <Button
            variant="outlined"
            onClick={handleGenerateInsights}
            disabled={insightsLoading || !genomicData}
            startIcon={
              insightsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <InsightsIcon />
              )
            }
          >
            {insightsLoading ? "Generating..." : "Generate Insights"}
          </Button>

          {!genomicData && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No genomic data available for insights generation
            </Alert>
          )}
        </CardContent>
      </Card>

      {insights && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">AI-Generated Insights</Typography>
              <Button
                startIcon={<CopyIcon />}
                onClick={() => copyToClipboard(insights)}
                size="small"
              >
                Copy
              </Button>
            </Box>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {insights}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{ mb: 1, fontWeight: "bold", color: "#0d0d0d" }}
      >
        AI Assistant
      </Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="caption">
          <strong>Important:</strong> This AI assistant is for informational
          purposes only and should not replace professional medical advice.
          Always consult with your healthcare provider for medical decisions.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* AI Feature Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Stack
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            <Card
              onClick={() => {
                setActiveTab(0);
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
                borderRadius: 2,
                width: "100%",
                mb: 1,
                cursor: "pointer",
                border:
                  activeTab === 0
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <ChatIcon style={{ height: 40, color: "#3F37C9" }} />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: activeTab === 0 ? "#3F37C9" : "inherit",
                fontWeight: activeTab === 0 ? "bold" : "normal",
              }}
            >
              Chat Assistant
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
              onClick={() => {
                setActiveTab(1);
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
                borderRadius: 2,
                width: "100%",
                mb: 1,
                cursor: "pointer",
                border:
                  activeTab === 1
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <FHIRIcon style={{ height: 40, color: "#3F37C9" }} />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: activeTab === 1 ? "#3F37C9" : "inherit",
                fontWeight: activeTab === 1 ? "bold" : "normal",
              }}
            >
              FHIR Translation
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
              onClick={() => {
                setActiveTab(2);
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
                borderRadius: 2,
                width: "100%",
                mb: 1,
                cursor: "pointer",
                border:
                  activeTab === 2
                    ? "3px solid #3F37C9"
                    : "2px solid transparent",
                "&:hover": {
                  border: "2px solid #3F37C9",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <InsightsIcon style={{ height: 40, color: "#3F37C9" }} />
            </Card>
            <Typography
              variant="caption"
              sx={{
                color: activeTab === 2 ? "#3F37C9" : "inherit",
                fontWeight: activeTab === 2 ? "bold" : "normal",
              }}
            >
              Genomic Insights
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      {/* Tab Content */}
      {activeTab === 0 && renderChatTab()}
      {activeTab === 1 && renderFHIRTab()}
      {activeTab === 2 && renderInsightsTab()}
    </Box>
  );
};

export default AITab;
