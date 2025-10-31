import React from "react";
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
} from "@mui/icons-material";

interface ResearchArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  abstract: string;
  keywords?: string[];
  url: string;
  relevanceScore?: number;
  searchType?: string;
  searchPriority?: string;
}

interface PubMedFeedProps {
  researchArticles: ResearchArticle[];
  loading?: boolean;
  maxResults?: number;
}

export const PubMedFeed: React.FC<PubMedFeedProps> = ({
  researchArticles = [],
  loading = false,
  maxResults = 10,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Searching PubMed...
        </Typography>
      </Box>
    );
  }

  if (researchArticles.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "Date unknown";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    } catch {
      return dateString;
    }
  };

  const displayArticles = researchArticles.slice(0, maxResults);

  return (
    <Stack spacing={2}>
      {displayArticles.map((article) => (
        <Card
          key={article.pmid}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            "&:hover": {
              boxShadow: 2,
              borderColor: "#2E7D32", // Green border on hover
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
              label="PubMed"
              size="small"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                backgroundColor: "#2E7D32", // Green
                color: "white",
              }}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              {article.pubDate && (
                <Chip
                  label={formatDate(article.pubDate)}
                  size="small"
                  sx={{ height: 20, fontSize: "0.7rem" }}
                />
              )}
              {article.relevanceScore && (
                <Chip
                  label={`Relevance: ${article.relevanceScore}/10`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    backgroundColor:
                      article.relevanceScore >= 8
                        ? "#4caf50"
                        : article.relevanceScore >= 6
                          ? "#ff9800"
                          : "#ff5722",
                    color: "white",
                  }}
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
            {typeof article.title === "string"
              ? article.title
              : String(article.title || "Untitled")}
          </Typography>

          {article.authors &&
            Array.isArray(article.authors) &&
            article.authors.length > 0 && (
              <Typography
                variant="caption"
                sx={{ color: "#666", display: "block", mb: 1 }}
              >
                {article.authors
                  .slice(0, 4)
                  .map((author: any) =>
                    typeof author === "string" ? author : String(author || ""),
                  )
                  .filter(Boolean)
                  .join(", ")}
                {article.authors.length > 4 ? " et al." : ""}
              </Typography>
            )}

          {article.journal && (
            <Typography
              variant="caption"
              sx={{ color: "#666", display: "block", mb: 1 }}
            >
              {typeof article.journal === "string"
                ? article.journal
                : String(article.journal || "")}
            </Typography>
          )}

          {article.abstract && (
            <Typography
              variant="body2"
              sx={{
                color: "#666",
                display: "block",
                mb: 1.5,
                fontSize: "0.875rem",
                lineHeight: 1.5,
              }}
            >
              {(() => {
                const abstractStr =
                  typeof article.abstract === "string"
                    ? article.abstract
                    : String(article.abstract || "");
                return abstractStr.length > 200
                  ? `${abstractStr.substring(0, 200)}...`
                  : abstractStr;
              })()}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
            <Link
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
                color: "#2E7D32", // Green
                fontSize: "0.875rem",
                fontWeight: 500,
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              View on PubMed
              <OpenInNewIcon sx={{ ml: 0.5, fontSize: "0.875rem" }} />
            </Link>
            <Typography
              variant="caption"
              sx={{ color: "#999", fontSize: "0.75rem" }}
            >
              PMID:{" "}
              {typeof article.pmid === "string"
                ? article.pmid
                : String(article.pmid || "")}
            </Typography>
          </Box>
        </Card>
      ))}
    </Stack>
  );
};
