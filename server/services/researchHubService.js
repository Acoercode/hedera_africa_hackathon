const axios = require('axios');

class ResearchHubService {
  constructor() {
    this.baseURL = 'https://backend.prod.researchhub.com/api';
    this.requestDelay = 500; // 500ms between requests to be respectful
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting for ResearchHub API compliance
   */
  async rateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.requestDelay) {
      const remainingDelay = this.requestDelay - elapsed;
      await new Promise(resolve => setTimeout(resolve, remainingDelay));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Search ResearchHub for papers related to a condition
   * @param {string} query - The search query (condition)
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise<Array>} Array of research papers
   */
  async searchPapers(query, maxResults = 5) {
    try {
      await this.rateLimit();

      console.log(`🔍 Searching ResearchHub for: ${query}`);

      const response = await axios.get(`${this.baseURL}/search/suggest/`, {
        params: {
          q: query,
          index: 'hub,paper,user,post' // Search across all indexes but we'll filter for papers
        }
      });

      // Filter for papers only and format the results
      const papers = response.data
        .filter(item => item.entity_type === 'paper')
        .slice(0, maxResults)
        .map(item => this.formatPaper(item));

      console.log(`📊 Found ${papers.length} ResearchHub papers for: ${query}`);
      return papers;

    } catch (error) {
      console.error(`❌ Error searching ResearchHub for ${query}:`, error.message);
      return [];
    }
  }

  /**
   * Format ResearchHub paper data to a consistent format
   */
  formatPaper(paper) {
    return {
      id: paper.id,
      title: paper.display_name || 'Untitled',
      authors: paper.authors || [],
      doi: paper.doi || null,
      citations: paper.citations || 0,
      datePublished: paper.date_published || paper.created_date || null,
      source: 'ResearchHub',
      url: paper.doi 
        ? `https://www.researchhub.com/paper/${paper.id}` 
        : `https://www.researchhub.com/paper/${paper.id}`,
      openalexId: paper.openalex_id || null,
      score: paper._score || 0,
    };
  }

  /**
   * Search for trending papers related to a condition
   * This uses the ResearchHub API to find relevant research
   */
  async searchRelevantPapers(condition, maxResults = 5) {
    try {
      if (!condition) {
        return [];
      }

      console.log(`📚 Searching ResearchHub for condition: ${condition}`);

      // Try multiple search strategies
      const searchQueries = [
        condition, // Direct condition search
        `${condition} treatment`, // Treatment-focused
        `${condition} research`, // Research-focused
        `${condition} clinical trial`, // Clinical trial-focused
      ];

      const allPapers = [];

      // Search with different queries to get diverse results
      for (const query of searchQueries.slice(0, 2)) { // Limit to 2 queries to avoid rate limits
        const papers = await this.searchPapers(query, Math.ceil(maxResults / 2));
        allPapers.push(...papers);
        
        if (allPapers.length >= maxResults) {
          break;
        }
      }

      // Remove duplicates based on paper ID
      const uniquePapers = allPapers.filter((paper, index, self) =>
        index === self.findIndex(p => p.id === paper.id)
      );

      // Sort by relevance score and citations
      uniquePapers.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.citations - a.citations;
      });

      return uniquePapers.slice(0, maxResults);

    } catch (error) {
      console.error('❌ Error searching ResearchHub papers:', error.message);
      return [];
    }
  }
}

module.exports = new ResearchHubService();

