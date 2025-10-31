import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  Link,
  Chip,
  Stack,
} from "@mui/material";
import {
  Article as ArticleIcon,
  OpenInNew as OpenInNewIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { apiService } from "../services/api";
import { useWalletInterface } from "../services/wallets/useWalletInterface";

interface ResearchPaper {
  id: number;
  title: string;
  authors: string[];
  doi: string | null;
  citations: number;
  datePublished: string | null;
  source: string;
  url: string;
  score?: number;
}

interface ResearchFeedProps {
  condition: string;
  maxResults?: number;
}

export const ResearchFeed: React.FC<ResearchFeedProps> = ({
  condition,
  maxResults = 5,
}) => {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accountId } = useWalletInterface();

  useEffect(() => {
    const fetchResearch = async () => {
      if (!condition) return;

      setLoading(true);
      setError(null);

      try {
        const response = await apiService.searchResearchHub(
          condition,
          maxResults,
          accountId || undefined,
        );

        if (response.success) {
          setPapers(response.papers || []);
        } else {
          setError("Failed to load research papers");
        }
      } catch (err) {
        console.error("Error fetching research papers:", err);
        setError("Unable to load research papers at this time");
      } finally {
        setLoading(false);
      }
    };

    fetchResearch();
  }, [condition, maxResults, accountId]);

  if (!condition) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Searching ResearchHub...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Card
        sx={{
          p: 2,
          borderRadius: 2,
          mb: 2,
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Card>
    );
  }

  if (papers.length === 0) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date unknown";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <SchoolIcon sx={{ mr: 1, color: "#3F37C9" }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "#0d0d0d",
            fontSize: "1.1rem",
          }}
        >
          Related Research Papers
        </Typography>
      </Box>

      <Stack spacing={2}>
        {papers.map((paper) => (
          <Card
            key={paper.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              "&:hover": {
                boxShadow: 2,
                borderColor: "#3F37C9",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                mb: 1,
              }}
            >
              <Chip
                label="ResearchHub"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  backgroundColor: "#3F37C9",
                  color: "white",
                }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                {paper.datePublished && (
                  <Chip
                    label={formatDate(paper.datePublished)}
                    size="small"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                )}
                {paper.citations > 0 && (
                  <Chip
                    label={`${paper.citations} citations`}
                    size="small"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                )}
              </Box>
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: "600",
                mb: 1,
                fontSize: "1rem",
                color: "#0d0d0d",
                lineHeight: 1.3,
              }}
            >
              {paper.title}
            </Typography>

            {paper.authors && paper.authors.length > 0 && (
              <Typography
                variant="caption"
                sx={{ color: "#666", display: "block", mb: 1.5 }}
              >
                {paper.authors.slice(0, 4).join(", ")}
                {paper.authors.length > 4 ? " et al." : ""}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Link
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "#3F37C9",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                View on ResearchHub
                <OpenInNewIcon sx={{ ml: 0.5, fontSize: "0.875rem" }} />
              </Link>
              {paper.doi && (
                <Typography
                  variant="caption"
                  sx={{ color: "#999", fontSize: "0.75rem" }}
                >
                  DOI: {paper.doi}
                </Typography>
              )}
            </Box>
          </Card>
        ))}
      </Stack>

      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography
          variant="caption"
          sx={{ color: "#666", fontSize: "0.75rem" }}
        >
          Research papers powered by{" "}
          <Link
            href="https://www.researchhub.com"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#3F37C9", textDecoration: "none" }}
          >
            ResearchHub
          </Link>
          . Updated automatically based on your condition.
        </Typography>
      </Box>
    </Box>
  );
};
