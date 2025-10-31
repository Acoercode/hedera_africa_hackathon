const axios = require('axios');

class PubMedService {
  constructor() {
    this.baseURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    this.requestDelay = 1000; // 1 second between requests to be safe
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting for NCBI API compliance
   */
  async rateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.requestDelay) {
      const remainingDelay = this.requestDelay - elapsed;
      console.log(`⏳ PubMed rate limiting: Waiting for ${remainingDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, remainingDelay));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Search PubMed for relevant articles
   */
  async searchArticles(query, maxResults = 5) {
    try {
      await this.rateLimit();

      console.log(`🔍 Searching PubMed for: ${query}`);

      const response = await axios.get(`${this.baseURL}/esearch.fcgi`, {
        params: {
          db: 'pubmed',
          term: query,
          retmax: maxResults,
          retmode: 'json',
          sort: 'relevance',
          tool: 'RDZHealth',
          email: 'contact@rdzhealth.com'
        }
      });

      const pmids = response.data.esearchresult.idlist;
      if (pmids && pmids.length > 0) {
        console.log(`📊 Found ${pmids.length} PubMed articles for: ${query}`);
        return await this.fetchArticleDetails(pmids);
      } else {
        console.log(`No PubMed articles found for: ${query}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error searching PubMed for ${query}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch detailed article information
   */
  async fetchArticleDetails(pmids) {
    try {
      await this.rateLimit();

      const ids = pmids.join(',');
      console.log(`📋 Fetching PubMed details for PMIDs: ${ids}`);

      const response = await axios.get(`${this.baseURL}/efetch.fcgi`, {
        params: {
          db: 'pubmed',
          id: ids,
          retmode: 'xml',
          tool: 'RDZHealth',
          email: 'contact@rdzhealth.com'
        }
      });

      const articles = this.parsePubMedXML(response.data);
      return articles;
    } catch (error) {
      console.error('❌ Error fetching PubMed details:', error.message);
      return [];
    }
  }

  /**
   * Parse PubMed XML response
   */
  parsePubMedXML(xmlData) {
    const articles = [];

    try {
      console.log('📋 Parsing PubMed XML response...');

      // Simple XML parsing for PubMed data
      const parser = require('xml2js');
      const xmlParser = new parser.Parser({ explicitArray: false, mergeAttrs: true });
      
      xmlParser.parseString(xmlData, (err, result) => {
        if (err) {
          console.error('XML parsing error:', err);
          return;
        }

        const pubmedArticleSet = result.PubmedArticleSet;
        if (!pubmedArticleSet || !pubmedArticleSet.PubmedArticle) {
          console.log('No PubmedArticle found in XML.');
          return;
        }

        const articlesArray = Array.isArray(pubmedArticleSet.PubmedArticle)
          ? pubmedArticleSet.PubmedArticle
          : [pubmedArticleSet.PubmedArticle];

        articlesArray.forEach(article => {
          const parsedArticle = this.extractArticleInfo(article);
          if (parsedArticle) {
            articles.push(parsedArticle);
            console.log(`✅ Parsed article: ${parsedArticle.title.substring(0, 50)}...`);
          }
        });
        console.log(`📊 Successfully parsed ${articles.length} PubMed articles.`);
      });
    } catch (error) {
      console.error('❌ Error parsing PubMed XML:', error.message);
    }

    return articles;
  }

  /**
   * Extract article information from PubMed XML
   */
  extractArticleInfo(article) {
    try {
      const medlineCitation = article.MedlineCitation;
      const articleData = medlineCitation.Article;
      const pmid = medlineCitation.PMID;
      const pmidValue = pmid && pmid.constructor === Object ? pmid._ : pmid;

      if (!pmidValue) {
        console.log('❌ No PMID found in article');
        return null;
      }

      // Extract title
      const title = articleData.ArticleTitle || 'No title available';

      // Extract authors
      let authors = [];
      if (articleData.AuthorList && articleData.AuthorList.Author) {
        const authorArray = Array.isArray(articleData.AuthorList.Author)
          ? articleData.AuthorList.Author
          : [articleData.AuthorList.Author];
        
        authors = authorArray.map(author => {
          const lastName = author.LastName || '';
          const firstName = author.ForeName || '';
          const initials = author.Initials || '';
          return `${lastName} ${firstName} ${initials}`.trim();
        });
      }

      // Extract journal
      const journal = articleData.Journal ? articleData.Journal.Title : 'Unknown Journal';

      // Extract publication date
      let pubDate = 'Unknown date';
      if (articleData.Journal && articleData.Journal.JournalIssue && articleData.Journal.JournalIssue.PubDate) {
        const pubDateObj = articleData.Journal.JournalIssue.PubDate;
        if (pubDateObj.Year) {
          pubDate = pubDateObj.Year;
          if (pubDateObj.Month) pubDate += ` ${pubDateObj.Month}`;
          if (pubDateObj.Day) pubDate += ` ${pubDateObj.Day}`;
        }
      }

      // Extract abstract
      let abstract = '';
      if (articleData.Abstract && articleData.Abstract.AbstractText) {
        if (Array.isArray(articleData.Abstract.AbstractText)) {
          abstract = articleData.Abstract.AbstractText.map(text => 
            typeof text === 'string' ? text : text._
          ).join(' ');
        } else {
          abstract = typeof articleData.Abstract.AbstractText === 'string' 
            ? articleData.Abstract.AbstractText 
            : articleData.Abstract.AbstractText._;
        }
      }

      // Extract keywords
      let keywords = [];
      if (medlineCitation.KeywordList && medlineCitation.KeywordList.Keyword) {
        const keywordArray = Array.isArray(medlineCitation.KeywordList.Keyword)
          ? medlineCitation.KeywordList.Keyword
          : [medlineCitation.KeywordList.Keyword];
        keywords = keywordArray.map(kw => typeof kw === 'string' ? kw : kw._);
      }

      // Extract MeSH terms
      let meshTerms = [];
      if (medlineCitation.MeshHeadingList && medlineCitation.MeshHeadingList.MeshHeading) {
        const meshArray = Array.isArray(medlineCitation.MeshHeadingList.MeshHeading)
          ? medlineCitation.MeshHeadingList.MeshHeading
          : [medlineCitation.MeshHeadingList.MeshHeading];
        meshTerms = meshArray.map(mesh => mesh.DescriptorName);
      }

      return {
        pmid: pmidValue,
        title: title,
        authors: authors,
        journal: journal,
        pubDate: pubDate,
        abstract: abstract.substring(0, 1000), // Limit abstract length
        keywords: keywords,
        meshTerms: meshTerms,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmidValue}/`,
        relevanceScore: this.calculateRelevanceScore(title, abstract, keywords, meshTerms)
      };

    } catch (error) {
      console.error('❌ Error extracting article info:', error.message);
      return null;
    }
  }

  /**
   * Calculate relevance score for articles
   */
  calculateRelevanceScore(title, abstract, keywords, meshTerms) {
    let score = 0;
    const text = `${title} ${abstract} ${keywords.join(' ')} ${meshTerms.join(' ')}`.toLowerCase();
    
    // High relevance terms
    const highRelevanceTerms = ['treatment', 'therapy', 'clinical trial', 'diagnosis', 'prognosis', 'management', 'outcome'];
    const mediumRelevanceTerms = ['case report', 'review', 'study', 'analysis', 'prevalence', 'incidence'];
    
    highRelevanceTerms.forEach(term => {
      if (text.includes(term)) score += 3;
    });
    
    mediumRelevanceTerms.forEach(term => {
      if (text.includes(term)) score += 1;
    });
    
    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Generate search queries from genomic data and ClinVar results
   */
  generateSearchQueries(genomicData, clinvarResults) {
    const queries = [];

    // Add condition-based queries
    if (genomicData.condition) {
      queries.push({
        query: `${genomicData.condition} treatment management`,
        type: 'treatment',
        priority: 'high'
      });
      queries.push({
        query: `${genomicData.condition} clinical trial`,
        type: 'clinical_trial',
        priority: 'high'
      });
    }

    // Add gene-based queries from ClinVar results
    const uniqueGenes = [...new Set(clinvarResults.map(result => result.geneSymbol))];
    uniqueGenes.forEach(gene => {
      if (gene && gene !== 'Unknown') {
        queries.push({
          query: `${gene} gene therapy treatment`,
          type: 'gene_therapy',
          priority: 'medium'
        });
      }
    });

    // Add disease-based queries from ClinVar results
    const uniqueDiseases = [...new Set(clinvarResults.map(result => result.diseaseName))];
    uniqueDiseases.forEach(disease => {
      if (disease && disease !== 'Unknown') {
        queries.push({
          query: `${disease} latest research 2024`,
          type: 'latest_research',
          priority: 'medium'
        });
      }
    });

    // Add African population-specific queries
    if (genomicData.condition) {
      queries.push({
        query: `${genomicData.condition} African population prevalence`,
        type: 'population_study',
        priority: 'medium'
      });
    }

    return queries;
  }

  /**
   * Search for relevant research articles
   */
  async searchRelevantArticles(genomicData, clinvarResults) {
    try {
      console.log('📚 Starting PubMed research search...');

      const searchQueries = this.generateSearchQueries(genomicData, clinvarResults);
      const allArticles = [];

      // Prioritize high-priority queries
      const highPriorityQueries = searchQueries.filter(q => q.priority === 'high');
      const mediumPriorityQueries = searchQueries.filter(q => q.priority === 'medium');

      // Search high-priority queries first
      for (const query of highPriorityQueries) {
        console.log(`🔍 Searching PubMed for: ${query.query} (${query.type})`);
        const articles = await this.searchArticles(query.query, 3);
        articles.forEach(article => {
          article.searchQuery = query.query;
          article.searchType = query.type;
          article.searchPriority = query.priority;
        });
        allArticles.push(...articles);
      }

      // Search medium-priority queries
      for (const query of mediumPriorityQueries.slice(0, 3)) { // Limit to 3 medium priority queries
        console.log(`🔍 Searching PubMed for: ${query.query} (${query.type})`);
        const articles = await this.searchArticles(query.query, 2);
        articles.forEach(article => {
          article.searchQuery = query.query;
          article.searchType = query.type;
          article.searchPriority = query.priority;
        });
        allArticles.push(...articles);
      }

      // Remove duplicates and sort by relevance
      const uniqueArticles = allArticles.filter((article, index, self) =>
        index === self.findIndex(a => a.pmid === article.pmid)
      );

      // Sort by relevance score and priority
      uniqueArticles.sort((a, b) => {
        if (a.searchPriority === 'high' && b.searchPriority !== 'high') return -1;
        if (b.searchPriority === 'high' && a.searchPriority !== 'high') return 1;
        return b.relevanceScore - a.relevanceScore;
      });

      console.log(`✅ Found ${uniqueArticles.length} relevant PubMed articles`);
      return uniqueArticles.slice(0, 10); // Return top 10 most relevant

    } catch (error) {
      console.error('❌ Error searching PubMed articles:', error.message);
      return [];
    }
  }

  /**
   * Generate fallback research data when PubMed API fails
   */
  generateFallbackResearch(genomicData, clinvarResults) {
    const fallbackArticles = [];

    if (genomicData.condition && genomicData.condition.toLowerCase().includes('fanconi')) {
      fallbackArticles.push(
        {
          pmid: 'fallback_001',
          title: 'Fanconi anemia: realizing hematopoietic cure',
          authors: ['Satty AM'],
          journal: 'Blood',
          pubDate: '2024',
          abstract: 'Recent advances in hematopoietic stem cell transplantation and gene therapy offer new hope for Fanconi anemia patients. This review discusses current treatment strategies and emerging therapeutic approaches.',
          keywords: ['Fanconi anemia', 'hematopoietic stem cell transplantation', 'gene therapy', 'treatment'],
          meshTerms: ['Fanconi Anemia', 'Hematopoietic Stem Cell Transplantation', 'Gene Therapy'],
          url: 'https://pubmed.ncbi.nlm.nih.gov/39298158/',
          relevanceScore: 8,
          searchQuery: 'Fanconi anemia treatment management',
          searchType: 'treatment',
          searchPriority: 'high',
          isFallback: true
        },
        {
          pmid: 'fallback_002',
          title: 'Fanconi Anemia Signaling and Cancer',
          authors: ['Nepal M', 'Che R', 'Zhang J', 'Ma C', 'Fei P'],
          journal: 'Trends Cancer',
          pubDate: '2017',
          abstract: 'The extremely high cancer incidence associated with patients suffering from Fanconi anemia demonstrates the importance of FA genes in tumor suppression. This review explores the molecular mechanisms and therapeutic implications.',
          keywords: ['Fanconi anemia', 'cancer', 'tumor suppression', 'molecular mechanisms'],
          meshTerms: ['Fanconi Anemia', 'Neoplasms', 'Tumor Suppressor Proteins'],
          url: 'https://pubmed.ncbi.nlm.nih.gov/29198440/',
          relevanceScore: 7,
          searchQuery: 'Fanconi anemia cancer risk',
          searchType: 'latest_research',
          searchPriority: 'medium',
          isFallback: true
        },
        {
          pmid: 'fallback_003',
          title: 'Multifaceted Fanconi Anemia Signaling',
          authors: ['Che R', 'Zhang J', 'Nepal M', 'Han B', 'Fei P'],
          journal: 'Trends Genet',
          pubDate: '2018',
          abstract: 'Fanconi anemia is characterized by bone marrow failure, developmental abnormalities, and cancer predisposition. This review discusses the complex signaling networks involved in FA pathway regulation.',
          keywords: ['Fanconi anemia', 'signaling', 'bone marrow failure', 'developmental abnormalities'],
          meshTerms: ['Fanconi Anemia', 'Signal Transduction', 'Bone Marrow Diseases'],
          url: 'https://pubmed.ncbi.nlm.nih.gov/29254745/',
          relevanceScore: 6,
          searchQuery: 'Fanconi anemia molecular mechanisms',
          searchType: 'latest_research',
          searchPriority: 'medium',
          isFallback: true
        }
      );
    }

    console.log(`📊 Generated ${fallbackArticles.length} fallback PubMed articles`);
    return fallbackArticles;
  }
}

module.exports = new PubMedService();
